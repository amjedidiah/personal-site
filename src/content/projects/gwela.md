---
title: "Gwela"
description: "A shared AI session where teammates can join, catch up, and steer one live agent run."
tech: ["TypeScript", "React.js", "TailwindCSS", "Python", "FastAPI", "Cloudflare Workers", "WebSockets", "OpenRouter", "Ollama", "Playwright", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "founder"
featured: true
metric: "Shared state + permissioned redirects"
order: 2
yearStart: 2025
monthStart: 1
role: "Product, architecture, and full-stack engineering"
evidence: "Working web client with end-to-end coverage"
image: "../../assets/projects/gwela-product.webp"
imageAlt: "Gwela product landing screen for collaborative AI sessions"
imageCaption: "Gwela's working web client, captured from a local build."
---

Gwela is a multiplayer layer for AI agents. Multiple people share one session, see the same event history, and can guide an agent together instead of forwarding fragments of separate chats.

## The problem

Single-user AI chat fragments team context. Late joiners miss what happened, while collaborators have no shared way to control an ongoing run.

## Hardest challenge

Participants joining at different times must arrive at the same session state while new events and agent output continue to stream. The implementation uses an ordered event history for catch-up, then continues from live events without giving late joiners a different version of the session.

## What I built

- Live sessions with catch-up and reconnect so participants converge on the same state
- Permissioned redirects, admission controls, and role-based session governance
- An interruptible agent with multi-provider support and graceful degradation when the agent is unavailable
- A React web client with end-to-end coverage for joining, lifecycle, and convergence

## Lessons learned

Shared state is easier to reason about when every participant derives it from the same event history. Keeping the agent and live media separate from that durable history lets the session remain useful when either layer is unavailable.

## Evidence and status

The working web client supports session creation, joining, messaging, agent runs, redirects, and presence. It is in active development; there are no published user or adoption metrics yet.

## Recent build note

On 26 September 2026, I reduced join-flow network round trips and refined the session entry experience. The same change expanded end-to-end coverage around joining and redirect behavior. This is an engineering update, not a published performance benchmark.
