const API = "https://nedule.uk/api";

let pendingMovie = null;

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    tmdbId: params.get("id"),
    type: params.get("type") ?? "movie",
  };
}

async function loadMovie() {
  const { tmdbId, type } = getParams();
  if (!tmdbId) return;

  const res = await fetch(`${API}/tmdb/detail/${tmdbId}?type=${type}`);
  const movie = await res.json();
  currentMovie = movie;

  document.title = `${movie.title} — Nedule`;

  if (movie.backdrop_url) {
    document.getElementById("movieBackdrop").style.backgroundImage = `url(${movie.backdrop_url})`;
  }

  document.getElementById("moviePoster").src = movie.poster_url ?? "";
  document.getElementById("moviePoster").alt = movie.title;
  document.getElementById("movieTitle").textContent = movie.title;

  document.getElementById("movieGenres").innerHTML = movie.genres.map((g) => `<span class="genre-badge">${g}</span>`).join("");

  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  document.getElementById("movieMeta").innerHTML = `
    <span>${movie.year}</span>
    ${runtime ? `<span class="meta-dot">·</span><span>${runtime}</span>` : ""}
    <span class="meta-dot">·</span>
    <span class="meta-type">${movie.type === "tv" ? "Series" : "Movie"}</span>
    <span class="meta-dot">·</span>
    <span class="meta-rating">★ ${movie.rating}</span>
  `;

  document.getElementById("movieOverview").textContent = movie.overview;

  document.getElementById("movieCrew").innerHTML =
    movie.director !== "N/A"
      ? `<span class="crew-label">Director</span> <span class="crew-value">
      <a class="person-link" href="/person.html?name=${encodeURIComponent(movie.director)}">${movie.director}</a>
     </span>`
      : "";

  document.getElementById("movieCast").innerHTML = movie.cast.length
    ? `<span class="crew-label">Cast</span> <span class="crew-value">
      ${movie.cast.map((a) => `<a class="person-link" href="/person.html?name=${encodeURIComponent(a)}">${a}</a>`).join(", ")}
     </span>`
    : "";

  document.getElementById("btnAddToList").onclick = () => openAddModal(movie);

  renderGallery(movie.gallery ?? []);

  if (type === "tv") {
    document.getElementById("progressTracker").classList.remove("hidden");
    await loadProgress(tmdbId);
  }

  buildStars();
  await loadReviews(tmdbId);
}

function renderGallery(images) {
  const section = document.getElementById("gallerySection");
  const grid = document.getElementById("galleryGrid");

  if (!images.length) {
    section.style.display = "none";
    return;
  }

  images.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.className = "gallery-img";
    img.loading = "lazy";
    grid.appendChild(img);
  });
}

// ── MODAL AGREGAR A LISTA ──
function openAddModal(movie) {
  pendingMovie = movie;
  const container = document.getElementById("modalListOptions");
  container.innerHTML = '<p style="font-size:13px;color:var(--text-secondary);">Loading...</p>';
  document.getElementById("addToListModal").classList.remove("hidden");
  loadListOptions();
}

function closeAddModal() {
  document.getElementById("addToListModal").classList.add("hidden");
  pendingMovie = null;
}

async function loadListOptions() {
  const userId = getUserId();
  const res = await fetch(`${API}/lists/${userId}`);
  const data = await res.json();
  const allLists = [...data.personal, ...data.shared];
  const container = document.getElementById("modalListOptions");
  container.innerHTML = "";

  if (allLists.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-secondary);">No lists yet</p>';
    return;
  }

  allLists.forEach((list) => {
    const btn = document.createElement("button");
    btn.className = "list-option-btn";
    btn.innerHTML = `
      <div class="list-option-icon ${list.is_shared ? "shared" : "personal"}"></div>
      <span>${list.name}</span>
      ${list.is_shared ? '<span class="shared-badge">Shared</span>' : ""}
    `;
    btn.onclick = () => confirmAddMovie(list.id);
    container.appendChild(btn);
  });
}

