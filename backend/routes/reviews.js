const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/reviews/:tmdbId — traer reviews de una película
router.get("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as username
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN movies m ON r.movie_id = m.id
       WHERE m.imdb_id = $1`,
      [`tmdb_${tmdbId}`],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:tmdbId — crear o actualizar review
router.post("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { user_id, rating, comment, title, year, poster_url } = req.body;

  try {
    // Asegurarse que la película existe en la tabla movies
    const movie = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (imdb_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [`tmdb_${tmdbId}`, title, year, poster_url],
    );

    const result = await pool.query(
      `INSERT INTO reviews (movie_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (movie_id, user_id)
       DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
       RETURNING *`,
      [movie.rows[0].id, user_id, rating, comment],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/:tmdbId/:userId", async (req, res) => {
  const { tmdbId, userId } = req.params;
  try {
    await pool.query(
      `DELETE FROM reviews
       WHERE movie_id = (SELECT id FROM movies WHERE imdb_id = $1)
       AND user_id = $2`,
      [`tmdb_${tmdbId}`, userId],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
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
module.exports = router;
