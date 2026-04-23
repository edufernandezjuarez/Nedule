const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/movies/:listId
router.get("/:listId", async (req, res) => {
  const { listId } = req.params;
  try {
    const result = await pool.query(
      `SELECT m.*, lm.added_by, lm.added_at
       FROM movies m
       JOIN list_movies lm ON m.id = lm.movie_id
       WHERE lm.list_id = $1
       ORDER BY lm.added_at DESC`,
      [listId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/movies/:listId — agregar película
router.post("/:listId", async (req, res) => {
  const { listId } = req.params;
  const { tmdb_id, title, year, poster_url, rating, added_by, type } = req.body;
  try {
    const movie = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, imdb_rating, media_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (imdb_id) DO UPDATE SET title = EXCLUDED.title, media_type = EXCLUDED.media_type
       RETURNING *`,
      [`tmdb_${tmdb_id}`, title, year, poster_url, rating, type ?? "movie"],
    );
    await pool.query(
      `INSERT INTO list_movies (list_id, movie_id, added_by)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [listId, movie.rows[0].id, added_by],
    );
    res.status(201).json(movie.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/movies/:listId/:movieId
router.delete("/:listId/:movieId", async (req, res) => {
  const { listId, movieId } = req.params;
  try {
    await pool.query(
      "DELETE FROM list_movies WHERE list_id = $1 AND movie_id = $2",
      [listId, movieId],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
