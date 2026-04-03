import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  /**
   * API: Remote Vault Proxy
   * Forwards requests to a private Google Apps Script URL or similar.
   * Keeps credentials hidden from the frontend.
   */
  app.get("/api/vault", async (req, res) => {
    const remoteUrl = process.env.REMOTE_VAULT_URL;
    if (!remoteUrl) {
      return res.status(503).json({ error: "Remote vault not configured." });
    }

    try {
      const response = await fetch(remoteUrl);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Remote Vault Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch from remote vault." });
    }
  });

  app.post("/api/vault", async (req, res) => {
    const remoteUrl = process.env.REMOTE_VAULT_URL;
    if (!remoteUrl) {
      return res.status(503).json({ error: "Remote vault not configured." });
    }

    try {
      const response = await fetch(remoteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Remote Vault Sync Error:", error);
      res.status(500).json({ error: "Failed to sync to remote vault." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Living Archive (Full-Stack) running on http://localhost:${PORT}`);
  });
}

startServer();
