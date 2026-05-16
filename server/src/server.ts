import "dotenv/config";
import { createServer } from "node:http";
import prisma from "./lib/prisma";

const PORT = Number(process.env.PORT) || 3000;

const server = createServer(async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ ok: true, message: "Server is running", db: "connected" })
    );
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ ok: false, message: "Database connection failed", error: String(error) })
    );
  }
});

// Connect once at startup, then start listening
prisma.$connect()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log("Database connected successfully"); //
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });