---
title: "AjoFlow"
description: "A working savings-circle demo with wallet funding, payouts, and AI-assisted trust scoring."
tech: ["Next.js", "Express", "MongoDB", "LangChain", "DeepSeek", "Interswitch"]
type: "founder"
featured: true
metric: "Wallets + payouts + trust scoring"
order: 1
url: "https://ajo-flow.vercel.app/"
urlLabel: "open working demo"
role: "Full-stack development and AI integration"
evidence: "Working demo built for the Interswitch x Enyata Hackathon"
image: "../../assets/projects/ajoflow-dashboard.webp"
imageAlt: "AjoFlow demo dashboard showing savings pods, trust scores, and upcoming contributions"
imageCaption: "AjoFlow demo account; values shown are seeded test data."
---

AjoFlow is a hackathon-built digital savings-circle demo for Nigerian ajo/esusu groups. I developed the frontend, backend, and AI integration, with Esther Inyang supporting communications and Interswitch API testing and feedback.

## The problem

Savings groups need a clear record of contributions, member reliability, and the order in which payouts happen. Cash and spreadsheet processes make those decisions difficult to inspect.

## What I built

- Pod creation and contribution flows backed by Interswitch wallets, virtual-account callbacks, and disbursements
- A trust-scoring agent that evaluates payment history and explains changes to the payout queue
- A conversational AI assistant for navigating the product
- A Next.js frontend, Express API, and MongoDB data layer

## Evidence and status

The [working demo](https://ajo-flow.vercel.app/) includes seeded accounts for exploring the dashboard and trust-scoring flow. The screenshot above uses that demo data; it is not a claim about live customer volume or transaction performance.
