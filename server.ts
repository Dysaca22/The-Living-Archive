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

  /**
   * API: TMDB Proxy
   * Forwards requests to The Movie Database using a Read Access Token.
   * Keeps the token hidden from the frontend.
   */
  app.get("/api/tmdb/movie/:id", async (req, res) => {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) {
      return res.status(503).json({ error: "TMDB access not configured." });
    }

    try {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${req.params.id}`, {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB Movie Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch movie from TMDB." });
    }
  });

  app.get("/api/tmdb/search", async (req, res) => {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    const { query, year } = req.query;

    if (!token) {
      return res.status(503).json({ error: "TMDB access not configured." });
    }

    try {
      const searchUrl = new URL("https://api.themoviedb.org/3/search/movie");
      searchUrl.searchParams.append("query", query as string);
      if (year) searchUrl.searchParams.append("year", year as string);

      const response = await fetch(searchUrl.toString(), {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB Search Error:", error);
      res.status(500).json({ error: "Failed to search TMDB." });
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
