const validator = require("validator");
const Contact = require("../models/Contact");
const { sendContactEmail } = require("../utils/emailService");

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
    };

    // ---------- Save to Firestore ----------
    const saved = await Contact.create(sanitized);

    // ---------- Respond immediately ----------
    res.status(201).json({
      success: true,
      message: "Contact saved successfully",
      data: { id: saved.id, created_at: saved.created_at },
    });

    // ---------- Send email asynchronously (non-blocking) ----------
    sendContactEmail(sanitized).catch((err) => {
      console.error("[ASYNC-EMAIL] Failed:", err.message);
    });
  } catch (err) {
    next(err);
  }
};
