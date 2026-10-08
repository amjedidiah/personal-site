---
title: "Web Scraper"
description: "Intelligent data ingestion pipeline with custom scoring for high-value signal extraction."
tech: ["TypeScript", "Node.js", "Express.js", "REST APIs", "Jest", "Playwright", "Crawlee", "SQLite", "Git"]
platforms: []
disciplines: ["back-end"]
type: "founder"
metric: "Custom scoring algorithms"
order: 10
yearStart: 2023
monthStart: 7
url: "https://github.com/amjedidiah/web-scrapper"
urlLabel: "view source"
---

Engineered an intelligent data ingestion pipeline that identifies high-value signals on websites, prioritising contacts and documents using custom scoring algorithms.

## Hardest challenge

Pages vary widely in structure, and a link's presence says little about its value. The crawler has to collect useful candidates despite site defenses, then rank them with explicit scoring rules instead of treating every result equally.

## Technical highlights

- Custom scoring algorithms to rank extracted data by relevance
- REST API with rate limiting
- SQLite storage for lightweight, portable operation
- Scale-ready architecture built with Crawlee

## Lessons learned

Separating collection from ranking makes the scoring rules easier to inspect and tune. Retaining source context matters because a high score is only useful if someone can understand why a link was selected.

## Evidence and status

[GitHub repository](https://github.com/amjedidiah/web-scrapper)