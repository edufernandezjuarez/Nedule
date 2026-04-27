const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/hidden/:userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM hidden_titles WHERE user_id = $1 ORDER BY hidden_at DESC",
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hidden — agregar título bloqueado
router.post("/", async (req, res) => {
  const { user_id, tmdb_id, title, poster_url, media_type } = req.body;
  try {
    await pool.query(
      `INSERT INTO hidden_titles (user_id, tmdb_id, title, poster_url, media_type)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [user_id, tmdb_id, title, poster_url, media_type ?? "movie"],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hidden/:userId/:tmdbId
router.delete("/:userId/:tmdbId", async (req, res) => {
  const { userId, tmdbId } = req.params;
  try {
    await pool.query(
      "DELETE FROM hidden_titles WHERE user_id = $1 AND tmdb_id = $2",
      [userId, tmdbId],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
