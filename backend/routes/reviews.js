const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/reviews/user/:userId
// Trae todas las reviews (serie general + temporadas)
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, m.title, m.year, m.poster_url, m.imdb_id, m.media_type
       FROM reviews r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:tmdbId
// ?season=N  → reviews de esa temporada
// sin season → reviews de la serie/peli en general (season IS NULL)
router.get("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { season } = req.query;
  try {
    let result;
    if (season !== undefined) {
      result = await pool.query(
        `SELECT r.*, u.name as username
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         JOIN movies m ON r.movie_id = m.id
         WHERE m.imdb_id = $1 AND r.season = $2`,
        [`tmdb_${tmdbId}`, parseInt(season)],
      );
    } else {
      result = await pool.query(
        `SELECT r.*, u.name as username
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         JOIN movies m ON r.movie_id = m.id
         WHERE m.imdb_id = $1 AND r.season IS NULL`,
        [`tmdb_${tmdbId}`],
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:tmdbId
// body puede incluir season (número) o null para review general
router.post("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { user_id, rating, comment, title, year, poster_url, season } = req.body;
  try {
    const movie = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, media_type)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (imdb_id) DO UPDATE 
     SET title = EXCLUDED.title,
         media_type = EXCLUDED.media_type
   RETURNING *`,
      [`tmdb_${tmdbId}`, title, year, poster_url, req.body.media_type ?? null],
    );
    const seasonVal = season ?? null;
    const result = await pool.query(
      `INSERT INTO reviews (movie_id, user_id, rating, comment, season)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (movie_id, user_id, season)
       DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
       RETURNING *`,
      [movie.rows[0].id, user_id, rating, comment, seasonVal],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:tmdbId/:userId
// ?season=N → borra review de esa temporada
// sin season → borra review general
router.delete("/:tmdbId/:userId", async (req, res) => {
  const { tmdbId, userId } = req.params;
  const { season } = req.query;
  try {
    if (season !== undefined) {
      await pool.query(
        `DELETE FROM reviews
         WHERE movie_id = (SELECT id FROM movies WHERE imdb_id = $1)
         AND user_id = $2 AND season = $3`,
        [`tmdb_${tmdbId}`, userId, parseInt(season)],
      );
    } else {
      await pool.query(
        `DELETE FROM reviews
         WHERE movie_id = (SELECT id FROM movies WHERE imdb_id = $1)
         AND user_id = $2 AND season IS NULL`,
        [`tmdb_${tmdbId}`, userId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
