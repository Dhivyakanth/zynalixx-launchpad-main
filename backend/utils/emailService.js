const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const MIN_SEND_INTERVAL_MS = Number(process.env.RESEND_MIN_SEND_INTERVAL_MS || 650);
const RETRY_ATTEMPTS = Number(process.env.RESEND_RETRY_ATTEMPTS || 3);
const RETRY_BASE_DELAY_MS = Number(process.env.RESEND_RETRY_BASE_DELAY_MS || 500);

let queue = [];
let isQueueProcessing = false;
let lastSendAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryResendError(error) {
  return Number(error?.statusCode) === 429;
}

function computeRetryDelayMs(error, attempt) {
  const retryAfterSeconds = Number(error?.retryAfter || 0);
  if (retryAfterSeconds > 0) return retryAfterSeconds * 1000;

  const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 250);
  return backoff + jitter;
}

async function sendWithRetry(payload, label) {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const { data, error } = await resend.emails.send(payload);

      if (!error) {
        console.log(`[EMAIL] ${label} sent successfully:`, data?.id);
        return { success: true, messageId: data?.id, attempts: attempt };
      }

      if (!shouldRetryResendError(error) || attempt >= RETRY_ATTEMPTS) {
        console.error(`[EMAIL] ${label} failed:`, error);
        return {
          success: false,
          error: error.message || "Failed to send email",
          attempts: attempt,
        };
      }

      const delay = computeRetryDelayMs(error, attempt);
      console.warn(
        `[EMAIL] ${label} rate-limited. Retrying in ${delay}ms (attempt ${attempt}/${RETRY_ATTEMPTS})`
      );
      await sleep(delay);
    } catch (err) {
      const isLastAttempt = attempt >= RETRY_ATTEMPTS;
      if (isLastAttempt) {
        console.error(`[EMAIL] ${label} exception:`, err.message);
        return { success: false, error: err.message, attempts: attempt };
      }

      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1));
      await sleep(delay);
    }
  }

  return { success: false, error: "Failed to send email after retries", attempts: RETRY_ATTEMPTS };
}

function enqueueEmail(task) {
  return new Promise((resolve) => {
    queue.push({ task, resolve });
    processQueue().catch((err) => {
      console.error("[EMAIL] Queue processing error:", err.message);
    });
  });
}

async function processQueue() {
  if (isQueueProcessing) return;
  isQueueProcessing = true;

  while (queue.length > 0) {
    const elapsed = Date.now() - lastSendAt;
    if (elapsed < MIN_SEND_INTERVAL_MS) {
      await sleep(MIN_SEND_INTERVAL_MS - elapsed);
    }

    const { task, resolve } = queue.shift();
    const result = await task();
    lastSendAt = Date.now();
    resolve(result);
  }

  isQueueProcessing = false;
}

/**
 * Send contact-form notification email.
 * Returns { success, messageId?, error? }
 */
async function sendContactEmail({ name, email, phone, message }) {
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not set — skipping email");
    return { success: false, error: "Email service not configured" };
  }

  const recipients = (process.env.EMAIL_TO || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!recipients.length) {
    console.warn("[EMAIL] EMAIL_TO not set — skipping email");
    return { success: false, error: "No recipients configured" };
  }

  return enqueueEmail(() =>
    sendWithRetry(
      {
      from: process.env.EMAIL_FROM || "Zynalixx Contact <onboarding@resend.dev>",
      to: recipients,
      replyTo: email,
      subject: `New Contact: ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message)}</p>
        <hr />
        <p style="color:#888;font-size:12px">Sent at ${new Date().toISOString()}</p>
      `,
      },
      "Contact email"
    )
  );
}

/**
 * Send book-call notification email.
 * Returns { success, messageId?, error? }
 */
async function sendBookCallEmail({
  name,
  company,
  email,
  phone,
  projectType,
  budget,
  timeline,
  description,
}) {
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not set — skipping email");
    return { success: false, error: "Email service not configured" };
  }

  const recipients = (process.env.EMAIL_TO || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!recipients.length) {
    console.warn("[EMAIL] EMAIL_TO not set — skipping email");
    return { success: false, error: "No recipients configured" };
  }

  return enqueueEmail(() =>
    sendWithRetry(
      {
      from: process.env.EMAIL_FROM || "Zynalixx Contact <onboarding@resend.dev>",
      to: recipients,
      replyTo: email,
      subject: `New Book Call Request: ${name}`,
      html: `
        <h2>New Book Call Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Project Type:</strong> ${escapeHtml(projectType)}</p>
        <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
        <p><strong>Timeline:</strong> ${escapeHtml(timeline)}</p>
        <hr />
        <p><strong>Project Description:</strong></p>
        <p>${escapeHtml(description)}</p>
        <hr />
        <p style="color:#888;font-size:12px">Sent at ${new Date().toISOString()}</p>
      `,
      },
      "Book call email"
    )
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { sendContactEmail, sendBookCallEmail };
