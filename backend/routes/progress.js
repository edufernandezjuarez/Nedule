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
router.post("/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { user_id, season, episode, title, year, poster_url } = req.body;
  try {
    // Asegurar que la serie existe en movies
    const movie = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, poster_url, media_type)
       VALUES ($1, $2, $3, $4, 'tv')
       ON CONFLICT (imdb_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING *`,
      [`tmdb_${tmdbId}`, title, year, poster_url],
    );
    const movieId = movie.rows[0].id;

    if (episode === 0 || episode === null) {
      // Sin episodios vistos en esta temporada → borrar registro
      await pool.query(
        `DELETE FROM series_progress
         WHERE movie_id = $1 AND user_id = $2 AND season = $3`,
        [movieId, user_id, season],
      );
      res.status(200).json({ deleted: true, season });
    } else {
      // Guardar o actualizar
      const result = await pool.query(
        `INSERT INTO series_progress (movie_id, user_id, season, episode)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (movie_id, user_id, season)
         DO UPDATE SET episode = $4, updated_at = NOW()
         RETURNING *`,
        [movieId, user_id, season, episode],
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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
