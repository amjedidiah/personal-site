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
role: "Full-stack development"
evidence: "Public event page and registration flow"
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

## Evidence and status

[Event site](https://stone-watch-party.vercel.app/) - built around a 750-seat venue.
