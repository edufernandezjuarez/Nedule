const API = '/api';

export const USER_IDS = { Edu: 1, Nicole: 2 };
export const getUserId = (username) => USER_IDS[username] ?? 1;

// ── Lists ──────────────────────────────────────────────────────────────────

export async function fetchLists(userId) {
  const res = await fetch(`${API}/lists/${userId}`);
  return res.json();
}

export async function createList(name, owner_id, is_shared) {
  const res = await fetch(`${API}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, owner_id, is_shared }),
  });
  return res.json();
}

export async function deleteList(listId) {
  await fetch(`${API}/lists/${listId}`, { method: 'DELETE' });
}

// ── Movies in list ─────────────────────────────────────────────────────────

export async function fetchMoviesInList(listId) {
  const res = await fetch(`${API}/movies/${listId}`);
  return res.json();
}

export async function addMovieToList(listId, movie, userId) {
  await fetch(`${API}/movies/${listId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...movie, added_by: userId }),
  });
}

export async function removeMovieFromList(listId, movieId) {
  await fetch(`${API}/movies/${listId}/${movieId}`, { method: 'DELETE' });
}

// ── TMDB ───────────────────────────────────────────────────────────────────

export async function fetchTmdbPopular(params) {
  const res = await fetch(`${API}/tmdb/popular?${new URLSearchParams(params)}`);
  return res.json();
}

export async function fetchTmdbSearch(q, params) {
  const res = await fetch(
    `${API}/tmdb/search?${new URLSearchParams({ q, ...params })}`,
  );
  return res.json();
}

export async function fetchTmdbDetail(tmdbId, type) {
  const res = await fetch(`${API}/tmdb/detail/${tmdbId}?type=${type}`);
  return res.json();
}

export async function fetchGenres() {
  const res = await fetch(`${API}/tmdb/genres`);
  return res.json();
}

export async function fetchPerson(personId, page = 1) {
  const res = await fetch(`${API}/tmdb/person/${personId}?page=${page}`);
  return res.json();
}

export async function searchPersonByName(name) {
  const res = await fetch(
    `${API}/tmdb/person/search/${encodeURIComponent(name)}`,
  );
  return res.json();
}

export async function searchPeople(q) {
  const res = await fetch(
    `${API}/tmdb/people/search?q=${encodeURIComponent(q)}`,
  );
  return res.json();
}

// ── Reviews ────────────────────────────────────────────────────────────────

export async function fetchReviews(tmdbId) {
  const res = await fetch(`${API}/reviews/${tmdbId}`);
  return res.json();
}

export async function submitReview(tmdbId, payload) {
  await fetch(`${API}/reviews/${tmdbId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(tmdbId, userId) {
  await fetch(`${API}/reviews/${tmdbId}/${userId}`, { method: 'DELETE' });
}

export async function fetchUserReviews(userId) {
  const res = await fetch(`${API}/reviews/user/${userId}`);
  return res.json();
}

// ── Progress ───────────────────────────────────────────────────────────────

export async function fetchProgress(tmdbId, userId) {
  const res = await fetch(`${API}/progress/${tmdbId}/${userId}`);
  return res.json();
}

export async function saveProgress(tmdbId, payload) {
  await fetch(`${API}/progress/${tmdbId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteProgress(movieId, userId) {
  await fetch(`${API}/progress/${movieId}/user/${userId}`, { method: 'DELETE' });
}

export async function fetchWatching(userId) {
  const res = await fetch(`${API}/progress/user/${userId}`);
  return res.json();
}

// ── Hidden ─────────────────────────────────────────────────────────────────

export async function fetchHidden(userId) {
  const res = await fetch(`${API}/hidden/${userId}`);
  return res.json();
}

export async function unhideTitle(userId, tmdbId) {
  await fetch(`${API}/hidden/${userId}/${tmdbId}`, { method: 'DELETE' });
}

export async function postHidden(payload) {
  await fetch(`${API}/hidden`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ── Swipe ──────────────────────────────────────────────────────────────────

export async function fetchTmdbSwipe(params) {
  const res = await fetch(`${API}/tmdb/swipe?${new URLSearchParams(params)}`);
  return res.json();
}
