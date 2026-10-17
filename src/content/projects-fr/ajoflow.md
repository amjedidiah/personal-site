---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "AjoFlow"
description: "Une démo fonctionnelle de tontine numérique avec alimentation de portefeuille, versements et score de confiance assisté par IA."
metric: "Portefeuilles + versements + score de confiance"
urlLabel: "ouvrir la démo"
role: "Développement full-stack, parcours de paiement et intégration IA"
evidence: "Démo fonctionnelle réalisée pour le hackathon Interswitch x Enyata"
imageAlt: "Tableau de bord de démonstration d’AjoFlow montrant des groupes d’épargne, des scores de confiance et les prochaines cotisations"
imageCaption: "Compte de démonstration AjoFlow ; les valeurs affichées sont des données de test."
---

AjoFlow est une démo de tontine numérique réalisée lors d’un hackathon pour les groupes d’épargne nigérians (ajo/esusu). J’ai développé le front-end, le back-end et l’intégration IA, avec [Esther Inyang](https://www.linkedin.com/in/estherinyang/) en soutien sur la communication ainsi que sur les tests et retours concernant l’API Interswitch.

## Le problème

Les groupes d’épargne ont besoin d’un historique clair des cotisations, de la fiabilité de chaque membre et de l’ordre des versements. Avec des espèces et des tableurs, ces décisions sont difficiles à vérifier.

## Le défi principal

La file des versements devait réagir aux cotisations en retard ou manquées sans devenir une boîte noire. L’agent de confiance pouvait proposer un nouvel ordre, mais les administrateurs devaient voir l’historique des paiements et la raison de chaque changement.

## Ce que j’ai construit

- Création de groupes et parcours de cotisation adossés aux portefeuilles Interswitch, aux callbacks de comptes virtuels et aux décaissements
- Un agent de score de confiance qui évalue l’historique des paiements et explique les changements dans la file des versements
- Un assistant IA conversationnel pour naviguer dans le produit
- Un front-end Next.js, une API Express et une couche de données MongoDB
- Des tests d’API pour les contrôles d’accès aux groupes et les cas d’échec de versement

## Ce que j’en retiens

Quand l’IA influence une décision financière, les données d’entrée et l’explication doivent rester visibles pour que chacun puisse vérifier le résultat. Un score seul ne suffit pas à justifier un changement dans l’ordre des versements.

## Preuves et statut

[Démo fonctionnelle](https://ajo-flow.vercel.app/) avec des comptes préremplis pour explorer le tableau de bord et le parcours de score de confiance. La capture ci-dessus utilise ces données de démonstration ; elle ne reflète ni un volume réel de clients ni des performances de transaction.
