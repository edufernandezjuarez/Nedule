const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/progress/user/:userId — todas las series en progreso
// Devuelve el registro más reciente por serie (max updated_at)
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (sp.movie_id)
         sp.*, m.imdb_id, m.title, m.year, m.poster_url
       FROM series_progress sp
       JOIN movies m ON sp.movie_id = m.id
       WHERE sp.user_id = $1
       ORDER BY sp.movie_id, sp.updated_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/:tmdbId/:userId — todos los registros de progreso de una serie
// Devuelve array de { season, episode } para todas las temporadas con progreso
router.get("/:tmdbId/:userId", async (req, res) => {
  const { tmdbId, userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT sp.season, sp.episode, sp.updated_at
       FROM series_progress sp
       JOIN movies m ON sp.movie_id = m.id
       WHERE m.imdb_id = $1 AND sp.user_id = $2
       ORDER BY sp.season ASC`,
      [`tmdb_${tmdbId}`, userId],
    );
    res.json(result.rows); // array vacío si no hay progreso
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress/:tmdbId — guardar o actualizar progreso de UNA temporada
// Si episode = 0, borrar el registro de esa temporada (optimización)
// POST /api/progress/:tmdbId
router.post("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { user_id, season, episode, title, year, poster_url, season_episode_counts } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Upsert movies
    const movie = await client.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, media_type)
       VALUES ($1, $2, $3, $4, 'tv')
       ON CONFLICT (imdb_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [`tmdb_${tmdbId}`, title, year, poster_url],
    );
    const movieId = movie.rows[0].id;

    // Guardar/borrar progreso de esa temporada
    if (episode === 0 || episode === null) {
      await client.query(
        `DELETE FROM series_progress
         WHERE movie_id = $1 AND user_id = $2 AND season = $3`,
        [movieId, user_id, season],
      );
    } else {
      await client.query(
        `INSERT INTO series_progress (movie_id, user_id, season, episode)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (movie_id, user_id, season)
         DO UPDATE SET episode = $4, updated_at = NOW()`,
        [movieId, user_id, season, episode],
      );
    }

    // Auto-watch: calcular si llegó al 100%
    let isComplete = false;
    if (season_episode_counts && Object.keys(season_episode_counts).length > 0) {
      const progressRes = await client.query(
        `SELECT season, episode FROM series_progress
         WHERE movie_id = $1 AND user_id = $2`,
        [movieId, user_id],
      );
      const progressMap = {};
      progressRes.rows.forEach((r) => {
        progressMap[String(r.season)] = Number(r.episode);
      });

      isComplete = Object.entries(season_episode_counts).every(([s, total]) => {
        return total > 0 && (progressMap[s] ?? 0) >= total;
      });
    }

    if (isComplete) {
      await client.query(
        `INSERT INTO watched (user_id, movie_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, movie_id) DO NOTHING`,
        [user_id, movieId],
      );
    } else {
      await client.query(`DELETE FROM watched WHERE user_id = $1 AND movie_id = $2`, [user_id, movieId]);
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, complete: isComplete });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/progress/:movieId/user/:userId — borrar todo el progreso de una serie
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
