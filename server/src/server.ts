import { config } from "./config/index.js";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import prisma from "./lib/prisma.js";

// ─── Route Modules ──────────────────────────
import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/note.routes.js";
import searchRoutes from "./routes/search.routes.js";

// ─── Middleware ──────────────────────────────
import { errorHandler } from "./middleware/index.js";

// ─── Swagger / OpenAPI ──────────────────────
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

// ─── Express App ────────────────────────────
const app = express();

// ─── Global Middleware ──────────────────────
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// ─── Rate Limiting ──────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,               // 100 requests per window per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(limiter);

// ─── Swagger UI ─────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /openapi.json:
 *   get:
 *     tags: [Health]
 *     summary: Raw OpenAPI specification
 *     description: Returns the auto-generated OpenAPI 3.0 JSON specification.
 *     responses:
 *       200:
 *         description: OpenAPI specification JSON
 */
app.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

// ─── Health / About ─────────────────────────

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns a simple health-check response.
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Fi Notes API is running"
 */
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Fi Notes API is running" });
});

/**
 * @swagger
 * /about:
 *   get:
 *     tags: [Health]
 *     summary: API information
 *     description: Returns API metadata including name, version, and available endpoints.
 *     responses:
 *       200:
 *         description: API info object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.get("/about", (_req, res) => {
  res.json({
    name: "Gaurav",
    email: "gauravthakur83551@gmail.com",
    "my features": {
      "Role-Based Note Sharing":
        "Users can share notes with READ or EDIT permissions. Chose this to demonstrate granular access control — a must-have for any collaborative tool.",
      "Note Version History":
        "Every edit creates an immutable snapshot. Users can browse paginated version history to see past states of their notes.",
      "Rate Limiting":
        "Global rate limiting (100 req/15min per IP) using express-rate-limit. Essential for production security against abuse.",
      "Soft Delete & Restore":
        "Notes go to trash first (soft delete), can be restored, or permanently deleted. Prevents accidental data loss.",
      "Full-Text Search":
        "Case-insensitive search across titles and content with pagination. Searches both owned and shared notes.",
      "Dockerized Backend":
        "Multi-stage Docker build for production deployment. Slim image with only production dependencies.",
    },
  });
});

// ─── API Routes ─────────────────────────────

// Root-level auth (required by assignment spec: POST /register, POST /login)
app.use("/", authRoutes);
// Also keep /auth/* working for frontend compatibility
app.use("/auth", authRoutes);

app.use("/notes", noteRoutes);
app.use("/search", searchRoutes);

// ─── 404 catch-all ──────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler (must be last) ────
app.use(errorHandler);

// ─── Start Server ───────────────────────────
prisma
  .$connect()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`✓ Server listening on http://localhost:${config.port}`);
      console.log(`✓ Database connected (${config.isProduction ? "prod" : "dev"})`);
      console.log(`✓ Swagger docs at http://localhost:${config.port}/api-docs`);
    });
  })
  .catch((err: Error) => {
    console.error("✗ Failed to connect to database:", err);
    process.exit(1);
  });

export default app;