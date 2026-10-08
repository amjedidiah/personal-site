import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';
import nodemailer from 'nodemailer';
import { submitFeedback } from '../src/lib/feedback-server.ts';

const originalUser = process.env.GMAIL_USER;
const originalPassword = process.env.GMAIL_APP_PASSWORD;
const originalTo = process.env.FEEDBACK_TO;

afterEach(() => {
  mock.restoreAll();
  if (originalUser === undefined) delete process.env.GMAIL_USER;
  else process.env.GMAIL_USER = originalUser;
  if (originalPassword === undefined) delete process.env.GMAIL_APP_PASSWORD;
  else process.env.GMAIL_APP_PASSWORD = originalPassword;
  if (originalTo === undefined) delete process.env.FEEDBACK_TO;
  else process.env.FEEDBACK_TO = originalTo;
});

function request(body: string, extraHeaders: Record<string, string> = {}) {
  return new Request('https://example.com/api/feedback', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
      origin: 'https://example.com',
      ...extraHeaders,
    },
    body,
  });
}

test('valid project feedback uses authenticated sender and reply-to', async () => {
  process.env.GMAIL_USER = 'sender@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'app-password';
  process.env.FEEDBACK_TO = 'owner@example.com';
  let sent: Record<string, unknown> | undefined;
  mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (mail: Record<string, unknown>) => { sent = mail; },
  }));

  const response = await submitFeedback(request('source=project%3Aajoflow&message=Useful+work%21&email=reader%40example.com'));
  assert.equal(response.status, 200);
  assert.equal(sent?.from, 'sender@gmail.com');
  assert.equal(sent?.to, 'owner@example.com');
  assert.equal(sent?.replyTo, 'reader@example.com');
  assert.equal(sent?.subject, 'Project feedback: ajoflow');
});

test('invalid input and cross-site requests never send email', async () => {
  process.env.GMAIL_USER = 'sender@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'app-password';
  const send = mock.fn();
  mock.method(nodemailer, 'createTransport', () => ({ sendMail: send }));

  assert.equal((await submitFeedback(request('source=site&message=Hi'))).status, 400);
  assert.equal((await submitFeedback(request('source=project%3A%3Cscript%3E&message=Useful+work'))).status, 400);
  assert.equal((await submitFeedback(request('source=site&message=Useful+work&email=one%40example.com%2Ctwo%40example.com'))).status, 400);
  assert.equal((await submitFeedback(request('source=site&message=Useful+work', { origin: 'https://other.example' }))).status, 403);
  assert.equal(send.mock.callCount(), 0);
});

test('honeypot submission returns success without delivery', async () => {
  const send = mock.fn();
  mock.method(nodemailer, 'createTransport', () => ({ sendMail: send }));
  const response = await submitFeedback(request('source=site&message=Useful+work&website=spam.example'));
  assert.equal(response.status, 200);
  assert.equal(send.mock.callCount(), 0);
});

test('missing credentials return a recoverable error', async () => {
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;
  const response = await submitFeedback(request('source=site&message=Useful+work'));
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /unavailable right now/);
});

test('mail delivery failure returns an error without exposing the message', async () => {
  process.env.GMAIL_USER = 'sender@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'app-password';
  mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async () => { throw new Error('SMTP connection detail'); },
  }));
  mock.method(console, 'error', () => {});

  const response = await submitFeedback(request('source=site&message=Useful+work'));
  assert.equal(response.status, 502);
  assert.doesNotMatch((await response.json()).message, /SMTP/);
});
