---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Gwela"
description: "Une session IA partagée où les membres d’une équipe peuvent rejoindre, rattraper le fil et piloter ensemble un agent en direct."
metric: "État partagé + redirections soumises à autorisation"
role: "Produit, architecture et ingénierie full-stack"
evidence: "Client web fonctionnel couvert par des tests de bout en bout"
imageAlt: "Écran d’accueil de Gwela pour les sessions IA collaboratives"
imageCaption: "Le client web fonctionnel de Gwela, capturé depuis une version locale."
---

Gwela est une couche multijoueur pour les agents IA. Plusieurs personnes partagent une même session, voient le même historique d’événements et peuvent guider un agent ensemble, au lieu de se transmettre des fragments de conversations séparées.

## Le problème

Le chat IA mono-utilisateur fragmente le contexte d’équipe. Ceux qui arrivent en cours de route ratent ce qui s’est passé, et les collaborateurs n’ont aucun moyen partagé de piloter une exécution en cours.

## Le défi principal

Les participants qui rejoignent à des moments différents doivent arriver au même état de session pendant que les nouveaux événements et la sortie de l’agent continuent d’arriver en streaming. L’implémentation s’appuie sur un historique d’événements ordonné pour le rattrapage, puis enchaîne sur les événements en direct sans donner aux retardataires une version différente de la session.

## Ce que j’ai construit

- Sessions en direct avec rattrapage et reconnexion, pour que tous les participants convergent vers le même état
- Redirections soumises à autorisation, contrôle des admissions et gouvernance de session par rôles
- Un agent interruptible, compatible avec plusieurs fournisseurs, qui se dégrade proprement lorsqu’il est indisponible
- Un client web React couvert par des tests de bout en bout pour l’arrivée, la reconnexion, les redirections, le cycle de vie et la convergence

## Ce que j’en retiens

Un état partagé est plus facile à raisonner quand chaque participant le dérive du même historique d’événements. Séparer l’agent et les médias en direct de cet historique durable permet à la session de rester utile quand l’une de ces couches est indisponible.

## Preuves et statut

Le client web fonctionnel prend en charge la création de session, l’arrivée des participants, la messagerie, les exécutions de l’agent, les redirections et la présence. Il est en développement actif ; aucune métrique d’utilisation ou d’adoption n’a encore été publiée.

## Note de développement récente

Le 26 septembre 2026, j’ai réduit le nombre d’allers-retours réseau lors de l’arrivée dans une session et affiné l’expérience d’entrée. Le même changement a étendu la couverture de bout en bout autour de l’arrivée et des redirections. Il s’agit d’une mise à jour technique, pas d’un benchmark de performance publié.

## Démonstration

Deux enregistrements du client web fonctionnel (en anglais).
