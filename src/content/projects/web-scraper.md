---
title: "Web Scraper"
description: "A crawler that extracts and ranks contact and document links from websites."
tech: ["TypeScript", "Node.js", "Express.js", "REST APIs", "Jest", "Playwright", "Crawlee", "SQLite", "Git"]
platforms: []
disciplines: ["back-end"]
type: "founder"
metric: "Custom scoring algorithms"
order: 10
dateStart: "2025-02-13"
dateEnd: "2025-02-17"
url: "https://github.com/amjedidiah/web-scrapper"
urlLabel: "view source"
role: "Backend development"
evidence: "Public source with crawler tests, API tests, and SQLite storage"
---

I built a Crawlee-based crawler that collects website links, identifies contacts and documents, and ranks them using configurable scoring rules. A REST API exposes the stored results.

## Hardest challenge

Pages vary widely in structure, and a link’s presence says little about its usefulness. The crawler had to collect candidates, retain their source page, and rank contacts and documents with explicit scoring rules.

## Technical highlights

- Custom scoring algorithms to rank extracted data by relevance
- REST API with rate limiting
- SQLite storage for lightweight, portable operation
- Crawlee-based collection with separate scoring and persistence logic

## Lessons learned

Separating collection from ranking makes the scoring rules easier to inspect and tune. Retaining source context matters because a high score is only useful if someone can understand why a link was selected.

## Evidence and status

[Public source](https://github.com/amjedidiah/web-scrapper) includes the crawler, SQLite persistence, and API tests.
