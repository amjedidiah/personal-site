---
title: "Resume Tailor"
description: "AI-powered resume optimisation SaaS with AWS microservice architecture."
tech: ["Next.js", "AWS Lambda", "SQS", "DynamoDB", "Cognito", "Paystack", "Customer.io"]
type: "founder"
order: 4
---

AI resume optimisation SaaS that analyses job descriptions and tailors resumes for better match rates.

## What it does

Upload a resume and a job description. The AI rewrites and optimises the resume to match the role, generates a formatted PDF, and delivers it via email.

## Technical highlights

- AWS microservice architecture: Cognito auth, SQS-triggered Lambda for PDF generation, S3 storage, DynamoDB
- Customer.io transactional emails for delivery
- Paystack payments for the Nigerian market
- Next.js frontend deployed on Vercel
- Node.js API on Elastic Beanstalk
