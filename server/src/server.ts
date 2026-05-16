import { config } from "./config";
import express from "express";
import cors from "cors";
import prisma from "./lib/prisma";

// ─── Express App ────────────────────────────
const app = express();

// ─── Global Middleware ──────────────────────
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// ─── Health / About ─────────────────────────
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Fi Notes API is running" });
});

app.get("/about", (_req, res) => {
  res.json({
    name: "Fi Money Notes API",
    version: "1.0.0",
    description:
      "A multi-user notes application with sharing, versioning, and search",
    endpoints: [
      "POST /auth/register",
      "POST /auth/login",
      "GET /notes",
      "GET /notes/:id",
      "POST /notes",
      "PUT /notes/:id",
      "DELETE /notes/:id",
      "POST /notes/:id/share",
      "GET /search",
      "GET /about",
      "GET /openapi.json",
    ],
  });
});

// TODO: Mount route modules here
// app.use("/auth",  authRoutes);
// app.use("/notes", noteRoutes);
// app.use("/search", searchRoutes);

// ─── 404 catch-all ──────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Start Server ───────────────────────────
prisma
  .$connect()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`✓ Server listening on http://localhost:${config.port}`);
      console.log(`✓ Database connected (${config.isProduction ? "prod" : "dev"})`);
    });
  })
  .catch((err) => {
    console.error("✗ Failed to connect to database:", err);
    process.exit(1);
  });

export default app;