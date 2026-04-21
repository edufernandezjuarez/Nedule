const API = "http://localhost:3000/api";
let activeListId = null;
let activeListName = null;

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

// ── CARGAR LISTAS ──
async function loadLists() {
  const userId = getUserId();
  const res = await fetch(`${API}/lists/${userId}`);
  const data = await res.json();
  renderFolders(data.personal, "personalLists", false);
  renderFolders(data.shared, "sharedLists", true);
}

function renderFolders(lists, containerId, isShared) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (lists.length === 0) {
    container.innerHTML = '<p class="empty-msg">No hay listas todavía</p>';
    return;
  }

  lists.forEach((list) => {
    const folder = document.createElement("div");
    folder.className = `folder ${isShared ? "shared" : "personal"}`;
    folder.innerHTML = `
      <div class="folder-icon"></div>
      <div class="folder-name">${list.name}</div>
    `;
    folder.onclick = () => openList(list.id, list.name, isShared);
    container.appendChild(folder);
  });
}

// ── ABRIR LISTA ──
async function openList(listId, listName, isShared) {
  activeListId = listId;
  activeListName = listName;

  document.getElementById("listTitle").textContent = listName;

  document.getElementById("listsView").classList.add("hidden");
  document.getElementById("moviesView").classList.remove("hidden");

  await loadMovies(listId);
}

function goBack() {
  document.getElementById("moviesView").classList.add("hidden");
  document.getElementById("listsView").classList.remove("hidden");
  document.getElementById("searchResults").classList.add("hidden");
  document.getElementById("searchInput").value = "";
}

// ── PELÍCULAS DE UNA LISTA ──
async function loadMovies(listId) {
  const res = await fetch(`${API}/movies/${listId}`);
  const movies = await res.json();
  renderMovies(movies);
}

function renderMovies(movies) {
  const grid = document.getElementById("moviesGrid");
  grid.innerHTML = "";

  if (movies.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No hay películas en esta lista</p>';
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <div class="movie-poster">
        ${
          movie.poster_url
            ? `<img src="${movie.poster_url}" alt="${movie.title}" />`
            : '<div class="no-poster">Sin poster</div>'
        }
      </div>
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-year">${movie.year}</div>
        <div class="movie-rating">★ ${movie.imdb_rating}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── BUSCAR EN TMDB ──
let searchPage = 1;
let currentQuery = "";
let isLoadingMore = false;

async function searchMovies() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return;

  currentQuery = q;
  searchPage = 1;

  const container = document.getElementById("searchResults");
  container.classList.remove("hidden");
  container.innerHTML = "";

  await fetchAndRenderResults(true);
}

async function fetchAndRenderResults(reset = false) {
  if (isLoadingMore) return;
  isLoadingMore = true;

  const container = document.getElementById("searchResults");

  const loadingEl = document.createElement("div");
  loadingEl.className = "search-loading";
  loadingEl.id = "searchLoading";
  loadingEl.textContent = "Cargando...";
  container.appendChild(loadingEl);

  const res = await fetch(
    `${API}/tmdb/search?q=${encodeURIComponent(currentQuery)}&page=${searchPage}`,
  );
  const data = await res.json();

  document.getElementById("searchLoading")?.remove();

  data.results.forEach((item) => {
    const el = document.createElement("div");
    el.className = "search-item";
    el.innerHTML = `
      <img src="${item.poster_url || ""}" alt="${item.title}" class="search-thumb" />
      <div class="search-info">
        <span class="search-title">${item.title}</span>
        <span class="search-year">${item.year} · ${item.type === "tv" ? "Serie" : "Película"}</span>
      </div>
      <button onclick="addMovie(${JSON.stringify(item).replace(/"/g, "&quot;")})">+</button>
    `;
    container.appendChild(el);
  });

  if (data.hasMore) {
    const loadMoreEl = document.createElement("div");
    loadMoreEl.className = "search-load-more";
    loadMoreEl.id = "loadMoreBtn";
    loadMoreEl.textContent = "Cargar más";
    loadMoreEl.onclick = () => {
      searchPage++;
      loadMoreEl.remove();
      fetchAndRenderResults();
    };
    container.appendChild(loadMoreEl);
  }

  isLoadingMore = false;
}

// ── AGREGAR PELÍCULA ──
async function addMovie(movie) {
  const userId = getUserId();
  await fetch(`${API}/movies/${activeListId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...movie, added_by: userId }),
  });

  document.getElementById("searchResults").classList.add("hidden");
  document.getElementById("searchInput").value = "";
  await loadMovies(activeListId);
}

// ── NUEVA LISTA ──
function openNewListModal() {
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.getElementById("newListName").value = "";
  document.getElementById("newListShared").checked = false;
}

async function createList() {
  const name = document.getElementById("newListName").value.trim();
  const is_shared = document.getElementById("newListShared").checked;
  if (!name) return;

  const userId = getUserId(); // ← asegurate que devuelve un número

  await fetch(`${API}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, owner_id: userId, is_shared }),
  });

  closeModal();
  await loadLists();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("searchInput")) {
    document.getElementById("searchInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchMovies();
    });
  }
  if (document.getElementById("personalLists")) {
    loadLists();
  }
});
