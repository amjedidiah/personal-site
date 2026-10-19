---
title: "Stone Watch Party"
description: "A mobile-first registration and seat-allocation system for a 750-seat World Cup final watch party."
tech: ["TypeScript", "React.js", "Next.js", "TailwindCSS", "PostgreSQL", "Redis", "Vercel", "Docker", "Playwright", "Drizzle", "Auth.js", "Zod", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "client"
metric: "750-seat event capacity"
order: 6
dateStart: "2026-07-10"
dateEnd: "2026-07-11"
url: "https://stone-watch-party.vercel.app/"
urlLabel: "view event site"
role: "Full-stack development and registration workflows"
evidence: "Public event page and registration flow"
image: "../../assets/projects/stone-watch-party-home.webp"
imageAlt: "Stone Watch Party registration page showing 749 of 750 seats left, the venue, date and a Register Now button"
imageCaption: "The live registration page, captured October 2026."
---

Stone Watch Party was built for a World Cup final screening with a 750-seat venue. The site gives guests a mobile-friendly route from event details to registration while supporting seat allocation behind the scenes.

## Hardest challenge

Two guests can try to claim the same remaining seat at once. The booking service has to enforce capacity at the data boundary, while the public availability display stays clear and current enough to guide registration.

## What I built

- Event landing and registration flow
- Seat allocation and event data modeled with PostgreSQL and Drizzle
- Validation and authenticated administration for managing registrations

## Lessons learned

The availability shown in a browser cannot be the final authority for a booking. Database-backed allocation and concurrency tests were needed to protect the seat count when requests arrive together.

Why I chose Drizzle for this, and how the last-seat claim works in code: [Prisma vs. Drizzle: Why I Reach for the Lighter ORM](/blog/prisma-vs-drizzle).

## Evidence and status

[Event site](https://stone-watch-party.vercel.app/) - built around a 750-seat venue. The source includes database integration tests for concurrent seat allocation and registration throttling.
