const express = require("express");
const rateLimit = require("express-rate-limit");
const { submitContact } = require("../controllers/contactController");

const router = express.Router();

// Rate limit: 5 submissions per IP per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

router.post("/contacts", contactLimiter, submitContact);

module.exports = router;
