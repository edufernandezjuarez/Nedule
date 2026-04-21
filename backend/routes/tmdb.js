const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.TMDB_BASE_URL;
const API_KEY = process.env.TMDB_API_KEY;
const IMAGE_URL = process.env.TMDB_IMAGE_URL;

// GET /api/tmdb/search?q=inception
router.get("/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro q" });

  try {
    const [movies, tv] = await Promise.all([
      axios.get(`${BASE_URL}/search/movie`, {
        params: { api_key: API_KEY, query: q, language: "en-US", page },
      }),
      axios.get(`${BASE_URL}/search/tv`, {
        params: { api_key: API_KEY, query: q, language: "en-US", page },
      }),
    ]);

    const movieResults = movies.data.results.map((m) => ({
      tmdb_id: m.id,
      title: m.title,
      year: m.release_date?.slice(0, 4) ?? "N/A",
      poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
      rating: m.vote_average?.toFixed(1) ?? "N/A",
      overview: m.overview,
      type: "movie",
    }));

    const tvResults = tv.data.results.map((t) => ({
      tmdb_id: t.id,
      title: t.name,
      year: t.first_air_date?.slice(0, 4) ?? "N/A",
      poster_url: t.poster_path ? `${IMAGE_URL}${t.poster_path}` : null,
      rating: t.vote_average?.toFixed(1) ?? "N/A",
      overview: t.overview,
      type: "tv",
    }));

    const combined = [...movieResults, ...tvResults].sort(
      (a, b) => b.rating - a.rating,
    );

    res.json({
      results: combined,
      page: parseInt(page),
      hasMore: movies.data.total_pages > page || tv.data.total_pages > page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/detail/:tmdbId  — detalle completo con actores y director
router.get("/detail/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { type } = req.query;
  const endpoint = type === "tv" ? "tv" : "movie";

  try {
    const response = await axios.get(`${BASE_URL}/${endpoint}/${tmdbId}`, {
      params: {
        api_key: API_KEY,
        language: "en-US",
        append_to_response: "credits",
      },
    });

    const m = response.data;

    const director =
      m.credits?.crew?.find((p) => p.job === "Director")?.name ?? "N/A";

    const cast = m.credits?.cast?.slice(0, 5).map((a) => a.name) ?? [];

    res.json({
      tmdb_id: m.id,
      title: m.title ?? m.name,
      year: (m.release_date ?? m.first_air_date)?.slice(0, 4) ?? "N/A",
      poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
      rating: m.vote_average?.toFixed(1) ?? "N/A",
      overview: m.overview,
      genres: m.genres?.map((g) => g.name) ?? [],
      runtime: m.runtime ?? m.episode_run_time?.[0] ?? "N/A",
      type: type ?? "movie",
      director,
      cast,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
