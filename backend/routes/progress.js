const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/progress/user/:userId — todas las series en progreso
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT sp.*, m.imdb_id, m.title, m.year, m.poster_url
       FROM series_progress sp
       JOIN movies m ON sp.movie_id = m.id
       WHERE sp.user_id = $1
       ORDER BY sp.updated_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/progress/:tmdbId/:userId
router.get("/:tmdbId/:userId", async (req, res) => {
  const { tmdbId, userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT sp.* FROM series_progress sp
       JOIN movies m ON sp.movie_id = m.id
       WHERE m.imdb_id = $1 AND sp.user_id = $2`,
      [`tmdb_${tmdbId}`, userId],
    );
    res.json(result.rows[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress/:tmdbId — guardar o actualizar progreso
router.post("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { user_id, season, episode, title, year, poster_url } = req.body;
  try {
    const movie = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, media_type)
       VALUES ($1, $2, $3, $4, 'tv')
       ON CONFLICT (imdb_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [`tmdb_${tmdbId}`, title, year, poster_url],
    );
    const result = await pool.query(
      `INSERT INTO series_progress (movie_id, user_id, season, episode)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (movie_id, user_id)
       DO UPDATE SET season = $3, episode = $4, updated_at = NOW()
       RETURNING *`,
      [movie.rows[0].id, user_id, season, episode],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/progress/:movieId/user/:userId — marcar como visto
router.delete("/:movieId/user/:userId", async (req, res) => {
  const { movieId, userId } = req.params;
  try {
    await pool.query(`DELETE FROM series_progress WHERE movie_id = $1 AND user_id = $2`, [movieId, userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
