const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/lists/:userId — personales y compartidas separadas
router.get('/:userId', async (req, res) => {
  console.log('params completos:', req.params);
  console.log('url completa:', req.url);
  const { userId } = req.params;
  console.log('userId recibido:', userId);
  try {
    const personal = await pool.query(
      `SELECT * FROM lists WHERE owner_id = $1 AND is_shared = FALSE ORDER BY created_at DESC`,
      [userId]
    );
    const shared = await pool.query(
      `SELECT * FROM lists WHERE is_shared = TRUE ORDER BY created_at DESC`
    );
    res.json({ personal: personal.rows, shared: shared.rows });
  } catch (err) {
    console.log('Error completo:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lists — crear lista
router.post('/', async (req, res) => {
  const { name, owner_id, is_shared } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO lists (name, owner_id, is_shared) VALUES ($1, $2, $3) RETURNING *`,
      [name, owner_id, is_shared ?? false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lists/:listId
router.delete('/:listId', async (req, res) => {
  const { listId } = req.params;
  try {
    await pool.query('DELETE FROM lists WHERE id = $1', [listId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;