---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Cocktail & Book Club"
description: "Une application mobile pour suivre ses lectures, partager des avis et réunir des lecteurs autour d’événements au Royaume-Uni."
metric: "Application publiée sur iOS et Android"
role: "Développement de l’application React Native"
evidence: "Application publiée sur l’App Store d’Apple et sur Google Play"
imageAlt: "Trois écrans de l’application Cocktail & Book Club : statistiques de lecture, bilan de lecture à partager et objectifs de lecture annuels et quotidiens"
imageCaption: "Captures de l’App Store de l’application publiée."
---

Cocktail & Book Club réunit les listes de lecture et la dimension sociale des clubs de lecture dans une seule expérience mobile. Les lecteurs peuvent suivre leurs livres, partager des avis, rejoindre des groupes et trouver des événements.

## Le défi principal

La connexion passe par une application native, une WebView Wix intégrée et parfois le navigateur pour la récupération du compte. Chaque transition doit ramener le lecteur à une session utilisable, y compris lorsque la vérification ou la réinitialisation du mot de passe le fait sortir de l’application.

## Ce sur quoi j’ai travaillé

- Écrans et navigation React Native construits avec Expo Router
- État de l’application pour les parcours de lecture et de communauté avec Zustand
- Intégration de Wix Headless pour l’authentification et le contenu
- Gestion de la connexion, de la vérification, de la réinitialisation du mot de passe et des callbacks entre les écrans natifs et Wix

## Ce que j’en retiens

Sur mobile, l’authentification se joue dans les transitions entre écrans et entre systèmes. Cartographier tôt les parcours de connexion, de callback, d’inscription et de récupération a permis de traiter ces cas limites de façon cohérente.

## Preuves et statut

L’[application iPhone et iPad](https://apps.apple.com/us/app/cocktail-book-club/id6772709680) est disponible sur l’App Store et l’[application Android](https://play.google.com/store/apps/details?id=com.alexlatte.cocktailandbookclub) sur Google Play. Les fiches sont publiées par Alex Latte Ltd ; ma contribution a porté sur le développement de l’application.
