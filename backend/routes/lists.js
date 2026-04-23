const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/lists/:userId — personales y compartidas separadas
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const personal = await pool.query(
      `SELECT l.*, COUNT(lm.movie_id) as movie_count
       FROM lists l
       LEFT JOIN list_movies lm ON l.id = lm.list_id
       WHERE l.owner_id = $1 AND l.is_shared = FALSE
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [userId],
    );
    const shared = await pool.query(
      `SELECT l.*, COUNT(lm.movie_id) as movie_count
       FROM lists l
       LEFT JOIN list_movies lm ON l.id = lm.list_id
       WHERE l.is_shared = TRUE
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
    );
    res.json({ personal: personal.rows, shared: shared.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lists — crear lista
router.post("/", async (req, res) => {
  const { name, owner_id, is_shared } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO lists (name, owner_id, is_shared) VALUES ($1, $2, $3) RETURNING *`,
      [name, owner_id, is_shared ?? false],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lists/:listId
router.delete("/:listId", async (req, res) => {
  const { listId } = req.params;
  try {
    await pool.query("DELETE FROM lists WHERE id = $1", [listId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
