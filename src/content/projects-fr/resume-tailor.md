---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Resume Tailor"
description: "Une application qui utilise l’IA pour adapter un CV à une offre d’emploi et envoie un PDF mis en forme par e-mail."
metric: "Pipeline de microservices AWS"
urlLabel: "voir le code"
role: "Développement full-stack, architecture AWS et intégration des paiements"
evidence: "Code source public de l’application web et du pipeline de traitement des documents"
---

Resume Tailor s’appuie sur une offre d’emploi pour proposer des modifications à un CV, puis génère un PDF mis en forme envoyé par e-mail.

## Ce que fait l’application

Importez un CV et une offre d’emploi. L’IA propose une formulation adaptée au poste, puis une tâche en arrière-plan génère un PDF et l’envoie par e-mail. Le candidat doit tout de même relire la formulation pour en vérifier l’exactitude.

## Le défi principal

La requête traverse un client web, des services Express, une file SQS, une tâche Lambda de génération de PDF, du stockage et l’envoi d’e-mails. Chaque transmission doit conserver le CV et le contexte de l’offre pendant que le traitement plus long se poursuit en dehors de la requête initiale.

## Points techniques

- Architecture de microservices AWS : authentification Cognito, Lambda déclenchée par SQS pour la génération de PDF, stockage S3, DynamoDB
- E-mails transactionnels Customer.io pour l’envoi
- Paiements Paystack pour le marché nigérian
- Front-end Next.js déployé sur Vercel
- API Node.js sur Elastic Beanstalk

## Ce que j’en retiens

Le traitement long de documents n’a pas sa place dans la requête web. Séparer la génération de l’interface rend le système plus facile à faire évoluer, mais chaque transmission entre file et stockage doit avoir un responsable clair et un statut observable.

## Preuves et statut

Le [code source public](https://github.com/amjedidiah/resume-tailor) comprend l’application web, les services Express et le pipeline PDF et e-mail déclenché par SQS.
