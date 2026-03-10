require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const contactRoutes = require("./routes/contactRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function corsError(origin) {
  const err = new Error(`Not allowed by CORS: ${origin || "unknown-origin"}`);
  err.status = 403;
  return err;
}

function mapOperationalError(err) {
  const message = String(err?.message || "");

  if (message.includes("5 NOT_FOUND")) {
    return {
      status: 503,
      message:
        "Firestore database not found. Enable Firestore in your Firebase project and verify service-account project_id.",
    };
  }

  if (message.includes("PERMISSION_DENIED") || err?.code === 7) {
    return {
      status: 503,
      message:
        "Firestore permission denied. Verify service-account roles for Cloud Firestore.",
    };
  }

  return null;
}

// ------- Security middleware -------
app.use(helmet());

// ------- CORS -------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://zynalixx-a4c84.web.app",
  "https://zynalixx-a4c84.firebaseapp.com",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : []),
]
  .map(normalizeOrigin)
  .filter(Boolean);

console.log("[CORS] Allowed origins:", allowedOrigins.join(", "));

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server / curl (no origin)
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) return cb(null, true);
      cb(corsError(origin));
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ------- Body parsing -------
app.use(express.json({ limit: "10kb" }));

// ------- Health check -------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ------- Routes -------
app.use("/api", contactRoutes);

// ------- 404 -------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ------- Centralized error handler -------
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  if (err?.stack) console.error(err.stack);

  const mapped = mapOperationalError(err);
  const status = mapped?.status || err.status || 500;
  const safeMessage =
    mapped?.message ||
    (status === 500
      ? process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error"
      : err.message);

  res.status(status).json({
    success: false,
    message: safeMessage,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
