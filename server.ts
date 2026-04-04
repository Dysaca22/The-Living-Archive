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

  function getTmdbToken() {
    return process.env.TMDB_READ_ACCESS_TOKEN;
  }

  function getTmdbHeaders(token: string) {
    return {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  function validateToken(res: express.Response) {
    const token = getTmdbToken();
    if (!token) {
      res.status(503).json({ error: "TMDB access not configured." });
      return null;
    }
    return token;
  }

  app.get("/api/tmdb/:mediaType/:id", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
      return res.status(400).json({ error: "Invalid media type. Use movie or tv." });
    }

    try {
      const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}`, {
        headers: getTmdbHeaders(token),
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB media detail error:", error);
      res.status(500).json({ error: "Failed to fetch media details from TMDB." });
    }
  });

  app.get("/api/tmdb/:mediaType/:id/reviews", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
      return res.status(400).json({ error: "Invalid media type. Use movie or tv." });
    }

    try {
      const reviewsUrl = new URL(`https://api.themoviedb.org/3/${mediaType}/${id}/reviews`);
      reviewsUrl.searchParams.set("language", "en-US");
      reviewsUrl.searchParams.set("page", "1");

      const response = await fetch(reviewsUrl.toString(), {
        headers: getTmdbHeaders(token),
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB reviews error:", error);
      res.status(500).json({ error: "Failed to fetch TMDB public reviews." });
    }
  });

  app.get("/api/tmdb/collection/by-id/:collectionId", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { collectionId } = req.params;
    try {
      const response = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}`, {
        headers: getTmdbHeaders(token),
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB collection error:", error);
      res.status(500).json({ error: "Failed to fetch TMDB collection data." });
    }
  });

  app.get("/api/tmdb/search", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { query, year } = req.query;
    try {
      const searchUrl = new URL("https://api.themoviedb.org/3/search/movie");
      searchUrl.searchParams.append("query", String(query || ""));
      if (year) searchUrl.searchParams.append("year", String(year));

      const response = await fetch(searchUrl.toString(), { headers: getTmdbHeaders(token) });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB search error:", error);
      res.status(500).json({ error: "Failed to search TMDB." });
    }
  });

  app.get("/api/tmdb/search/multi", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { query } = req.query;
    try {
      const searchUrl = new URL("https://api.themoviedb.org/3/search/multi");
      searchUrl.searchParams.append("query", String(query || ""));

      const response = await fetch(searchUrl.toString(), { headers: getTmdbHeaders(token) });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB multi-search error:", error);
      res.status(500).json({ error: "Failed to search TMDB multi." });
    }
  });

  app.get("/api/tmdb/trending/:mediaType/:window", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { mediaType, window } = req.params;
    if (!["all", "movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ error: "Invalid media type. Use all, movie, or tv." });
    }
    if (!["day", "week"].includes(window)) {
      return res.status(400).json({ error: "Invalid time window. Use day or week." });
    }

    try {
      const response = await fetch(`https://api.themoviedb.org/3/trending/${mediaType}/${window}`, {
        headers: getTmdbHeaders(token),
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB trending error:", error);
      res.status(500).json({ error: "Failed to fetch TMDB trending content." });
    }
  });

  app.get("/api/tmdb/discover/:mediaType", async (req, res) => {
    const token = validateToken(res);
    if (!token) return;

    const { mediaType } = req.params;
    if (!["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ error: "Invalid media type. Use movie or tv." });
    }

    const allowedQueryParams = new Set([
      "language",
      "page",
      "sort_by",
      "include_adult",
      "include_video",
      "with_genres",
      "vote_count.gte",
      "vote_average.gte",
      "primary_release_year",
      "first_air_date_year",
      "primary_release_date.gte",
      "primary_release_date.lte",
      "air_date.gte",
      "air_date.lte",
      "with_original_language",
      "with_origin_country",
    ]);

    try {
      const discoverUrl = new URL(`https://api.themoviedb.org/3/discover/${mediaType}`);
      for (const [key, rawValue] of Object.entries(req.query)) {
        if (!allowedQueryParams.has(key)) continue;
        const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        if (typeof value === "string" && value.trim()) {
          discoverUrl.searchParams.set(key, value);
        }
      }

      const response = await fetch(discoverUrl.toString(), { headers: getTmdbHeaders(token) });
      if (!response.ok) {
        return res.status(response.status).json({ error: `TMDB API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("TMDB discover error:", error);
      res.status(500).json({ error: "Failed to discover TMDB content." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Living Archive (Full-Stack) running on http://localhost:${PORT}`);
  });
}

startServer();
