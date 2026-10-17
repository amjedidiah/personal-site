---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Stone Watch Party"
description: "Un système d’inscription et d’attribution des places, pensé pour le mobile, pour la diffusion de la finale de Coupe du monde dans une salle de 750 places."
metric: "Capacité de 750 places"
urlLabel: "voir le site de l’événement"
role: "Développement full-stack et parcours d’inscription"
evidence: "Page publique de l’événement et parcours d’inscription"
---

Stone Watch Party a été conçu pour la projection d’une finale de Coupe du monde dans une salle de 750 places. Le site offre aux invités un parcours adapté au mobile, des informations sur l’événement jusqu’à l’inscription, tout en gérant l’attribution des places en coulisses.

## Le défi principal

Deux invités peuvent tenter de réserver la même dernière place au même moment. Le service de réservation doit faire respecter la capacité au niveau des données, tandis que l’affichage public des disponibilités reste assez clair et à jour pour guider l’inscription.

## Ce que j’ai construit

- Page d’accueil de l’événement et parcours d’inscription
- Attribution des places et données de l’événement modélisées avec PostgreSQL et Drizzle
- Validation et administration authentifiée pour gérer les inscriptions

## Ce que j’en retiens

La disponibilité affichée dans un navigateur ne peut pas faire foi pour une réservation. Une attribution gérée en base de données et des tests de concurrence ont été nécessaires pour protéger le nombre de places quand les requêtes arrivent simultanément.

## Preuves et statut

[Site de l’événement](https://stone-watch-party.vercel.app/) : conçu pour une salle de 750 places. Le code source comprend des tests d’intégration en base de données pour l’attribution simultanée des places et la limitation du débit des inscriptions.
