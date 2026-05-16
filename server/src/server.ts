import { createServer } from "node:http";

const PORT = Number(process.env.PORT) || 3000;

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, message: "Server is running" }));
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