async function confirmAddMovie(listId) {
  if (!pendingMovie) return;
  const userId = getUserId();
  await fetch(`${API}/movies/${listId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...pendingMovie, added_by: userId }),
  });
  closeAddModal();
}

document.addEventListener("DOMContentLoaded", loadMovie);

//--Reviews--
let selectedRating = 0;
let currentMovie = null;

async function loadReviews(tmdbId) {
  const res = await fetch(`${API}/reviews/${tmdbId}`);
  const reviews = await res.json();
  renderReviews(reviews);
}

function renderReviews(reviews) {
  const container = document.getElementById("reviewsList");
  container.innerHTML = "";

  if (reviews.length === 0) {
    container.innerHTML = '<p class="empty-msg">No reviews yet</p>';
    return;
  }

  const { tmdbId } = getParams();
  const userId = getUserId();

  reviews.forEach((r) => {
    const div = document.createElement("div");
    div.className = "review-card";
    div.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">${r.username[0]}</div>
        <span class="review-username">${r.username}</span>
        <span class="review-rating">${"★".repeat(r.rating)}${"☆".repeat(10 - r.rating)}</span>
        <span class="review-score">${r.rating}/10</span>
        ${r.user_id === userId ? `<button class="review-delete-btn" onclick="deleteReview('${tmdbId}', ${r.user_id})">✕</button>` : ""}
      </div>
      ${r.comment ? `<p class="review-comment">${r.comment}</p>` : ""}
    `;
    container.appendChild(div);
  });
}

function buildStars() {
  const row = document.getElementById("starsRow");
  row.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const star = document.createElement("button");
    star.className = "star-btn";
    star.textContent = "★";
    star.dataset.value = i;
    star.onclick = () => setRating(i);
    row.appendChild(star);
  }
}

function setRating(value) {
  selectedRating = value;
  document.querySelectorAll(".star-btn").forEach((s) => {
    s.classList.toggle("active", parseInt(s.dataset.value) <= value);
  });
}

async function submitReview() {
  if (!selectedRating) {
    alert("Please select a rating");
    return;
  }

  const { tmdbId, type } = getParams();
  const comment = document.getElementById("reviewComment").value.trim();
  const userId = getUserId();

  await fetch(`${API}/reviews/${tmdbId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      rating: selectedRating,
      comment,
      title: currentMovie.title,
      year: currentMovie.year,
      poster_url: currentMovie.poster_url,
    }),
  });

  selectedRating = 0;
  document.getElementById("reviewComment").value = "";
  buildStars();
  await loadReviews(tmdbId);
}
async function deleteReview(tmdbId, userId) {
  await fetch(`${API}/reviews/${tmdbId}/${userId}`, { method: "DELETE" });
  await loadReviews(tmdbId);
}

//--Progreso en series--
let progressData = { season: 1, episode: 1 };

async function loadProgress(tmdbId) {
  const userId = getUserId();
  const res = await fetch(`${API}/progress/${tmdbId}/${userId}`);
  const data = await res.json();

  if (data) {
    progressData.season = data.season;
    progressData.episode = data.episode;
    document.getElementById("seasonCount").textContent = data.season;
    document.getElementById("episodeCount").textContent = data.episode;
  }
}

async function updateCounter(field, delta) {
  progressData[field] = Math.max(1, progressData[field] + delta);
  document.getElementById(field === "season" ? "seasonCount" : "episodeCount").textContent = progressData[field];
  await saveProgress();
}

async function saveProgress() {
  const { tmdbId } = getParams();
  const userId = getUserId();
  await fetch(`${API}/progress/${tmdbId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      season: progressData.season,
      episode: progressData.episode,
      title: currentMovie.title,
      year: currentMovie.year,
      poster_url: currentMovie.poster_url,
    }),
  });
}
