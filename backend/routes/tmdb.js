const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.TMDB_BASE_URL;
const API_KEY = process.env.TMDB_API_KEY;
const IMAGE_URL = process.env.TMDB_IMAGE_URL;

// GET /api/tmdb/search?q=inception
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });

    try {
        const response = await axios.get(`${BASE_URL}/search/movie`, {
            params: {
                api_key: API_KEY,
                query: q,
                language: 'en-US',
            }
        });

        const results = response.data.results.map(movie => ({
            tmdb_id: movie.id,
            title: movie.title,
            year: movie.release_date?.slice(0, 4) ?? 'N/A',
            poster_url: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
            rating: movie.vote_average?.toFixed(1) ?? 'N/A',
            overview: movie.overview,
        }));

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tmdb/movie/:tmdbId  — detalle completo con actores y director
router.get('/movie/:tmdbId', async (req, res) => {
    const { tmdbId } = req.params;

    try {
        const response = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: API_KEY,
                language: 'en-US',
                append_to_response: 'credits',
            }
        });

        const m = response.data;

        const director = m.credits.crew
            .find(p => p.job === 'Director')?.name ?? 'N/A';

        const cast = m.credits.cast
            .slice(0, 5)
            .map(a => a.name);

        res.json({
            tmdb_id: m.id,
            title: m.title,
            year: m.release_date?.slice(0, 4) ?? 'N/A',
            poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
            rating: m.vote_average?.toFixed(1) ?? 'N/A',
            overview: m.overview,
            genres: m.genres.map(g => g.name),
            runtime: m.runtime,
            director,
            cast,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;