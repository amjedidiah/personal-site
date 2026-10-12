---
title: "Resume Tailor"
description: "AI-powered resume optimisation SaaS with AWS microservice architecture."
tech: ["TypeScript", "React.js", "Next.js", "Node.js", "Express.js", "REST APIs", "AWS Lambda", "AWS SQS", "AWS S3", "AWS DynamoDB", "AWS Cognito", "Vercel", "Paystack", "Customer.io", "Git"]
platforms: ["web"]
disciplines: ["front-end", "back-end"]
type: "founder"
metric: "AWS microservice pipeline"
order: 9
dateStart: "2024-03-08"
dateEnd: "2024-12-18"
url: "https://github.com/amjedidiah/resume-tailor"
urlLabel: "view source"
---

AI resume optimisation SaaS that analyses job descriptions and tailors resumes for better match rates.

## What it does

Upload a resume and a job description. The AI rewrites and optimises the resume to match the role, generates a formatted PDF, and delivers it via email.

## Hardest challenge

The request spans a web client, Express services, an SQS queue, a Lambda PDF job, storage, and email delivery. Each handoff needs to preserve the user's resume and job context while the longer-running work continues outside the original request.

## Technical highlights

- AWS microservice architecture: Cognito auth, SQS-triggered Lambda for PDF generation, S3 storage, DynamoDB
- Customer.io transactional emails for delivery
- Paystack payments for the Nigerian market
- Next.js frontend deployed on Vercel
- Node.js API on Elastic Beanstalk

## Lessons learned

Long-running document work belongs outside the web request. Separating generation from the interface makes the system easier to scale, but each queue and storage handoff needs clear ownership and observable status.
