const API = "http://localhost:3000/api";
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

  document.title = `${movie.title} — Nedule`;

  if (movie.backdrop_url) {
    document.getElementById("movieBackdrop").style.backgroundImage =
      `url(${movie.backdrop_url})`;
  }

  document.getElementById("moviePoster").src = movie.poster_url ?? "";
  document.getElementById("moviePoster").alt = movie.title;
  document.getElementById("movieTitle").textContent = movie.title;

  document.getElementById("movieGenres").innerHTML = movie.genres
    .map((g) => `<span class="genre-badge">${g}</span>`)
    .join("");

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
      ? `<span class="crew-label">Director</span> <span class="crew-value">${movie.director}</span>`
      : "";

  document.getElementById("movieCast").innerHTML = movie.cast.length
    ? `<span class="crew-label">Cast</span> <span class="crew-value">${movie.cast.join(", ")}</span>`
    : "";

  document.getElementById("btnAddToList").onclick = () => openAddModal(movie);

  renderGallery(movie.gallery ?? []);
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
  container.innerHTML =
    '<p style="font-size:13px;color:var(--text-secondary);">Loading...</p>';
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
    container.innerHTML =
      '<p style="font-size:13px;color:var(--text-secondary);">No lists yet</p>';
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
