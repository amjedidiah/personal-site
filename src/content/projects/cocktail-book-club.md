---
title: "Cocktail & Book Club"
description: "A mobile app for tracking books, sharing reviews, and gathering readers around events in the UK."
tech: ["TypeScript", "React Native", "TanStack", "Expo Router", "Wix Headless", "Zustand", "Git"]
platforms: ["mobile"]
mobileDelivery: "native"
disciplines: ["front-end"]
type: "client"
featured: true
metric: "Published iOS and Android app"
order: 4
dateStart: "2026-04-08"
dateEnd: "2026-09-24"
url: "https://apps.apple.com/us/app/cocktail-book-club/id6772709680"
urlLabel: "App Store"
urlSecondary: "https://play.google.com/store/apps/details?id=com.alexlatte.cocktailandbookclub"
urlSecondaryLabel: "Google Play"
role: "React Native app engineering"
evidence: "Published app on the Apple App Store and Google Play Store"
image: "../../assets/projects/cocktail-book-club-app.webp"
imageAlt: "Three Cocktail & Book Club app screens: reading stats, a shareable reading summary, and yearly and daily reading goals"
imageCaption: "App Store screenshots of the published app."
---

Cocktail & Book Club brings reading lists and the social side of book clubs into one mobile experience. Readers can track books, share reviews, connect with groups, and find events.

## Hardest challenge

Sign-in crosses a native app, an in-app Wix WebView, and sometimes the browser for recovery. Each handoff has to return the reader to a usable session, including when verification or password reset takes them out of the app.

## What I worked on

- React Native screens and navigation built with Expo Router
- App state for reading and community flows using Zustand
- Integration with Wix Headless for authentication and content
- Sign-in, verification, password-reset, and callback handling between native screens and Wix

## Lessons learned

Authentication on mobile is defined by the transitions between screens and systems. Mapping login, callback, sign-up, and recovery paths early made those edge cases easier to handle coherently.

## Evidence and status

The [iPhone and iPad app](https://apps.apple.com/us/app/cocktail-book-club/id6772709680) is on the App Store and the [Android app](https://play.google.com/store/apps/details?id=com.alexlatte.cocktailandbookclub) is on Google Play. Listings are under Alex Latte Ltd; my contribution was app engineering.
