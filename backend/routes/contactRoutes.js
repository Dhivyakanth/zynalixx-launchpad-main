const express = require("express");
const rateLimit = require("express-rate-limit");
const { submitContact, submitBookCall } = require("../controllers/contactController");

const router = express.Router();

const submissionCooldownMs = Number(process.env.SUBMISSION_COOLDOWN_MS || 700);
const lastSubmissionByIp = new Map();

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function smoothBurstMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const lastSeen = lastSubmissionByIp.get(ip) || 0;
  const elapsed = now - lastSeen;

  if (elapsed < submissionCooldownMs) {
    const waitMs = submissionCooldownMs - elapsed;
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please wait ${waitMs}ms before trying again.`,
    });
  }

  lastSubmissionByIp.set(ip, now);
  return next();
}

setInterval(() => {
  const threshold = Date.now() - 60 * 60 * 1000;
  for (const [ip, ts] of lastSubmissionByIp.entries()) {
    if (ts < threshold) lastSubmissionByIp.delete(ip);
  }
}, 10 * 60 * 1000).unref();

// Rate limit: 5 submissions per IP per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

router.post("/contacts", smoothBurstMiddleware, contactLimiter, submitContact);
router.post("/book-calls", smoothBurstMiddleware, contactLimiter, submitBookCall);

module.exports = router;
