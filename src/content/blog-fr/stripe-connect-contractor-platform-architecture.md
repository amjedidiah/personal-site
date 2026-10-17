---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Comment j’ai conçu une plateforme Stripe Connect pour plus de 100 prestataires du secteur public"
description: "L’architecture Stripe Connect d’une plateforme au service de plus d’une centaine de prestataires du secteur public."
---

Nous avons tous déjà intégré Stripe. On ajoute un PaymentElement, on appelle `paymentIntents.create`, on gère le webhook, et c’est terminé.

Imaginez maintenant ceci : une agence gouvernementale a besoin d’une plateforme où plus d’une centaine de prestataires sont payés pour le travail réalisé. Sur une même mission, l’argent est réparti entre plusieurs prestataires, chacun avec une part en pourcentage configurable. Il faut le bon formulaire 1099 et les bonnes données de déclaration pour chaque prestataire. Il faut des remboursements qui touchent trois registres financiers distincts. Et quand un remboursement échoue à mi-chemin de l’annulation des transferts, le système doit s’en remettre proprement au lieu de laisser de l’argent dans les limbes.

C’est ce que j’ai construit. Je ne peux pas partager le code (NDA), mais je peux détailler les grandes décisions d’architecture, ce qui a fonctionné et ce que je ferais différemment.

## Pourquoi des comptes Connect Custom

Un Stripe classique, c’est une ligne droite. Cette plateforme, c’est un triangle : l’agence, les prestataires et les payeurs. L’argent circule des payeurs vers les bons prestataires en passant par la plateforme, qui prélève une commission configurable.

Stripe Connect propose les types de comptes Standard, Express et Custom. **Custom** correspondait à nos besoins. Il nous fallait un onboarding et des virements contrôlés par la plateforme, la prise en charge de plusieurs types d’entreprise, la vérification de l’EIN et un tableau de bord unifié.

Ce choix dépendait de l’architecture. Les nouvelles intégrations devraient aussi évaluer Accounts v2 ; cet exemple utilise l’ancienne API typée des comptes Custom.

## Inscription : garder les données personnelles hors de vos serveurs

Les comptes Custom exigent des données d’identité vérifiées, mais stocker des numéros SSN et EIN en clair est un risque de conformité. La solution : **les jetons de compte et de personne de Stripe.js.** Le client transforme les données d’identité sensibles en jetons directement auprès de Stripe et n’envoie au back-end que des jetons opaques. Les jetons ne couvrent pas la configuration, comme le calendrier des virements, donc ces paramètres restent côté serveur :

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

Les capacités sont demandées dès le départ, mais Stripe les active de façon asynchrone au fil de la vérification. Le calendrier des virements est fixé à la création pour correspondre au cycle de paiement hebdomadaire de l’agence.

## Un onboarding intégré

Une fois le compte créé, les prestataires doivent faire vérifier leur identité. Plutôt que de construire des formulaires sur mesure pour chaque champ exigé par Stripe, j’ai utilisé les **composants intégrés de Connect** :

```tsx
<ConnectComponentsProvider connectInstance={stripeConnectInstance}>
  <ConnectAccountOnboarding onExit={checkOnboardingStatus} />
</ConnectComponentsProvider>
```

Le back-end crée une Account Session avec `account_onboarding` activé, plus uniquement les composants de paiement et de virement dont le compte connecté a besoin. Stripe gère les téléversements, l’affichage progressif et la vérification. `onExit` signifie que le parcours s’est terminé, pas que toutes les exigences sont remplies. Le callback vérifie le compte côté serveur ; seuls `details_submitted`, `charges_enabled`, `payouts_enabled` et le statut des capacités demandées font passer un prestataire au tableau de bord principal. Sinon, il peut reprendre son onboarding. C’est ce qui a fait gagner le plus de temps sur le projet.

## Le proxy Connect générique

Une plateforme Connect a besoin d’endpoints pour le solde, les virements, les comptes bancaires, les paramètres fiscaux, les retraits ; chacun correspond à un appel différent à l’API Stripe. Plutôt que des dizaines de routes, j’en ai construit une seule :

```typescript
router.use("/:object/:action", requireConnectOperation);
```

Le contrôleur associe une opération autorisée par liste blanche à un appel Stripe connu et passe `{stripeAccount: user.accountId}` pour le limiter au compte connecté. `POST /connect/payouts/create`, `GET /connect/balance/retrieve` et `GET /connect/payouts/list?limit=100` peuvent partager une seule route. Les ressources imbriquées comme `tax.settings` sont découpées sur le point. La route a tout de même besoin d’une autorisation par opération, de validation, de limitation de débit et de contrôles de propriété.

> N’exposez jamais toute la surface de l’API Stripe à travers un dispatcher dynamique arbitraire.

## Répartir un paiement entre plusieurs prestataires

Une même mission peut impliquer plusieurs prestataires. Quand le client paie, la plateforme déduit sa commission (5 à 30 %), répartit le reste selon les parts en pourcentage (ou à parts égales si rien n’est précisé), déduit tout crédit restant dû après l’échec d’annulations de remboursements précédentes, puis transfère à chaque prestataire sa part nette :

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

`transfer_group` relie tous les transferts d’une mission, ce qui est essentiel pour les audits. `source_transaction` rattache chaque transfert au paiement d’origine et coordonne la disponibilité des fonds. Il n’annule pas automatiquement le transfert quand le paiement est remboursé. Attribuez volontairement tout reste d’arrondi : arrondir chaque part à l’inférieur peut laisser des centimes en suspens.

## Le système de crédit : récupérer proprement après un remboursement

