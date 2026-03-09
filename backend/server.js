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
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
