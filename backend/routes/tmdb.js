const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.TMDB_BASE_URL;
const API_KEY = process.env.TMDB_API_KEY;
const IMAGE_URL = process.env.TMDB_IMAGE_URL;
const db = require("../db");

// GET /api/tmdb/search?q=inception por ejemplo
router.get("/search", async (req, res) => {
  const { q, moviePage = 1, tvPage = 1, skipMovie, skipTv, yearMin, yearMax, genreIds, type, continents, countryName } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro q" });

  try {
    const hasCountryFilter = continents || countryName;
    // discover supports with_genres, with_origin_country, with_text_query;
    // search/movie only supports query — use discover whenever any filter requires it
    const useDiscover = hasCountryFilter || genreIds;

    const movieParams = { api_key: API_KEY, language: "en-US", page: moviePage };
    const tvParams = { api_key: API_KEY, language: "en-US", page: tvPage };

    if (useDiscover) {
      movieParams.with_text_query = q;
      tvParams.with_text_query = q;
    } else {
      movieParams.query = q;
      tvParams.query = q;
    }

    if (hasCountryFilter) {
      const codes = getCountryCodes(continents, countryName);
      const countryParam = codes.join("|");
      movieParams.with_origin_country = countryParam;
      tvParams.with_origin_country = countryParam;
    }

    if (genreIds) {
      movieParams.with_genres = genreIds;
      tvParams.with_genres = genreIds;
    }

    if (yearMin) {
      movieParams["primary_release_date.gte"] = `${yearMin}-01-01`;
      tvParams["first_air_date.gte"] = `${yearMin}-01-01`;
    }
    if (yearMax) {
      movieParams["primary_release_date.lte"] = `${yearMax}-12-31`;
      tvParams["first_air_date.lte"] = `${yearMax}-12-31`;
    }

    const movieEndpoint = useDiscover ? `${BASE_URL}/discover/movie` : `${BASE_URL}/search/movie`;
    const tvEndpoint = useDiscover ? `${BASE_URL}/discover/tv` : `${BASE_URL}/search/tv`;

    const shouldFetchMovie = !skipMovie && type !== "tv";
    const shouldFetchTv = !skipTv && type !== "movie";

    const [movies, tv] = await Promise.all([
      shouldFetchMovie ? axios.get(movieEndpoint, { params: movieParams }) : Promise.resolve(null),
      shouldFetchTv ? axios.get(tvEndpoint, { params: tvParams }) : Promise.resolve(null),
    ]);

    let movieResults = (movies?.data.results ?? []).map((m) => ({
      tmdb_id: m.id,
      title: m.title,
      year: m.release_date?.slice(0, 4) ?? "N/A",
      poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
      rating: m.vote_average?.toFixed(1) ?? "N/A",
      overview: m.overview,
      popularity: m.popularity,
      genre_ids: m.genre_ids,
      production_countries: m.production_countries ?? [],
      type: "movie",
    }));

    let tvResults = (tv?.data.results ?? []).map((t) => ({
      tmdb_id: t.id,
      title: t.name,
      year: t.first_air_date?.slice(0, 4) ?? "N/A",
      poster_url: t.poster_path ? `${IMAGE_URL}${t.poster_path}` : null,
      rating: t.vote_average?.toFixed(1) ?? "N/A",
      overview: t.overview,
      popularity: t.popularity,
      genre_ids: t.genre_ids,
      origin_country: t.origin_country ?? [],
      type: "tv",
    }));

    if (yearMin || yearMax) {
      const min = yearMin ? parseInt(yearMin) : 0;
      const max = yearMax ? parseInt(yearMax) : 9999;
      const inRange = (item) => {
        const y = parseInt(item.year);
        return !isNaN(y) && y >= min && y <= max;
      };
      movieResults = movieResults.filter(inRange);
      tvResults = tvResults.filter(inRange);
    }

    if (genreIds) {
      const ids = genreIds.split(",").map(Number);
      movieResults = movieResults.filter((m) => ids.every((id) => m.genre_ids?.includes(id)));
      tvResults = tvResults.filter((t) => ids.every((id) => t.genre_ids?.includes(id)));
    }

    let combined;
    if (type === "movie") {
      combined = movieResults;
    } else if (type === "tv") {
      combined = tvResults;
    } else {
      combined = [...movieResults, ...tvResults];
    }

    const seen = new Set();
    combined = combined.filter((item) => {
      const key = `${item.tmdb_id}_${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    combined = combined.sort((a, b) => b.popularity - a.popularity);

    res.json({
      results: combined,
      moviePage: parseInt(moviePage),
      tvPage: parseInt(tvPage),
      ...(shouldFetchMovie && { movieHasMore: (movies?.data.total_pages ?? 0) > parseInt(moviePage) }),
      ...(shouldFetchTv && { tvHasMore: (tv?.data.total_pages ?? 0) > parseInt(tvPage) }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tmdb/detail/:tmdbId  - detalle completo con actores y director
router.get("/detail/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { type } = req.query;
  const endpoint = type === "tv" ? "tv" : "movie";

  try {
    const [detail, images] = await Promise.all([
      axios.get(`${BASE_URL}/${endpoint}/${tmdbId}`, {
        params: {
          api_key: API_KEY,
          language: "en-US",
          append_to_response: "credits",
        },
      }),
      axios.get(`${BASE_URL}/${endpoint}/${tmdbId}/images`, {
        params: { api_key: API_KEY },
      }),
    ]);

    const m = detail.data;
    const director = m.credits?.crew?.find((p) => p.job === "Director")?.name ?? "N/A";
    const cast = m.credits?.cast?.slice(0, 5).map((a) => a.name) ?? [];

    const gallery = images.data.backdrops.slice(0, 12).map((img) => `https://image.tmdb.org/t/p/w780${img.file_path}`);

    res.json({
      tmdb_id: m.id,
      title: m.title ?? m.name,
      year: (m.release_date ?? m.first_air_date)?.slice(0, 4) ?? "N/A",
      poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
      backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
      rating: m.vote_average?.toFixed(1) ?? "N/A",
      overview: m.overview,
      genres: m.genres?.map((g) => g.name) ?? [],
      runtime: m.runtime ?? m.episode_run_time?.[0] ?? null,
      type: type ?? "movie",
      director,
      cast,
      gallery,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET --Trae los generos
router.get("/genres", async (req, res) => {
  try {
    const [movies, tv] = await Promise.all([
      axios.get(`${BASE_URL}/genre/movie/list`, {
        params: { api_key: API_KEY, language: "en-US" },
      }),
      axios.get(`${BASE_URL}/genre/tv/list`, {
        params: { api_key: API_KEY, language: "en-US" },
      }),
    ]);

    const combined = [...movies.data.genres, ...tv.data.genres]
      .filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/popular", async (req, res) => {
  const { moviePage = 1, tvPage = 1, skipMovie, skipTv, yearMin, yearMax, genreIds, type, continents, countryName } = req.query;

  try {
    const movieParams = { api_key: API_KEY, language: "en-US", page: moviePage };
    const tvParams = { api_key: API_KEY, language: "en-US", page: tvPage };

    if (yearMin) {
      movieParams["primary_release_date.gte"] = `${yearMin}-01-01`;
      tvParams["first_air_date.gte"] = `${yearMin}-01-01`;
    }
    if (yearMax) {
      movieParams["primary_release_date.lte"] = `${yearMax}-12-31`;
      tvParams["first_air_date.lte"] = `${yearMax}-12-31`;
    }
    if (genreIds) {
      movieParams.with_genres = genreIds;
      tvParams.with_genres = genreIds;
    }

    if (continents || countryName) {
      const codes = getCountryCodes(continents, countryName);
      const countryParam = codes.join("|");
      movieParams.with_origin_country = countryParam;
      tvParams.with_origin_country = countryParam;
    }

    const useDiscover = genreIds || continents || countryName;
    const movieEndpoint = useDiscover ? `${BASE_URL}/discover/movie` : `${BASE_URL}/movie/popular`;
    const tvEndpoint = useDiscover ? `${BASE_URL}/discover/tv` : `${BASE_URL}/tv/popular`;

    const shouldFetchMovie = !skipMovie && type !== "tv";
    const shouldFetchTv = !skipTv && type !== "movie";

    const [movieResponse, tvResponse] = await Promise.all([
      shouldFetchMovie ? axios.get(movieEndpoint, { params: movieParams }) : Promise.resolve(null),
      shouldFetchTv ? axios.get(tvEndpoint, { params: tvParams }) : Promise.resolve(null),
    ]);

    let movieResults = (movieResponse?.data.results ?? []).map((m) => ({
      tmdb_id: m.id,
      title: m.title,
      year: m.release_date?.slice(0, 4) ?? "N/A",
      poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
      rating: m.vote_average?.toFixed(1) ?? "N/A",
      overview: m.overview,
      popularity: m.popularity,
      genre_ids: m.genre_ids,
      type: "movie",
    }));
    let tvResults = (tvResponse?.data.results ?? []).map((t) => ({
      tmdb_id: t.id,
      title: t.name,
      year: t.first_air_date?.slice(0, 4) ?? "N/A",
      poster_url: t.poster_path ? `${IMAGE_URL}${t.poster_path}` : null,
      rating: t.vote_average?.toFixed(1) ?? "N/A",
      overview: t.overview,
      popularity: t.popularity,
      genre_ids: t.genre_ids,
      type: "tv",
    }));

    if (yearMin || yearMax) {
      const min = yearMin ? parseInt(yearMin) : 0;
      const max = yearMax ? parseInt(yearMax) : 9999;
      const inRange = (item) => {
        const y = parseInt(item.year);
        return !isNaN(y) && y >= min && y <= max;
      };
      movieResults = movieResults.filter(inRange);
      tvResults = tvResults.filter(inRange);
    }

    let combined;
    if (type === "movie") combined = movieResults;
    else if (type === "tv") combined = tvResults;
    else combined = [...movieResults, ...tvResults];

    const seen = new Set();
    combined = combined.filter((item) => {
      const key = `${item.tmdb_id}_${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    combined = combined.sort((a, b) => b.popularity - a.popularity);

    res.json({
      results: combined,
      moviePage: parseInt(moviePage),
      tvPage: parseInt(tvPage),
      ...(shouldFetchMovie && { movieHasMore: (movieResponse?.data.total_pages ?? 0) > parseInt(moviePage) }),
      ...(shouldFetchTv && { tvHasMore: (tvResponse?.data.total_pages ?? 0) > parseInt(tvPage) }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/person/search/:name", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/search/person`, {
      params: { api_key: API_KEY, query: req.params.name, language: "en-US" },
    });
    const result = response.data.results[0];
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/person/:personId", async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 24;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const response = await axios.get(`${BASE_URL}/person/${req.params.personId}`, {
      params: {
        api_key: API_KEY,
        language: "en-US",
        append_to_response: "combined_credits",
      },
    });

    const p = response.data;

    const allCredits = p.combined_credits.cast
      .concat(p.combined_credits.crew.filter((c) => c.job === "Director"))
      .filter((c) => c.poster_path)
      .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    const total = allCredits.length;
    const credits = allCredits.slice(offset, offset + limit).map((c) => ({
      tmdb_id: c.id,
      title: c.title ?? c.name,
      year: (c.release_date ?? c.first_air_date)?.slice(0, 4) ?? "N/A",
      poster_url: `${IMAGE_URL}${c.poster_path}`,
      rating: c.vote_average?.toFixed(1) ?? "N/A",
      type: c.media_type,
      role: c.character ?? c.job ?? "",
    }));

    res.json({
      id: p.id,
      name: p.name,
      photo_url: p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : null,
      known_for: p.known_for_department,
      credits,
      page: parseInt(page),
      hasMore: offset + limit < total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/people/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro q" });

  try {
    const response = await axios.get(`${BASE_URL}/search/person`, {
      params: { api_key: API_KEY, query: q, language: "en-US" },
    });

    const results = response.data.results.slice(0, 12).map((p) => ({
      id: p.id,
      name: p.name,
      photo_url: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
      known_for: p.known_for_department ?? "Acting",
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/swipe", async (req, res) => {
  const { yearMin, yearMax, genreIds, type, exclude, userId, continents, countryName } = req.query;
  try {
    const randomPage = Math.floor(Math.random() * 10) + 1;
    const movieParams = {
      api_key: API_KEY,
      language: "en-US",
      page: randomPage,
    };
    const tvParams = { api_key: API_KEY, language: "en-US", page: randomPage };

    if (yearMin) {
      movieParams["primary_release_date.gte"] = `${yearMin}-01-01`;
      tvParams["first_air_date.gte"] = `${yearMin}-01-01`;
    }
    if (yearMax) {
      movieParams["primary_release_date.lte"] = `${yearMax}-12-31`;
      tvParams["first_air_date.lte"] = `${yearMax}-12-31`;
    }
    if (genreIds) {
      movieParams.with_genres = genreIds;
      tvParams.with_genres = genreIds;
    }
    if (continents || countryName) {
      const codes = getCountryCodes(continents, countryName);
      const countryParam = codes.join("|"); // OR entre países
      movieParams.with_origin_country = countryParam;
      tvParams.with_origin_country = countryParam;
    }
    const requests = [];
    if (genreIds || continents || countryName) {
      if (type !== "tv") requests.push(axios.get(`${BASE_URL}/discover/movie`, { params: movieParams }));
      if (type !== "movie") requests.push(axios.get(`${BASE_URL}/discover/tv`, { params: tvParams }));
    } else {
      if (type !== "tv") {
        requests.push(axios.get(`${BASE_URL}/movie/popular`, { params: movieParams }));
        requests.push(axios.get(`${BASE_URL}/discover/movie`, { params: movieParams }));
      }
      if (type !== "movie") {
        requests.push(axios.get(`${BASE_URL}/tv/popular`, { params: tvParams }));
        requests.push(axios.get(`${BASE_URL}/discover/tv`, { params: tvParams }));
      }
    }

    const responses = await Promise.all(requests);
    let pool = responses.flatMap((r) => r.data.results);

    if (yearMin || yearMax) {
      const min = yearMin ? parseInt(yearMin) : 0;
      const max = yearMax ? parseInt(yearMax) : 9999;
      pool = pool.filter((item) => {
        const y = parseInt((item.release_date ?? item.first_air_date)?.slice(0, 4));
        return !isNaN(y) && y >= min && y <= max;
      });
    }

    pool = pool.filter((item) => item.poster_path);

    // Excluir sesión + bloqueados permanentes
    const excludeIds = exclude ? exclude.split(",").map(Number) : [];
    let hiddenIds = [];
    if (userId) {
      const hidden = await db.query("SELECT tmdb_id FROM hidden_titles WHERE user_id = $1", [userId]);
      hiddenIds = hidden.rows.map((r) => r.tmdb_id);
    }
    const allExcluded = [...excludeIds, ...hiddenIds];
    pool = pool.filter((item) => !allExcluded.includes(item.id));

    if (!pool.length) return res.json(null);

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const isTV = !!pick.name;

    res.json({
      tmdb_id: pick.id,
      title: pick.title ?? pick.name,
      year: (pick.release_date ?? pick.first_air_date)?.slice(0, 4) ?? "N/A",
      poster_url: pick.poster_path ? `${IMAGE_URL}${pick.poster_path}` : null,
      rating: pick.vote_average?.toFixed(1) ?? "N/A",
      overview: pick.overview,
      popularity: pick.popularity,
      genre_ids: pick.genre_ids,
      type: isTV ? "tv" : "movie",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function hideTitle() {
  if (!currentSwipe) return;
  const userId = getUserId();
  await fetch(`${API}/hidden`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      tmdb_id: currentSwipe.tmdb_id,
      title: currentSwipe.title,
      poster_url: currentSwipe.poster_url,
      media_type: currentSwipe.type,
    }),
  });
  seenIds.add(currentSwipe.tmdb_id);
  await loadSwipe();
}

// Mapa de continentes a códigos de país ISO
const CONTINENT_COUNTRIES = {
  northamerica: ["US", "CA", "MX"],
  southamerica: ["AR", "BR", "CL", "CO", "PE", "VE", "UY", "PY", "BO", "EC"],
  europe: ["GB", "FR", "DE", "IT", "ES", "PT", "RU", "PL", "NL", "BE", "SE", "NO", "DK", "FI", "AT", "CH", "CZ", "HU", "RO", "GR", "TR"],
  asia: ["JP", "KR", "CN", "IN", "TH", "TW", "HK", "ID", "PH", "VN", "MY", "SG"],
  middleeast: ["IL", "IR", "SA", "AE", "EG", "IQ", "LB"],
  africa: ["ZA", "NG", "ET", "KE", "GH", "MA", "TN", "DZ"],
  oceania: ["AU", "NZ"],
};

// Normalizar texto (sin tildes ni mayúsculas)
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Mapa de nombres de países a códigos ISO
const COUNTRY_NAME_TO_ISO = {
  argentina: "AR",
  brazil: "BR",
  brasil: "BR",
  chile: "CL",
  colombia: "CO",
  peru: "PE",
  venezuela: "VE",
  uruguay: "UY",
  usa: "US",
  "united states": "US",
  "estados unidos": "US",
  canada: "CA",
  mexico: "MX",
  mejico: "MX",
  uk: "GB",
  "united kingdom": "GB",
  "reino unido": "GB",
  france: "FR",
  francia: "FR",
  germany: "DE",
  alemania: "DE",
  italy: "IT",
  italia: "IT",
  spain: "ES",
  espana: "ES",
  portugal: "PT",
  russia: "RU",
  rusia: "RU",
  japan: "JP",
  japon: "JP",
  korea: "KR",
  corea: "KR",
  "south korea": "KR",
  "corea del sur": "KR",
  china: "CN",
  india: "IN",
  thailand: "TH",
  tailandia: "TH",
  australia: "AU",
  "new zealand": "NZ",
  "nueva zelanda": "NZ",
  sweden: "SE",
  suecia: "SE",
  norway: "NO",
  noruega: "NO",
  denmark: "DK",
  dinamarca: "DK",
  finland: "FI",
  finlandia: "FI",
  netherlands: "NL",
  holanda: "NL",
  belgium: "BE",
  belgica: "BE",
  austria: "AT",
  switzerland: "CH",
  suiza: "CH",
  israel: "IL",
  iran: "IR",
  turkey: "TR",
  turquia: "TR",
  "south africa": "ZA",
  sudafrica: "ZA",
  poland: "PL",
  polonia: "PL",
  romania: "RO",
  rumania: "RO",
  greece: "GR",
  grecia: "GR",
  "czech republic": "CZ",
  chequia: "CZ",
  hungary: "HU",
  hungria: "HU",
  taiwan: "TW",
  "hong kong": "HK",
};

function getCountryCodes(continents, countryName) {
  const codes = new Set();

  if (continents) {
    continents.split(",").forEach((c) => {
      const countries = CONTINENT_COUNTRIES[c.trim().toLowerCase()];
      if (countries) countries.forEach((code) => codes.add(code));
    });
  }

  if (countryName) {
    const normalized = normalize(countryName.trim());
    const iso = COUNTRY_NAME_TO_ISO[normalized];
    if (iso) codes.add(iso);
    else codes.add(countryName.toUpperCase().trim()); // intentar directo
  }

  return [...codes];
}

module.exports = router;
