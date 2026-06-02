const express = require("express");
const router = express.Router();
const db = require("../db");

const BASE_URL = process.env.TMDB_BASE_URL;
const API_KEY = process.env.TMDB_API_KEY;
const IMAGE_URL = process.env.TMDB_IMAGE_URL;

// Helper: fetch JSON from TMDB
async function tmdb(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { "Accept-Encoding": "identity" },
  });
  const data = await res.json();
  return data;
}

// ── SORT MAP ──────────────────────────────────────────────────────────────────
const SORT_MAP = {
  popularity_desc: "popularity.desc",
  popularity_asc: "popularity.asc",
  rating_desc: "vote_average.desc",
  rating_asc: "vote_average.asc",
  year_desc: "primary_release_date.desc",
  year_asc: "primary_release_date.asc",
};
const SORT_MAP_TV = {
  popularity_desc: "popularity.desc",
  popularity_asc: "popularity.asc",
  rating_desc: "vote_average.desc",
  rating_asc: "vote_average.asc",
  year_desc: "first_air_date.desc",
  year_asc: "first_air_date.asc",
};

// ── GET /api/tmdb/search ──────────────────────────────────────────────────────
router.get("/search", async (req, res) => {
  const { q, moviePage = 1, tvPage = 1, skipMovie, skipTv, yearMin, yearMax, genreIds, type, continents, countryName, sortBy, voteCountLevel } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro q" });

  try {
    const hasCountryFilter = continents || countryName;
    const useDiscover = hasCountryFilter || genreIds || sortBy;

    const movieP = { page: moviePage };
    const tvP = { page: tvPage };

    if (useDiscover) {
      movieP.with_text_query = q;
      tvP.with_text_query = q;
    } else {
      movieP.query = q;
      tvP.query = q;
    }

    if (hasCountryFilter) {
      const codes = getCountryCodes(continents, countryName).join("|");
      movieP.with_origin_country = codes;
      tvP.with_origin_country = codes;
    }
    if (genreIds) {
      movieP.with_genres = genreIds;
      tvP.with_genres = genreIds;
    }
    if (yearMin) {
      movieP["primary_release_date.gte"] = `${yearMin}-01-01`;
      tvP["first_air_date.gte"] = `${yearMin}-01-01`;
    }
    if (yearMax) {
      movieP["primary_release_date.lte"] = `${yearMax}-12-31`;
      tvP["first_air_date.lte"] = `${yearMax}-12-31`;
    }

    if (sortBy && SORT_MAP[sortBy]) {
      movieP.sort_by = SORT_MAP[sortBy];
      tvP.sort_by = SORT_MAP_TV[sortBy];
      if (sortBy.startsWith("rating")) {
        const level = parseInt(voteCountLevel ?? "0");
        if (level === 0) {
          movieP["vote_count.gte"] = 100;
          tvP["vote_count.gte"] = 100;
        } else if (level === 1) {
          movieP["vote_count.gte"] = 20;
          tvP["vote_count.gte"] = 20;
        }
      }
    }

    const movieEndpoint = useDiscover ? "/discover/movie" : "/search/movie";
    const tvEndpoint = useDiscover ? "/discover/tv" : "/search/tv";

    const shouldFetchMovie = !skipMovie && type !== "tv";
    const shouldFetchTv = !skipTv && type !== "movie";

    const [movies, tv] = await Promise.all([shouldFetchMovie ? tmdb(movieEndpoint, movieP) : null, shouldFetchTv ? tmdb(tvEndpoint, tvP) : null]);

    let movieResults = (movies?.results ?? []).map((m) => ({
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

    let tvResults = (tv?.results ?? []).map((t) => ({
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
      const inRange = (i) => {
        const y = parseInt(i.year);
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

    let combined = type === "movie" ? movieResults : type === "tv" ? tvResults : [...movieResults, ...tvResults];
    const seen = new Set();
    combined = combined.filter((i) => {
      const k = `${i.tmdb_id}_${i.type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (!sortBy) combined = combined.sort((a, b) => b.popularity - a.popularity);

    const { userId } = req.query;
    if (userId) {
      const hidden = await db.query("SELECT tmdb_id FROM hidden_titles WHERE user_id = $1", [userId]);
      const hiddenIds = hidden.rows.map((r) => r.tmdb_id);
      combined = combined.filter((i) => !hiddenIds.includes(i.tmdb_id));
    }

    res.json({
      results: combined,
      moviePage: parseInt(moviePage),
      tvPage: parseInt(tvPage),
      ...(shouldFetchMovie && { movieHasMore: (movies?.total_pages ?? 0) > parseInt(moviePage) }),
      ...(shouldFetchTv && { tvHasMore: (tv?.total_pages ?? 0) > parseInt(tvPage) }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tmdb/detail/:tmdbId ──────────────────────────────────────────────
router.get("/detail/:tmdbId", async (req, res) => {
  const { tmdbId } = req.params;
  const { type } = req.query;
  const endpoint = type === "tv" ? "tv" : "movie";

  try {
    const [detail, images] = await Promise.all([
      tmdb(`/${endpoint}/${tmdbId}`, { append_to_response: "credits" }),
      tmdb(`/${endpoint}/${tmdbId}/images`, { include_image_language: "en,null" }),
    ]);

    const m = detail;
    const director = m.credits?.crew?.find((p) => p.job === "Director")?.name ?? "N/A";
    const cast = m.credits?.cast?.slice(0, 5).map((a) => a.name) ?? [];
    const fullCast = [
      ...(m.credits?.cast ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        role: "acting",
        character: a.character ?? "",
        photo_url: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
        order: a.order,
      })),
      ...(m.credits?.crew ?? [])
        .filter((c) => c.job === "Director")
        .map((c) => ({
          id: c.id,
          name: c.name,
          role: "directing",
          character: "",
          photo_url: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          order: -1,
        })),
    ].sort((a, b) => a.order - b.order);
    const gallery = (images.backdrops ?? []).slice(0, 12).map((img) => `https://image.tmdb.org/t/p/w780${img.file_path}`);

    res.json({
      tmdb_id: m.id,
      title: m.title ?? m.name,
      year: (m.release_date ?? m.first_air_date)?.slice(0, 4) ?? "N/A",
      poster_url: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : null,
      backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
      rating: m.vote_average?.toFixed(1) ?? "N/A",
      overview: m.overview,
      genres: m.genres?.map((g) => g.name) ?? [],
      genre_ids: m.genres?.map((g) => g.id) ?? [],
      origin_country: m.production_countries?.[0]?.iso_3166_1 ?? "",
      runtime: m.runtime ?? m.episode_run_time?.[0] ?? null,
      number_of_seasons: m.number_of_seasons ?? null,
      number_of_episodes: m.number_of_episodes ?? null,
      type: type ?? "movie",
      director,
      cast,
      gallery,
      fullCast,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/tmdb/tv/:tvId/season/:season
router.get("/tv/:tvId/season/:season", async (req, res) => {
  const { tvId, season } = req.params;
  try {
    const data = await tmdb(`/tv/${tvId}/season/${season}`);
    const episodes = (data.episodes ?? []).map((ep) => ({
      episode_number: ep.episode_number,
      name: ep.name,
      overview: ep.overview,
      still_url: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null,
      air_date: ep.air_date,
      runtime: ep.runtime ?? null,
      rating: ep.vote_average?.toFixed(1) ?? "N/A",
    }));
    res.json({ season: parseInt(season), episodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/tmdb/tv/:tvId/season/:season/episode/:ep
router.get("/tv/:tvId/season/:season/episode/:ep", async (req, res) => {
  const { tvId, season, ep } = req.params;
  try {
    const [detail, images] = await Promise.all([
      tmdb(`/tv/${tvId}/season/${season}/episode/${ep}`, { append_to_response: "credits" }),
      tmdb(`/tv/${tvId}/season/${season}/episode/${ep}/images`),
    ]);

    const director = detail.credits?.crew?.find((p) => p.job === "Director")?.name ?? "N/A";
    const cast = detail.credits?.cast?.slice(0, 5).map((a) => a.name) ?? [];
    const gallery = (images.stills ?? []).slice(0, 12).map((s) => `https://image.tmdb.org/t/p/w780${s.file_path}`);
    const fullCast = [
      ...(detail.credits?.cast ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        role: "acting",
        character: a.character ?? "",
        photo_url: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
        order: a.order,
      })),
      ...(detail.credits?.crew ?? [])
        .filter((c) => c.job === "Director")
        .map((c) => ({
          id: c.id,
          name: c.name,
          role: "directing",
          character: "",
          photo_url: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          order: -1,
        })),
    ].sort((a, b) => a.order - b.order);

    res.json({
      episode_number: detail.episode_number,
      season_number: detail.season_number,
      name: detail.name,
      overview: detail.overview,
      air_date: detail.air_date,
      runtime: detail.runtime ?? null,
      rating: detail.vote_average?.toFixed(1) ?? "N/A",
      still_url: detail.still_path ? `https://image.tmdb.org/t/p/w780${detail.still_path}` : null,
      director,
      cast,
      gallery,
      fullCast,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── GET /api/tmdb/genres ──────────────────────────────────────────────────────
router.get("/genres", async (req, res) => {
  try {
    const [movies, tv] = await Promise.all([tmdb("/genre/movie/list"), tmdb("/genre/tv/list")]);
    const combined = [...movies.genres, ...tv.genres]
      .filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tmdb/popular ─────────────────────────────────────────────────────
router.get("/popular", async (req, res) => {
  const { moviePage = 1, tvPage = 1, skipMovie, skipTv, yearMin, yearMax, genreIds, type, continents, countryName, sortBy, voteCountLevel } = req.query;

  try {
    const movieP = { page: moviePage };
    const tvP = { page: tvPage };

    if (yearMin) {
      movieP["primary_release_date.gte"] = `${yearMin}-01-01`;
      tvP["first_air_date.gte"] = `${yearMin}-01-01`;
    }
    if (yearMax) {
      movieP["primary_release_date.lte"] = `${yearMax}-12-31`;
      tvP["first_air_date.lte"] = `${yearMax}-12-31`;
    }
    if (genreIds) {
      movieP.with_genres = genreIds;
      tvP.with_genres = genreIds;
    }
    if (continents || countryName) {
      const codes = getCountryCodes(continents, countryName).join("|");
      movieP.with_origin_country = codes;
      tvP.with_origin_country = codes;
    }
    if (sortBy && SORT_MAP[sortBy]) {
      movieP.sort_by = SORT_MAP[sortBy];
      tvP.sort_by = SORT_MAP_TV[sortBy];
      if (sortBy.startsWith("rating")) {
        const level = parseInt(voteCountLevel ?? "0");
        if (level === 0) {
          movieP["vote_count.gte"] = 100;
          tvP["vote_count.gte"] = 100;
        } else if (level === 1) {
          movieP["vote_count.gte"] = 20;
          tvP["vote_count.gte"] = 20;
        }
      }
    }

    const useDiscover = genreIds || continents || countryName || yearMin || yearMax || sortBy;
    const movieEndpoint = useDiscover ? "/discover/movie" : "/movie/popular";
    const tvEndpoint = useDiscover ? "/discover/tv" : "/tv/popular";

    const shouldFetchMovie = !skipMovie && type !== "tv";
    const shouldFetchTv = !skipTv && type !== "movie";

    const [movieData, tvData] = await Promise.all([shouldFetchMovie ? tmdb(movieEndpoint, movieP) : null, shouldFetchTv ? tmdb(tvEndpoint, tvP) : null]);

    let movieResults = (movieData?.results ?? []).map((m) => ({
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
    let tvResults = (tvData?.results ?? []).map((t) => ({
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

    let combined = type === "movie" ? movieResults : type === "tv" ? tvResults : [...movieResults, ...tvResults];
    const seen = new Set();
    combined = combined.filter((i) => {
      const k = `${i.tmdb_id}_${i.type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (!sortBy) combined = combined.sort((a, b) => b.popularity - a.popularity);

    const { userId } = req.query;
    if (userId) {
      const hidden = await db.query("SELECT tmdb_id FROM hidden_titles WHERE user_id = $1", [userId]);
      const hiddenIds = hidden.rows.map((r) => r.tmdb_id);
      combined = combined.filter((i) => !hiddenIds.includes(i.tmdb_id));
    }

    res.json({
      results: combined,
      moviePage: parseInt(moviePage),
      tvPage: parseInt(tvPage),
      ...(shouldFetchMovie && { movieHasMore: (movieData?.total_pages ?? 0) > parseInt(moviePage) }),
      ...(shouldFetchTv && { tvHasMore: (tvData?.total_pages ?? 0) > parseInt(tvPage) }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tmdb/person/search/:name ────────────────────────────────────────
router.get("/person/search/:name", async (req, res) => {
  try {
    const data = await tmdb("/search/person", { query: req.params.name });
    const result = data.results[0];
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tmdb/person/:personId ───────────────────────────────────────────
router.get("/person/:personId", async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 24;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const p = await tmdb(`/person/${req.params.personId}`, { append_to_response: "combined_credits" });

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
      popularity: c.popularity ?? 0,
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

// ── GET /api/tmdb/people/search ──────────────────────────────────────────────
router.get("/people/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro q" });
  try {
    const data = await tmdb("/search/person", { query: q });
    const results = data.results.slice(0, 12).map((p) => ({
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

// ── GET /api/tmdb/swipe ──────────────────────────────────────────────────────
router.get("/swipe", async (req, res) => {
  const { yearMin, yearMax, genreIds, type, exclude, userId, continents, countryName } = req.query;
  try {
    const randomPage = Math.floor(Math.random() * 10) + 1;
    const movieP = { page: randomPage };
    const tvP = { page: randomPage };

    if (yearMin) {
      movieP["primary_release_date.gte"] = `${yearMin}-01-01`;
      tvP["first_air_date.gte"] = `${yearMin}-01-01`;
    }
    if (yearMax) {
      movieP["primary_release_date.lte"] = `${yearMax}-12-31`;
      tvP["first_air_date.lte"] = `${yearMax}-12-31`;
    }
    if (genreIds) {
      movieP.with_genres = genreIds;
      tvP.with_genres = genreIds;
    }
    if (continents || countryName) {
      const codes = getCountryCodes(continents, countryName).join("|");
      movieP.with_origin_country = codes;
      tvP.with_origin_country = codes;
    }

    const requests = [];
    if (genreIds || continents || countryName) {
      if (type !== "tv") requests.push(tmdb("/discover/movie", movieP));
      if (type !== "movie") requests.push(tmdb("/discover/tv", tvP));
    } else {
      if (type !== "tv") {
        requests.push(tmdb("/movie/popular", movieP));
        requests.push(tmdb("/discover/movie", movieP));
      }
      if (type !== "movie") {
        requests.push(tmdb("/tv/popular", tvP));
        requests.push(tmdb("/discover/tv", tvP));
      }
    }

    const responses = await Promise.all(requests);
    let pool = responses.flatMap((r) => r.results ?? []);

    if (yearMin || yearMax) {
      const min = yearMin ? parseInt(yearMin) : 0;
      const max = yearMax ? parseInt(yearMax) : 9999;
      pool = pool.filter((i) => {
        const y = parseInt((i.release_date ?? i.first_air_date)?.slice(0, 4));
        return !isNaN(y) && y >= min && y <= max;
      });
    }
    pool = pool.filter((i) => i.poster_path);

    const excludeIds = exclude ? exclude.split(",").map(Number) : [];

    let watchedIds = [];
    let hiddenIds = [];
    if (userId) {
      const [watched, hidden] = await Promise.all([
        db.query(`SELECT m.imdb_id FROM watched w JOIN movies m ON w.movie_id = m.id WHERE w.user_id = $1`, [userId]),
        db.query(`SELECT tmdb_id FROM hidden_titles WHERE user_id = $1`, [userId]),
      ]);
      watchedIds = watched.rows.map((r) => parseInt(r.imdb_id.replace("tmdb_", "")));
      hiddenIds = hidden.rows.map((r) => r.tmdb_id);
    }
    pool = pool.filter((i) => ![...excludeIds, ...watchedIds, ...hiddenIds].includes(i.id));

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

// ── Helpers ───────────────────────────────────────────────────────────────────
const CONTINENT_COUNTRIES = {
  northamerica: ["US", "CA", "MX"],
  southamerica: ["AR", "BR", "CL", "CO", "PE", "VE", "UY", "PY", "BO", "EC"],
  europe: ["GB", "FR", "DE", "IT", "ES", "PT", "RU", "PL", "NL", "BE", "SE", "NO", "DK", "FI", "AT", "CH", "CZ", "HU", "RO", "GR", "TR"],
  asia: ["JP", "KR", "CN", "IN", "TH", "TW", "HK", "ID", "PH", "VN", "MY", "SG"],
  middleeast: ["IL", "IR", "SA", "AE", "EG", "IQ", "LB"],
  africa: ["ZA", "NG", "ET", "KE", "GH", "MA", "TN", "DZ"],
  oceania: ["AU", "NZ"],
};

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
      (CONTINENT_COUNTRIES[c.trim().toLowerCase()] ?? []).forEach((code) => codes.add(code));
    });
  }
  if (countryName) {
    const iso = COUNTRY_NAME_TO_ISO[normalize(countryName.trim())];
    if (iso) codes.add(iso);
    else codes.add(countryName.toUpperCase().trim());
  }
  return [...codes];
}

// GET /api/tmdb/season-thumb/:tmdbId/:season
router.get("/season-thumb/:tmdbId/:season", async (req, res) => {
  const { tmdbId, season } = req.params;
  try {
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=${process.env.TMDB_API_KEY}&language=es`;
    const response = await fetch(url);
    const data = await response.json();
    const ep1 = data.episodes?.[0];
    const thumb = ep1?.still_path ? `https://image.tmdb.org/t/p/w300${ep1.still_path}` : null;
    res.json({ thumb });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
