---
title: "Gwela"
description: "A shared AI session where teammates can join, catch up, and steer one live agent run."
tech: ["React 19", "FastAPI", "WebSockets", "OpenRouter", "Ollama", "Playwright"]
type: "founder"
featured: true
metric: "Shared state + permissioned redirects"
order: 2
role: "Product, architecture, and full-stack engineering"
evidence: "Working web client with end-to-end coverage"
image: "../../assets/projects/gwela-product.webp"
imageAlt: "Gwela product landing screen for collaborative AI sessions"
imageCaption: "Gwela's working web client, captured from a local build."
---

Gwela is a multiplayer layer for AI agents. Multiple people share one session, see the same event history, and can guide an agent together instead of forwarding fragments of separate chats.

## The problem

Single-user AI chat fragments team context. Late joiners miss what happened, while collaborators have no shared way to control an ongoing run.

## What I built

- Live sessions with catch-up and reconnect so participants converge on the same state
- Permissioned redirects, admission controls, and role-based session governance
- An interruptible agent with multi-provider support and graceful degradation when the agent is unavailable
- A React web client with end-to-end coverage for joining, lifecycle, and convergence

## Evidence and status

The working web client supports session creation, joining, messaging, agent runs, redirects, and presence. It is in active development; there are no published user or adoption metrics yet.

## Recent build note

On 26 September 2026, I reduced join-flow network round trips and refined the session entry experience. The same change expanded end-to-end coverage around joining and redirect behavior. This is an engineering update, not a published performance benchmark.
