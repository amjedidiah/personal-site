---
title: "Resume Tailor"
description: "An app that uses AI to tailor resumes to job descriptions and delivers formatted PDFs by email."
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
role: "Full-stack development and AWS integration"
evidence: "Public source for the web app and document-processing pipeline"
---

Resume Tailor uses a job description to suggest changes to a resume, then generates a formatted PDF for email delivery.

## What it does

Upload a resume and a job description. The AI proposes wording tailored to the role, and a background job generates a PDF and sends it by email. The applicant still needs to review the wording for accuracy.

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

## Evidence and status

[Public source](https://github.com/amjedidiah/resume-tailor) includes the web app, Express services, and the SQS-triggered PDF and email pipeline.
