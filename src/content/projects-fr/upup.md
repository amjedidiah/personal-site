---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Upup"
description: "Contributions open source à un outil d’upload : envois signés vers le cloud, aperçus React et glisser-déposer."
metric: "Envois signés + interface React"
urlLabel: "essayer la démo"
role: "Contributeur open source"
evidence: "Contributions publiques, paquets publiés et démo en ligne"
imageAlt: "Page d’accueil d’upup avec le titre « Open-source file uploader for every framework » à côté du widget d’envoi"
imageCaption: "La page d’accueil du projet, capturée en octobre 2026."
---

J’ai contribué au composant d’upload de fichiers React d’Upup. Mon travail a porté sur les intégrations de stockage cloud, les URL d’upload signées, les aperçus, le style responsive, le glisser-déposer et les tests.

## Ce que fait l’outil

Upup permet aux développeurs d’ajouter l’envoi de fichiers sans construire eux-mêmes le sélecteur, les aperçus, la progression et l’intégration du stockage. Le produit actuel prend en charge six frameworks front-end ; mes contributions concernaient le précédent composant React et sa couche de stockage.

## Le défi principal

Les envois vers le cloud exigent une frontière claire entre le navigateur et le service qui signe les requêtes. J’ai travaillé sur les URL d’upload présignées et les intégrations de stockage, tout en gardant la progression, les aperçus de fichiers et le glisser-déposer cohérents dans l’interface React.

## Ce sur quoi j’ai travaillé

- URL présignées pour le stockage compatible S3 et Azure
- Tests de signature S3 pour la génération d’URL
- Interface React responsive et amélioration des aperçus de fichiers
- Glisser-déposer pendant l’affichage des aperçus

## Ce que j’en retiens

Les contrats de stockage et l’état de l’interface doivent s’accorder sur ce que fait un envoi. Les tests autour de la signature d’URL et les corrections apportées aux aperçus et au glisser-déposer ont rendu ces frontières plus faciles à maintenir.

## Preuves et statut

La [démo en ligne](https://useupup.com/) et le [code source public](https://github.com/DevinoSolutions/upup) présentent le produit actuel.
