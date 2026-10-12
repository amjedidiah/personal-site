---
title: "Upup"
description: "Open-source uploader contributions covering signed cloud uploads, React previews, and drag-and-drop."
tech: ["TypeScript", "React.js", "Next.js", "TailwindCSS", "AWS S3", "Azure Blob Storage", "Jest", "React Testing Library", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "oss"
url: "https://useupup.com/"
urlLabel: "try the live demo"
metric: "Signed uploads + React UI"
order: 3
dateStart: "2024-11-04"
dateEnd: "2025-02-25"
role: "Open-source contributor"
evidence: "Public contributions, published packages, and a live demo"
---

I contributed to Upup’s React file uploader. My work covered cloud-storage integrations, signed upload URLs, previews, responsive styling, drag-and-drop, and tests.

## What it does

Upup lets developers add file uploads without building the picker, previews, progress, and storage integration from scratch. The current product supports six frontend frameworks; my contributions were to the earlier React uploader and its storage layer.

## Hardest challenge

Cloud uploads need a clear boundary between the browser and the service that signs requests. I worked on presigned upload URLs and storage integrations while keeping progress, file previews, and drag-and-drop consistent in the React interface.

## What I worked on

- Presigned URLs for S3-compatible storage and Azure
- S3 signing tests for URL generation
- Responsive React UI and file-preview improvements
- Drag-and-drop during previews

## Lessons learned

Storage contracts and UI state need to agree about what an upload is doing. Tests around URL signing and fixes to previews and drag-and-drop made those boundaries easier to maintain.

## Evidence and status

[Live demo](https://useupup.com/) and [public source](https://github.com/DevinoSolutions/upup) show the current product.
