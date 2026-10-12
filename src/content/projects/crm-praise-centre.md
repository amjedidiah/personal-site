---
title: "CRM Praise Centre"
description: "A church website that brings together ministries, events, devotionals, and visitor information."
tech: ["TypeScript", "React.js", "Next.js", "TailwindCSS", "GraphQL", "Vercel", "Docker", "WordPress CMS", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "client"
metric: "Content-managed church website"
order: 8
dateStart: "2026-01-29"
dateEnd: "2026-10-12"
url: "https://www.crmpraisecenter.org/"
urlLabel: "visit live site"
role: "Planning, development and CMS integration"
evidence: "Live website with ministry, event, and devotional sections"
---

CRM Praise Centre gives visitors a clear route into the church's programs, ministries, events, and devotional content.

## Hardest challenge

Public pages need to remain useful when the WordPress endpoint is slow or unavailable, while fresh content should still appear when the CMS is healthy. The frontend uses a fallback data path and explicit cache revalidation around that boundary.

## What I worked on

- Responsive Next.js pages for the site's main content sections
- WordPress and GraphQL integration for managed content
- Reusable presentation patterns for events, ministries, and devotionals

## Lessons learned

A CMS integration needs a failure path and a refresh strategy alongside the normal fetch. Treating those as part of the content architecture kept the public pages more dependable.

## Evidence and status

[Public website](https://www.crmpraisecenter.org/) - supporting WordPress-backed content and local fallback content where needed.