C’est l’élément d’architecture dont je suis le plus fier, parce qu’il résout un problème qu’aucun tutoriel Stripe ne traite.

Quand vous remboursez un paiement réparti, vous annulez le transfert de chaque prestataire. Mais que se passe-t-il si la troisième annulation échoue parce que le solde Stripe de ce prestataire est à zéro ; il a déjà retiré l’argent ?

L’approche naïve : faire échouer tout le remboursement. Dire au client : « Désolé, nous ne pouvons pas vous rembourser. » Inacceptable.

Mon approche : **enregistrer le montant irrécupérable comme crédit sur le compte du prestataire, et le déduire de son prochain transfert.**

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

Le champ `credit` du modèle User démarre à zéro. Il augmente lorsqu’une annulation échoue précisément parce que le compte connecté manque de fonds. Les erreurs transitoires et de validation sont réessayées ou remontées au lieu de devenir une dette. Lors du transfert suivant pour une mission, le crédit est réduit de façon atomique du montant appliqué avant que le transfert ne soit effectué. Il s’agit d’un registre propre à la plateforme, pas d’une fonctionnalité Stripe ; ses conditions et sa politique de recouvrement doivent être validées par les équipes juridique et financière.

## Déclarations fiscales (1099)

Trois choses ont rendu le volet fiscal gérable :

**Ne demander que les capacités de déclaration fiscale applicables** à la création du compte. Les paiements de prestations utilisent couramment le formulaire 1099-NEC ; le 1099-MISC, le 1099-K, les seuils, les exceptions selon le type d’entité et les règles des États diffèrent. Stripe Tax et la déclaration 1099 sont des produits distincts : confirmez le formulaire et la responsabilité du dépôt avec un fiscaliste.

**Calculer la taxe sur les ventes au moment du paiement** avec Stripe Tax. Un calcul n’est pas en soi la transaction fiscale à annuler :

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

Stockez `transaction.id`, pas seulement l’identifiant du calcul. Lors d’un remboursement, annulez cette transaction avec une référence unique. Vous pouvez aussi rattacher le calcul au PaymentIntent pour que Stripe enregistre automatiquement la transaction et l’annulation au remboursement.

**Exposer la bonne interface de déclaration.** Les plateformes peuvent générer des rapports `connected_account_tax.transactions.itemized.2`, tandis que le dépôt et l’envoi des formulaires fiscaux passent par des workflows distincts. Le front-end peut afficher `tax.settings.status_details.pending.missing_fields`.

## L’architecture des remboursements

Sur une plateforme Connect, un remboursement n’est pas un simple appel d’API. C’est une séquence en cascade :

1. **Rembourser le paiement** : `stripe.refunds.create` sur le paiement d’origine.
2. **Annuler la transaction fiscale** : à partir de l’identifiant de transaction fiscale enregistré et d’une référence d’annulation unique.
3. **Annuler tous les transferts** du groupe de transferts : avec récupération par crédit si une annulation échoue.

Chaque opération a besoin de son propre état durable et de sa propre clé d’idempotence. Un remboursement peut rester en attente si la plateforme n’a pas assez de solde disponible ; le client attend aussi sa banque ou son réseau de carte. Aucune règle Stripe universelle n’impose d’exécuter le remboursement du paiement, l’annulation fiscale et l’annulation des transferts en une seule séquence bloquante. Le système enregistre indépendamment le résultat du remboursement, de l’annulation fiscale et de l’annulation des transferts, réessaie les échecs sans risque et alerte sur ceux qui sont irrécupérables.

Les remboursements partiels sont plus délicats ; la répartition des transferts reste donc une opération vérifiée plutôt qu’une heuristique risquée.

## Des endpoints de webhook cloisonnés

La plateforme utilise des endpoints distincts avec des secrets distincts : un endpoint propre au compte pour les événements de la plateforme et un endpoint Connect pour les événements des comptes connectés.

Le gestionnaire Connect traite `account.updated` et `tax.settings.updated`. Comme le parcours de paiement ci-dessus crée le paiement sur la plateforme, c’est l’endpoint de la plateforme qui traite `payment_intent.succeeded` et lance le workflow de transfert. Une intégration en paiements directs cloisonnerait cet événement différemment.

Chaque endpoint vérifie les signatures, déduplique les identifiants d’événement et contrôle `livemode`. En production, les événements de test sont acquittés puis ignorés plutôt que rejetés en boucle.

## Ce que je ferais différemment

- **Construire la réconciliation dès le premier jour** : une tâche quotidienne qui compare les enregistrements internes à l’API Balance Transactions de Stripe.
- **Utiliser une outbox ou un état de tâche durable** : le webhook doit mettre en file le travail de répartition, pas exécuter en ligne une boucle de transferts sans limite.

## À retenir

Construire une plateforme de paiement, ce n’est pas ajouter des paiements à une application. Dès qu’il y a plusieurs parties, des mouvements d’argent réglementés et des obligations fiscales, vous construisez une infrastructure financière.

L’architecture qui a tenu en production : des comptes contrôlés par la plateforme, un onboarding intégré, un proxy à liste blanche, un registre de crédit et des webhooks cloisonnés avec des tâches de transfert durables et idempotentes.

Si vous construisez quelque chose de similaire : gardez les données personnelles hors de vos serveurs grâce aux jetons de compte, demandez les capacités fiscales à la création du compte (pas plus tard), et concevez votre parcours de remboursement avant votre parcours de paiement. C’est dans les remboursements que les plateformes de paiement cassent.

> Votre futur vous, et votre équipe conformité, vous remercieront.
