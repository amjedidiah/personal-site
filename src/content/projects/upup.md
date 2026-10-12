---
title: "Upup"
description: "Open-source uploader with one headless core and six ready-to-use UI integrations."
tech: ["TypeScript", "React.js", "Next.js", "TailwindCSS", "Vue", "Svelte", "Angular", "Preact", "AWS S3", "Jest", "React Testing Library", "Playwright", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "oss"
url: "https://useupup.com/"
urlLabel: "try the live demo"
metric: "One core · six UI options"
order: 3
dateStart: "2024-11-04"
dateEnd: "2025-02-25"
role: "Open-source contributor"
evidence: "Published packages, documentation, and a live uploader demo"
---

I contributed to Upup, an open-source file uploader with a headless TypeScript core and native UI packages for React, Vue, Svelte, Angular, Vanilla JavaScript, and Preact.

## What it does

Upup lets developers add file uploads without building the picker, queue, previews, progress, and storage integration from scratch. The same core drives framework-specific interfaces, while uploads can go to S3-compatible storage through presigned URLs.

## Hardest challenge

The upload lifecycle needs to behave consistently across six UI integrations without forcing every framework into the same component model. Queue state, progress, and storage handoffs belong in the shared core; each interface still needs to feel native to its framework.

## Technical highlights

- Headless upload engine and six UI integration options
- Direct uploads to S3-compatible storage and optional server-side signing
- Cloud-drive, camera, and screen-capture sources
- Public documentation and an interactive demo

## Lessons learned

Clear core contracts make framework-specific interfaces possible without duplicating upload logic. The public demo and documentation are part of that contract because developers need to understand what happens before they adopt a package.

## Evidence and status

[Live demo](https://useupup.com/) and [public source](https://github.com/DevinoSolutions/upup) showing the current product.