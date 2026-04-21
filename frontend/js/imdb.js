const API = "http://localhost:3000/api";
let activeListId = null;
let activeListName = null;

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

// -- CARGAR LISTAS --
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
      <button class="folder-menu-btn" onclick="toggleFolderMenu(event, ${list.id})">&#8942;</button>
      <div class="folder-menu hidden" id="folderMenu-${list.id}">
        <button onclick="deleteList(event, ${list.id})">Delete</button>
      </div>
    `;
    folder.onclick = () => openList(list.id, list.name, isShared);
    container.appendChild(folder);
  });
}
// -- MENU LISTA --
function toggleFolderMenu(e, listId) {
  e.stopPropagation();
  document.querySelectorAll(".folder-menu").forEach((m) => {
    if (m.id !== `folderMenu-${listId}`) m.classList.add("hidden");
  });
  document.getElementById(`folderMenu-${listId}`).classList.toggle("hidden");
}

async function deleteList(e, listId) {
  e.stopPropagation();
  await fetch(`${API}/lists/${listId}`, { method: "DELETE" });
  await loadLists();
}

document.addEventListener("click", () => {
  document
    .querySelectorAll(".folder-menu")
    .forEach((m) => m.classList.add("hidden"));
});

// -- ABRIR LISTA --
async function openList(listId, listName, isShared) {
  activeListId = listId;
  activeListName = listName;
  deleteMode = false;

  document.getElementById("listTitle").textContent = listName;

  document.getElementById("btnDeleteMode").classList.remove("hidden");
  document.getElementById("btnDone").classList.add("hidden");

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
    card.className = `movie-card clickable ${deleteMode ? "delete-mode" : ""}`;
    card.onclick = () => {
      const tmdbId = movie.imdb_id.replace("tmdb_", "");
      window.location.href = `/movie.html?id=${tmdbId}&type=movie`;
    };
    card.innerHTML = `
      <button class="delete-x" onclick="removeMovie(${movie.id})">✕</button>
      <div class="movie-poster">
        ${
          movie.poster_url
            ? `<img src="${movie.poster_url}" alt="${movie.title}" />`
            : '<div class="no-poster">No poster</div>'
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

// -- BUSCAR EN TMDB --
let searchPage = 1;
let currentQuery = "";
let isLoadingMore = false;

async function searchMovies() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return;

  currentQuery = q;
  searchPage = 1;
  removeInfiniteScroll();

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
  loadingEl.textContent = "Loading...";
  container.appendChild(loadingEl);

  const params = new URLSearchParams({
    q: currentQuery,
    page: searchPage,
    ...(activeFilters.yearMin && { yearMin: activeFilters.yearMin }),
    ...(activeFilters.yearMax && { yearMax: activeFilters.yearMax }),
  });

  const res = await fetch(`${API}/tmdb/search?${params}`);
  const data = await res.json();

  document.getElementById("searchLoading")?.remove();

  data.results.forEach((item) => {
    const card = document.createElement("div");
    card.className = "movie-card search-card clickable";
    card.onclick = (e) => {
      if (e.target.classList.contains("add-btn")) return;
      window.location.href = `/movie.html?id=${item.tmdb_id}&type=${item.type}`;
    };
    card.innerHTML = `
      <div class="movie-poster">
        ${
          item.poster_url
            ? `<img src="${item.poster_url}" alt="${item.title}" />`
            : '<div class="no-poster">No poster</div>'
        }
      </div>
      <div class="movie-info">
        <div class="movie-title">${item.title}</div>
        <div class="movie-year">${item.year} · ${item.type === "tv" ? "Series" : "Movie"}</div>
        <div class="movie-rating">★ ${item.rating}</div>
        <button class="add-btn" onclick="openAddModal(${JSON.stringify(item).replace(/"/g, "&quot;")})">+ Add</button>
      </div>
    `;
    container.appendChild(card);
  });

  if (data.hasMore) {
    setupInfiniteScroll();
  } else {
    removeInfiniteScroll();
  }

  isLoadingMore = false;
}

function setupInfiniteScroll() {
  removeInfiniteScroll();
  const sentinel = document.createElement("div");
  sentinel.id = "scrollSentinel";
  document.getElementById("searchResults").appendChild(sentinel);

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        searchPage++;
        fetchAndRenderResults();
      }
    },
    { threshold: 1.0 },
  );

  observer.observe(sentinel);
  window._searchObserver = observer;
}

function removeInfiniteScroll() {
  if (window._searchObserver) {
    window._searchObserver.disconnect();
    window._searchObserver = null;
  }
  document.getElementById("scrollSentinel")?.remove();
}

// -- AGREGAR PELÍCULA --
let pendingMovie = null;

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

// -- NUEVA LISTA --
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

//-- ELIMINAR PELICULA --
let deleteMode = false;

function toggleDeleteMode() {
  deleteMode = !deleteMode;
  document
    .getElementById("btnDeleteMode")
    .classList.toggle("hidden", deleteMode);
  document.getElementById("btnDone").classList.toggle("hidden", !deleteMode);
  document.querySelectorAll(".movie-card").forEach((card) => {
    card.classList.toggle("delete-mode", deleteMode);
  });
}
async function removeMovie(movieId) {
  await fetch(`${API}/movies/${activeListId}/${movieId}`, {
    method: "DELETE",
  });
  await loadMovies(activeListId);
}

//-- FILTROS DE BE BUSQUEDA--
let activeFilters = { yearMin: null, yearMax: null };

function toggleFilterMenu() {
  document.getElementById("filterMenu").classList.toggle("hidden");
}

function updateYearFilter() {
  const min = parseInt(document.getElementById("yearMin").value);
  const max = parseInt(document.getElementById("yearMax").value);

  if (min > max) {
    document.getElementById("yearMin").value = max;
    document.getElementById("yearMax").value = min;
  }

  document.getElementById("yearMinDisplay").textContent =
    document.getElementById("yearMin").value;
  document.getElementById("yearMaxDisplay").textContent =
    document.getElementById("yearMax").value;
}

function applyFilters() {
  activeFilters.yearMin = document.getElementById("yearMin").value;
  activeFilters.yearMax = document.getElementById("yearMax").value;
  document.getElementById("filterMenu").classList.add("hidden");

  const btn = document.getElementById("filterBtn");
  btn.classList.add("filter-active");

  if (currentQuery) searchMovies();
}

function clearFilters() {
  activeFilters = { yearMin: null, yearMax: null };
  document.getElementById("yearMin").value = 1900;
  document.getElementById("yearMax").value = 2026;
  document.getElementById("yearMinDisplay").textContent = "1900";
  document.getElementById("yearMaxDisplay").textContent = "2026";
  document.getElementById("filterBtn").classList.remove("filter-active");
  document.getElementById("filterMenu").classList.add("hidden");
  if (currentQuery) searchMovies();
}
