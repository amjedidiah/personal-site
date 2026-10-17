---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Web Scraper"
description: "Un crawler qui extrait et classe les liens de contact et de documents des sites web."
metric: "Algorithmes de score sur mesure"
urlLabel: "voir le code"
role: "Développement back-end"
evidence: "Code source public avec tests du crawler, tests d’API et stockage SQLite"
---

J’ai construit un crawler basé sur Crawlee qui collecte les liens d’un site, identifie les contacts et les documents, puis les classe selon des règles de score configurables. Une API REST expose les résultats enregistrés.

## Le défi principal

La structure des pages varie énormément, et la présence d’un lien en dit peu sur son utilité. Le crawler devait collecter les candidats, conserver leur page d’origine et classer contacts et documents avec des règles de score explicites.

## Points techniques

- Algorithmes de score sur mesure pour classer les données extraites par pertinence
- API REST avec limitation du débit
- Stockage SQLite pour un fonctionnement léger et portable
- Collecte basée sur Crawlee, avec une logique de score et de persistance séparée

## Ce que j’en retiens

Séparer la collecte du classement rend les règles de score plus faciles à inspecter et à ajuster. Conserver le contexte d’origine compte, car un score élevé n’est utile que si l’on comprend pourquoi un lien a été retenu.

## Preuves et statut

Le [code source public](https://github.com/amjedidiah/web-scrapper) comprend le crawler, la persistance SQLite et les tests d’API.
