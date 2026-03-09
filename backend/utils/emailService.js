const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

  try {
    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("[EMAIL] Sent successfully:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[EMAIL] Exception:", err.message);
    return { success: false, error: err.message };
  }
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

  try {
    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("[EMAIL] Book call email sent:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[EMAIL] Book call exception:", err.message);
    return { success: false, error: err.message };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { sendContactEmail, sendBookCallEmail };
