const validator = require("validator");
const Contact = require("../models/Contact");
const BookCall = require("../models/BookCall");
const { sendContactEmail, sendBookCallEmail } = require("../utils/emailService");

function getRequestMeta(req) {
  const xff = req.headers["x-forwarded-for"];
  const clientIp = typeof xff === "string" && xff.length
    ? xff.split(",")[0].trim()
    : req.ip || req.socket?.remoteAddress || null;

  return {
    ip: clientIp,
    user_agent: req.get("user-agent") || null,
    origin: req.get("origin") || null,
    referer: req.get("referer") || null,
  };
}

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    // ---------- Validation ----------
    const errors = [];
    if (!name || typeof name !== "string" || !name.trim()) errors.push("Name is required");
    else if (name.trim().length > 100) errors.push("Name must be under 100 characters");

    if (!email || !validator.isEmail(String(email))) errors.push("Valid email is required");

    if (!message || typeof message !== "string" || !message.trim()) errors.push("Message is required");
    else if (message.trim().length > 2000) errors.push("Message must be under 2000 characters");

    if (phone && !validator.isMobilePhone(String(phone), "any", { strictMode: false }))
      errors.push("Invalid phone number");

    if (errors.length) return res.status(400).json({ success: false, errors });

    // ---------- Sanitize ----------
    const sanitized = {
      name: validator.escape(name.trim()),
      email: validator.normalizeEmail(email.trim()),
      phone: phone ? validator.escape(phone.trim()) : null,
      message: validator.escape(message.trim()),
      source: "contact_form",
      request_meta: getRequestMeta(req),
    };

    // ---------- Save to Firestore ----------
    const saved = await Contact.create(sanitized);

    // ---------- Respond immediately ----------
    res.status(201).json({
      success: true,
      message: "Contact saved successfully",
      data: { id: saved.id, created_at: saved.created_at, email_status: "pending" },
    });

    // ---------- Send email asynchronously (non-blocking) ----------
    sendContactEmail(sanitized)
      .then(async (result) => {
        const status = result?.success ? "sent" : "failed";
        await Contact.updateEmailStatus(saved.id, status, result?.error || null, {
          messageId: result?.messageId || null,
          provider: "resend",
          attempts: result?.attempts,
        });
      })
      .catch(async (err) => {
        console.error("[ASYNC-EMAIL] Failed:", err.message);
        try {
          await Contact.updateEmailStatus(saved.id, "failed", err.message, {
            provider: "resend",
          });
        } catch (dbErr) {
          console.error("[ASYNC-EMAIL] Failed to update contact email status:", dbErr.message);
        }
      });
  } catch (err) {
    next(err);
  }
};

exports.submitBookCall = async (req, res, next) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      projectType,
      budget,
      timeline,
      description,
    } = req.body;

    // ---------- Validation ----------
    const errors = [];
    if (!name || typeof name !== "string" || !name.trim()) errors.push("Name is required");
    else if (name.trim().length > 100) errors.push("Name must be under 100 characters");

    if (!email || !validator.isEmail(String(email))) errors.push("Valid email is required");

    if (!phone || !validator.isMobilePhone(String(phone), "any", { strictMode: false })) {
      errors.push("Valid phone number is required");
    }

    if (!projectType || typeof projectType !== "string" || !projectType.trim()) {
      errors.push("Project type is required");
    }

    if (!budget || typeof budget !== "string" || !budget.trim()) {
      errors.push("Budget is required");
    }

    if (!timeline || typeof timeline !== "string" || !timeline.trim()) {
      errors.push("Timeline is required");
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      errors.push("Description is required");
    } else if (description.trim().length > 3000) {
      errors.push("Description must be under 3000 characters");
    }

    if (errors.length) return res.status(400).json({ success: false, errors });

    // ---------- Sanitize ----------
    const sanitized = {
      name: validator.escape(name.trim()),
      company: company ? validator.escape(String(company).trim()) : null,
      email: validator.normalizeEmail(email.trim()),
      phone: validator.escape(phone.trim()),
      projectType: validator.escape(projectType.trim()),
      budget: validator.escape(budget.trim()),
      timeline: validator.escape(timeline.trim()),
      description: validator.escape(description.trim()),
      source: "book_call_form",
      request_meta: getRequestMeta(req),
    };

    // ---------- Save to Firestore ----------
    const saved = await BookCall.create(sanitized);

    // ---------- Respond immediately ----------
    res.status(201).json({
      success: true,
      message: "Book call request saved successfully",
      data: { id: saved.id, created_at: saved.created_at, email_status: "pending" },
    });

    // ---------- Send email asynchronously (non-blocking) ----------
    sendBookCallEmail(sanitized)
      .then(async (result) => {
        const status = result?.success ? "sent" : "failed";
        await BookCall.updateEmailStatus(saved.id, status, result?.error || null, {
          messageId: result?.messageId || null,
          provider: "resend",
          attempts: result?.attempts,
        });
      })
      .catch(async (err) => {
        console.error("[ASYNC-BOOK-CALL-EMAIL] Failed:", err.message);
        try {
          await BookCall.updateEmailStatus(saved.id, "failed", err.message, {
            provider: "resend",
          });
        } catch (dbErr) {
          console.error("[ASYNC-BOOK-CALL-EMAIL] Failed to update email status:", dbErr.message);
        }
      });
  } catch (err) {
    next(err);
  }
};
