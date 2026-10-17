---
title: "How I Architected a Stripe Connect Platform for 100+ Government Contractors"
description: "The Stripe Connect architecture behind a platform serving more than a hundred government contractors."
date: 2024-09-27
featured: true
tags: ["stripe", "payments", "architecture"]
---

<!-- First published on Hashnode (https://amjedidiah.hashnode.dev/stripe-connect-contractor-platform-architecture). This copy is canonical; point the Hashnode post's canonical URL here. -->

We've all integrated Stripe before. Drop in a PaymentElement, call `paymentIntents.create`, handle the webhook, done.

Now imagine this: a government agency needs a platform where over a hundred contractors get paid for completed work. Money splits among multiple contractors on a single job, each with configurable percentage shares. You need the right 1099 form and reporting data for each contractor. You need refunds that touch three separate financial ledgers. And when a refund fails halfway through reversing transfers, the system needs to recover gracefully instead of leaving money in limbo.

That's what I built. I can't share the codebase (NDA), but I can walk through major architectural decision, what worked, and what I'd do differently.

## Why Custom Connect Accounts

Standard Stripe is a straight line. This platform is a triangle: the agency, the contractors, and the payers. Money flows from payers through the platform to the correct contractors, with the platform taking a configurable fee.

Stripe Connect offers Standard, Express, and Custom account types. **Custom** fit our requirements. We needed platform-controlled onboarding and payouts, support for multiple business types, EIN verification, and a unified dashboard.

That choice was architecture-dependent. New integrations should also evaluate Accounts v2; this example uses the legacy typed Custom API.

## Registration: Keeping PII Off Your Server

Custom accounts need verified identity data, but storing raw SSNs and EINs is a compliance liability. The solution: **Stripe.js account and person tokens.** The client tokenizes sensitive identity data directly with Stripe and sends only opaque tokens to the backend. Tokens do not cover configuration such as payout schedules, so those settings remain server-side:

```typescript
const account = await stripe.accounts.create({
  country: "US",
  type: "custom",
  capabilities: {
    // Request only applicable tax-reporting capabilities.
    tax_reporting_us_1099_misc: { requested: true },
    transfers: { requested: true },
    card_payments: { requested: true },
  },
  account_token, // Tokenized on the client — server never sees raw PII
  settings: {
    payouts: { schedule: { interval: "weekly", weekly_anchor: "friday" } },
  },
});

if (person_token)
  await stripe.accounts.createPerson(account.id, { person_token });
```

Capabilities are requested upfront, but Stripe enables them asynchronously as verification progresses. Payout schedules are set at creation time to match the agency's weekly payment cycle.

## Embedded Onboarding

After account creation, contractors need to complete identity verification. Instead of building custom forms for every field Stripe requires, I used **Connect embedded components**:

```tsx
<ConnectComponentsProvider connectInstance={stripeConnectInstance}>
  <ConnectAccountOnboarding onExit={checkOnboardingStatus} />
</ConnectComponentsProvider>
```

The backend creates an Account Session with `account_onboarding` enabled, plus only the payments and payouts components the connected account needs. Stripe handles uploads, progressive disclosure, and verification. `onExit` means the flow ended, not that every requirement was satisfied. The callback checks the account server-side; only `details_submitted`, `charges_enabled`, `payouts_enabled`, and requested capability statuses move a contractor to the main dashboard. Otherwise, the contractor can resume onboarding. Biggest time-saver in the project.

## The Generic Connect Proxy

A Connect platform needs endpoints for balance, payouts, bank accounts, tax settings, withdrawals; each a different Stripe API call. Instead of dozens of routes, I built one:

```typescript
router.use("/:object/:action", requireConnectOperation);
```

The controller maps an allowlisted operation to a known Stripe call and passes `{stripeAccount: user.accountId}` to scope it to the connected account. `POST /connect/payouts/create`, `GET /connect/balance/retrieve`, and `GET /connect/payouts/list?limit=100` can share one route. Nested resources such as `tax.settings` are split on the dot. The route still needs operation-level authorization, validation, rate limits, and ownership checks.

> Never expose the full Stripe API surface through an arbitrary dynamic dispatcher.

## Multi-Contractor Payment Splits

A single job can involve multiple contractors. When the customer pays, the platform deducts the platform fee (5–30%), splits the remainder by percentage shares (or equally if unspecified), deducts any outstanding credit from prior failed refund reversals, and transfers each contractor's net share:

```typescript
const balance = Math.floor((1 - gig.platformFeePercentage) * paymentIntent.amount);

for (const contractor of contractors) {
  const share = Math.floor(contractor.percentageShare * balance);
  const appliedCredit = Math.min(share, contractor.credit);
  const netShare = share - appliedCredit;
  await debitCreditAtomically(contractor.id, appliedCredit);
  if (netShare <= 0) continue; // Share absorbed by debt recovery

  await stripe.transfers.create({
    amount: netShare,
    currency: "usd",
    destination: contractor.accountId,
    transfer_group: gigId,
    source_transaction: paymentIntent.latest_charge,
  }, {
    idempotencyKey: `${paymentIntent.id}_${contractor.accountId}`,
  });
}
```

`transfer_group` ties all transfers for a job together, critical for audits. `source_transaction` links each transfer to the original charge and coordinates fund availability. It does not automatically reverse the transfer when the charge is refunded. Assign any rounding remainder deliberately; flooring every share can strand cents.

## The Credit System: Graceful Refund Recovery

This is the piece of architecture I'm most proud of, because it solves a problem you won't find in any Stripe tutorial.

When you refund a split payment, you reverse each contractor's transfer. But what if the third reversal fails because that contractor's Stripe balance is zero; they already withdrew the money?

The naive approach: fail the entire refund. Tell the customer "sorry, we can't refund you." Unacceptable.

My approach: **record the unrecoverable amount as credit on the contractor's account, and deduct it from their next transfer.**

```typescript
try {
  for (const transfer of transfers.data) {
    await stripe.transfers.createReversal(transfer.id, {
      description: `Refund: ${refund_reason}`,
      amount: transfer.amount,
    });
    monitoredTransfers = monitoredTransfers.filter((t) => t.id !== transfer.id);
  }
} catch (error) {
  const failedAccounts = monitoredTransfers.map((t) => ({
    accountId: t.destination,
    credit: t.amount,
  }));
  await addUsersCredit(failedAccounts); // Record the debt
}
```

The `credit` field on the User model starts at zero. When a reversal fails specifically because the connected account lacks funds, it increases. Transient and validation errors are retried or escalated instead of becoming debt. On the next job transfer, credit is atomically reduced by the amount applied before the transfer is made. This is a platform ledger, not a Stripe feature; its terms and recovery policy need legal and finance review.

## Tax Reporting (1099)

Three things made the tax work tractable:

**Request only the applicable tax-reporting capabilities** at account creation. Contractor service payments commonly use Form 1099-NEC; 1099-MISC, 1099-K, thresholds, entity exceptions, and state rules differ. Stripe Tax and 1099 reporting are separate products, so confirm the form and filing responsibility with a tax professional.

**Calculate sales tax at payment time** using Stripe Tax. A calculation is not itself the tax transaction to reverse:

```typescript
const calculation = await stripe.tax.calculations.create({
  currency: "usd",
  line_items: [{ amount, reference: "L1" }],
  customer_details: { ip_address: customerIP },
});

const transaction = await stripe.tax.transactions.createFromCalculation({
  calculation: calculation.id,
  reference: `payment_${paymentIntent.id}`,
});
```

Store `transaction.id`, not just the calculation ID. On a refund, reverse that transaction with a unique reference. Alternatively, attach the calculation to the PaymentIntent so Stripe records the transaction and refund reversal automatically.

**Expose the right reporting interface.** Platforms can generate `connected_account_tax.transactions.itemized.2` reports, while tax-form filing and delivery use separate workflows. The frontend can surface `tax.settings.status_details.pending.missing_fields`.

## The Refund Architecture

Refunds on a Connect platform aren't a single API call. They're a cascading sequence:

1. **Refund the charge**: `stripe.refunds.create` against the original charge.
2. **Reverse the tax transaction**: using the stored tax transaction ID and a unique reversal reference.
3. **Reverse all transfers** in the transfer group: with credit recovery if any reversal fails.

Each operation needs its own durable state and idempotency key. A refund can be pending if the platform lacks available balance; the customer also waits on their bank or card network. There is no universal Stripe rule that the charge refund, tax reversal, and transfer reversal must run in one blocking sequence. The system records the refund, tax-reversal, and transfer-reversal outcomes independently, retries safe failures, and alerts on unrecoverable ones.

Partial refunds are trickier, so transfer allocation remains a reviewed operation rather than an unsafe heuristic.

## Scoped Webhook Endpoints

The platform runs separate endpoints with separate secrets: an account-scoped endpoint for platform events and a Connect endpoint for events from connected accounts.

The Connect handler processes `account.updated` and `tax.settings.updated`. Because the payment flow above creates the charge on the platform, the platform endpoint processes `payment_intent.succeeded` and starts the transfer workflow. A direct-charge integration would scope that event differently.

Every endpoint verifies signatures, deduplicates event IDs, and checks `livemode`. Test events are acknowledged and ignored in production rather than rejected repeatedly.

## What I'd Do Differently

- **Build reconciliation from day one**: a daily job comparing internal records against Stripe's Balance Transactions API.
- **Use an outbox or durable job state**: the webhook should enqueue allocation work, not perform an unbounded transfer loop inline.

## The Takeaway

Building a payment platform isn't the same as adding payments to an app. The moment you have multiple parties, regulated money movement, and tax obligations, you're building financial infrastructure.

The architecture that survived production: platform-controlled accounts, embedded onboarding, an allowlisted proxy, a credit ledger, and scoped webhooks with durable, idempotent transfer jobs.

If you're building something similar: keep PII off your servers with account tokens, request tax capabilities at account creation (not later), and design your refund flow before you design your payment flow. Refunds are where payment platforms break.

> Your future self, and your compliance team, will thank you.
