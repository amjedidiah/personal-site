---
title: "Gwela"
description: "A shared AI session where teammates can join, catch up, and steer one live agent run. Think ChatGPT, but with multiple people in the chat instead of just you."
tech: ["TypeScript", "React.js", "TailwindCSS", "Python", "FastAPI", "Cloudflare Workers", "WebSockets", "OpenRouter", "Ollama", "Playwright", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "founder"
featured: true
metric: "Shared state + permissioned redirects"
order: 2
dateStart: "2026-08-22"
dateEnd: "2026-09-29"
role: "Product, architecture, and full-stack engineering"
evidence: "Working web client with end-to-end coverage"
videos:
  - "https://www.loom.com/share/824ac23990e04af496e69f0dc250bfba"
  - "https://www.loom.com/share/d00ca3a299764585a9b9192ce05be586"
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
- A React web client with end-to-end coverage for joining, reconnecting, redirects, lifecycle, and convergence

## Lessons learned

Shared state is easier to reason about when every participant derives it from the same event history. Keeping the agent and live media separate from that durable history lets the session remain useful when either layer is unavailable.

## Evidence and status

The working web client supports session creation, joining, messaging, agent runs, redirects, and presence.

## Recent build note

Reduced join-flow network round trips and refined the session entry experience. The same change expanded end-to-end coverage around joining and redirect behavior.

## Walkthrough

Two recordings of the working web client as at September 2026.
