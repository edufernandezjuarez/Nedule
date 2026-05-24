const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/watched/:userId
// GET /api/watched/:userId — solo leer la tabla watched (limpio, sin UNION raro)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT m.id as movie_id, m.imdb_id, m.title, m.year, m.poster_url, m.media_type,
              r.rating as user_rating, w.watched_at, w.genre_ids
       FROM watched w
       JOIN movies m ON w.movie_id = m.id
       LEFT JOIN reviews r ON r.movie_id = m.id AND r.user_id = w.user_id AND r.season IS NULL
       WHERE w.user_id = $1
       ORDER BY w.watched_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/watched — marcar como visto
router.post("/", async (req, res) => {
  const { user_id, tmdb_id, title, year, poster_url, media_type, genre_ids } = req.body;
  try {
    const movie = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, media_type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (imdb_id) DO UPDATE
         SET title = EXCLUDED.title,
             media_type = EXCLUDED.media_type
       RETURNING *`,
      [`tmdb_${tmdb_id}`, title, year, poster_url, media_type ?? "movie"],
    );
    const result = await pool.query(
      `INSERT INTO watched (user_id, movie_id, genre_ids)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, movie_id) DO NOTHING
      RETURNING *`,
      [user_id, movie.rows[0].id, genre_ids ?? []],
    );
    res.status(201).json(result.rows[0] ?? { already: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/watched/:userId/:tmdbId — desmarcar
router.delete("/:userId/:tmdbId", async (req, res) => {
  const { userId, tmdbId } = req.params;
  try {
    await pool.query(
      `DELETE FROM watched
       WHERE user_id = $1
         AND movie_id = (SELECT id FROM movies WHERE imdb_id = $2)`,
      [userId, `tmdb_${tmdbId}`],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/watched/:userId/check/:tmdbId — saber si está visto
router.get("/:userId/check/:tmdbId", async (req, res) => {
  const { userId, tmdbId } = req.params;
  try {
    const result = await pool.query(
      `SELECT 1 FROM watched w
       JOIN movies m ON w.movie_id = m.id
       WHERE w.user_id = $1 AND m.imdb_id = $2`,
      [userId, `tmdb_${tmdbId}`],
    );
    res.json({ watched: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/watched/series/complete — marcar serie completa (pone cada season a su max)
router.post("/series/complete", async (req, res) => {
  const { user_id, tmdb_id, title, year, poster_url, season_episode_counts, genre_ids } = req.body;
  // season_episode_counts: { "1": 10, "2": 8, ... }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const movie = await client.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, media_type)
       VALUES ($1, $2, $3, $4, 'tv')
       ON CONFLICT (imdb_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [`tmdb_${tmdb_id}`, title, year, poster_url],
    );
    const movieId = movie.rows[0].id;

    // Poner cada temporada a su episodio máximo
    for (const [season, maxEp] of Object.entries(season_episode_counts)) {
      if (maxEp > 0) {
        await client.query(
          `INSERT INTO series_progress (movie_id, user_id, season, episode)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (movie_id, user_id, season)
           DO UPDATE SET episode = $4, updated_at = NOW()`,
          [movieId, user_id, Number(season), maxEp],
        );
      }
    }

    // Insertar en watched
    await client.query(
      `INSERT INTO watched (user_id, movie_id, genre_ids)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, movie_id) DO NOTHING`,
      [user_id, movieId, genre_ids ?? []],
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
// DELETE /api/watched/series/complete — desmarcar serie (borra watched + todo el progress)
router.delete("/series/complete/:userId/:tmdbId", async (req, res) => {
  const { userId, tmdbId } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM watched
       WHERE user_id = $1
         AND movie_id = (SELECT id FROM movies WHERE imdb_id = $2)`,
      [userId, `tmdb_${tmdbId}`],
    );
    await client.query(
      `DELETE FROM series_progress
       WHERE user_id = $1
         AND movie_id = (SELECT id FROM movies WHERE imdb_id = $2)`,
      [userId, `tmdb_${tmdbId}`],
    );
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
module.exports = router;
