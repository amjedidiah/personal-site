---
title: "AjoFlow"
description: "A working savings-circle demo with wallet funding, payouts, and AI-assisted trust scoring."
tech: ["TypeScript", "React.js", "Next.js", "TailwindCSS", "TanStack", "Node.js", "Express.js", "REST APIs", "MongoDB", "Vercel", "Interswitch", "LangChain", "DeepSeek", "React Testing Library", "Playwright", "Git"]
platforms: ["web", "mobile"]
mobileDelivery: "pwa"
disciplines: ["front-end", "back-end"]
type: "founder"
featured: false
metric: "Wallets + payouts + trust scoring"
order: 1
dateStart: "2026-03-24"
dateEnd: "2026-06-25"
url: "https://ajo-flow.vercel.app/"
urlLabel: "open working demo"
role: "Full-stack development, payment flows and AI integration"
evidence: "Working demo built for the Interswitch x Enyata Hackathon"
image: "../../assets/projects/ajoflow-dashboard.webp"
imageAlt: "AjoFlow demo dashboard showing savings pods, trust scores, and upcoming contributions"
imageCaption: "AjoFlow demo account; values shown are seeded test data."
---

AjoFlow is a hackathon-built digital savings-circle demo for Nigerian ajo/esusu groups. I developed the frontend, backend, and AI integration, with [Esther Inyang](https://www.linkedin.com/in/estherinyang/) supporting communications and Interswitch API testing and feedback.

## The problem

Savings groups need a clear record of contributions, member reliability, and the order in which payouts happen. Cash and spreadsheet processes make those decisions difficult to inspect.

## Hardest challenge

The payout queue had to respond to late and missed contributions without becoming a black box. The trust agent could suggest a new order, while admins needed to see the payment history and the reason for each change.

## What I built

- Pod creation and contribution flows backed by Interswitch wallets, virtual-account callbacks, and disbursements
- A trust-scoring agent that evaluates payment history and explains changes to the payout queue
- A conversational AI assistant for navigating the product
- A Next.js frontend, Express API, and MongoDB data layer
- API tests for pod access controls and payout failure paths

## Lessons learned

When AI influences a financial decision, the inputs and explanation need to stay visible so people can inspect the result. A score alone cannot explain a change to the payout order.

## Evidence and status

[Working demo](https://ajo-flow.vercel.app/) including seeded accounts for exploring the dashboard and trust-scoring flow. The screenshot above uses that demo data; it is not a claim about live customer volume or transaction performance.
