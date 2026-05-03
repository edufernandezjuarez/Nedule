const API = "https://nedule.uk/api";

let activeListId = null;
let activeListName = null;
let isPopularMode = true;

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}
function isMobile() {
  return window.matchMedia("(max-width: 600px) and (pointer: coarse)").matches;
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
    <div class="folder-count">${list.movie_count} ${parseInt(list.movie_count) === 1 ? "title" : "titles"}</div>
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
  document.querySelectorAll(".folder-menu").forEach((m) => m.classList.add("hidden"));
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

  currentSort = { field: null, asc: false };
  const btnSort = document.getElementById("btnSort");
  if (btnSort) btnSort.textContent = "Sort";

  await loadMovies(listId);
}

function goBack() {
  document.getElementById("moviesView").classList.add("hidden");
  document.getElementById("listsView").classList.remove("hidden");
  const sr = document.getElementById("searchResults");
  if (sr) sr.classList.add("hidden");
  const si = document.getElementById("searchInput");
  if (si) si.value = "";
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
    const tmdbId = movie.imdb_id.replace("tmdb_", "");
    const type = movie.media_type ?? "movie";
    card.dataset.tmdbId = tmdbId;
    card.dataset.type = type;
    card.onclick = (e) => {
      if (e.target.classList.contains("delete-x")) return;
      if (e.target.classList.contains("add-btn")) return;
      window.location.href = `/movie.html?id=${tmdbId}&type=${type}`;
    };
    card.dataset.originalIndex = movies.indexOf(movie);
    card.innerHTML = `
      <button class="delete-x" onclick="removeMovie(${movie.id})">✕</button>
      <div class="movie-poster">
        ${movie.poster_url ? `<img src="${movie.poster_url}" alt="${movie.title}" />` : '<div class="no-poster">No poster</div>'}
      </div>
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-year">${movie.year}</div>
        <div class="movie-rating">★ ${movie.imdb_rating}</div>
        <button class="add-btn" onclick="openAddModal(${JSON.stringify({
          tmdb_id: tmdbId,
          title: movie.title,
          year: movie.year,
          poster_url: movie.poster_url,
          rating: movie.imdb_rating,
          type: type,
        }).replace(/"/g, "&quot;")})">+ Add</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// -- BUSCAR EN TMDB --
let moviePage = 1;
let tvPage = 1;
let movieHasMore = null;
let tvHasMore = null;
let renderedIds = new Set();
let currentQuery = "";
let isLoadingMore = false;

async function searchMovies() {
  const q = document.getElementById("searchInput").value.trim();

  currentQuery = q;
  moviePage = 1;
  tvPage = 1;
  movieHasMore = null;
  tvHasMore = null;
  renderedIds = new Set();
  isPopularMode = !q;
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

  const filterParams = {
    moviePage,
    tvPage,
    ...(movieHasMore === false && { skipMovie: true }),
    ...(tvHasMore === false && { skipTv: true }),
    ...(activeFilters.yearMin && { yearMin: activeFilters.yearMin }),
    ...(activeFilters.yearMax && { yearMax: activeFilters.yearMax }),
    ...(activeFilters.genreIds.length > 0 && { genreIds: activeFilters.genreIds.join(",") }),
    ...(activeFilters.continents.length > 0 && { continents: activeFilters.continents.join(",") }),
    ...(activeFilters.countryName && { countryName: activeFilters.countryName }),
    ...(activeFilters.type !== "all" && { type: activeFilters.type }),
  };

  let url;
  if (isPopularMode) {
    url = `${API}/tmdb/popular?${new URLSearchParams(filterParams)}`;
  } else {
    url = `${API}/tmdb/search?${new URLSearchParams({ q: currentQuery, ...filterParams })}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  document.getElementById("searchLoading")?.remove();

  data.results.forEach((item) => {
    const rid = `${item.tmdb_id}_${item.type}`;
    if (renderedIds.has(rid)) return;
    renderedIds.add(rid);
    const card = document.createElement("div");
    card.className = "movie-card search-card clickable";
    card.innerHTML = `
      <div class="movie-poster">
        ${item.poster_url ? `<img src="${item.poster_url}" alt="${item.title}" />` : '<div class="no-poster">No poster</div>'}
      </div>
      <div class="movie-info">
        <div class="movie-title">${item.title}</div>
        <div class="movie-year">${item.year} · ${item.type === "tv" ? "Series" : "Movie"}</div>
        <div class="movie-rating">★ ${item.rating}</div>
        <button class="add-btn" onclick="openAddModal(${JSON.stringify(item).replace(/"/g, "&quot;")})">+ Add</button>
      </div>
    `;
    card.onclick = (e) => {
      if (e.target.classList.contains("add-btn")) return;
      window.location.href = `/movie.html?id=${item.tmdb_id}&type=${item.type}`;
    };
    container.appendChild(card);
  });

  movieHasMore = data.movieHasMore ?? false;
  tvHasMore = data.tvHasMore ?? false;

  if (movieHasMore || tvHasMore) {
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
        if (movieHasMore) moviePage++;
        if (tvHasMore) tvPage++;
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

  const userId = getUserId();

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
    loadGenres();
    document.getElementById("searchResults").classList.remove("hidden");
    fetchAndRenderResults(true);
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
  document.getElementById("btnDeleteMode").classList.toggle("hidden", deleteMode);
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

//-- FILTROS DE BUSQUEDA --
let activeFilters = { yearMin: null, yearMax: null, genreIds: [], type: "all", continents: [], countryName: "" };

function toggleFilterMenu() {
  if (isMobile()) {
    openFilterSheet();
  } else {
    document.getElementById("filterMenu").classList.toggle("hidden");
  }
}

function updateYearFilter() {
  const min = parseInt(document.getElementById("yearMin").value);
  const max = parseInt(document.getElementById("yearMax").value);

  if (min > max) {
    document.getElementById("yearMin").value = max;
    document.getElementById("yearMax").value = min;
  }

  document.getElementById("yearMinDisplay").textContent = document.getElementById("yearMin").value;
  document.getElementById("yearMaxDisplay").textContent = document.getElementById("yearMax").value;
}

function applyFilters() {
  activeFilters.yearMin = document.getElementById("yearMin").value;
  activeFilters.yearMax = document.getElementById("yearMax").value;

  document.getElementById("filterMenu").classList.add("hidden");

  const hasFilters =
    activeFilters.yearMin !== "1900" ||
    activeFilters.yearMax !== "2026" ||
    activeFilters.genreIds.length > 0 ||
    activeFilters.continents.length > 0 ||
    activeFilters.countryName ||
    activeFilters.type !== "all";
  document.getElementById("filterBtn").classList.toggle("filter-active", hasFilters);

  moviePage = 1;
  tvPage = 1;
  movieHasMore = null;
  tvHasMore = null;
  renderedIds = new Set();
  removeInfiniteScroll();
  document.getElementById("searchResults").innerHTML = "";
  fetchAndRenderResults(true);
}

// FIX PRINCIPAL: reasignar la variable global, no crear una nueva con "let"
function clearFilters() {
  activeFilters = { yearMin: null, yearMax: null, genreIds: [], type: "all", continents: [], countryName: "" };

  // Reset desktop sliders
  const yearMinEl = document.getElementById("yearMin");
  const yearMaxEl = document.getElementById("yearMax");
  if (yearMinEl) {
    yearMinEl.value = 1900;
    document.getElementById("yearMinDisplay").textContent = "1900";
  }
  if (yearMaxEl) {
    yearMaxEl.value = 2026;
    document.getElementById("yearMaxDisplay").textContent = "2026";
  }

  // Reset sheet sliders también para que queden sincronizados
  const sheetYearMinEl = document.getElementById("sheetYearMin");
  const sheetYearMaxEl = document.getElementById("sheetYearMax");
  if (sheetYearMinEl) {
    sheetYearMinEl.value = 1900;
    document.getElementById("sheetYearMinDisplay").textContent = "1900";
  }
  if (sheetYearMaxEl) {
    sheetYearMaxEl.value = 2026;
    document.getElementById("sheetYearMaxDisplay").textContent = "2026";
  }

  // Reset todos los chips (desktop + sheet)
  document.querySelectorAll(".genre-chip").forEach((c) => c.classList.remove("active"));
  document.querySelectorAll(".continent-chip").forEach((c) => c.classList.remove("active"));

  // Reset country inputs
  const countryInput = document.getElementById("countryInput");
  const sheetCountryInput = document.getElementById("sheetCountryInput");
  if (countryInput) countryInput.value = "";
  if (sheetCountryInput) sheetCountryInput.value = "";

  // Reset type buttons (desktop + sheet)
  document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
  const typeAll = document.getElementById("typeAll");
  const sheetTypeAll = document.getElementById("sheetTypeAll");
  if (typeAll) typeAll.classList.add("active");
  if (sheetTypeAll) sheetTypeAll.classList.add("active");

  document.getElementById("filterBtn").classList.remove("filter-active");
  document.getElementById("filterMenu").classList.add("hidden");

  moviePage = 1;
  tvPage = 1;
  movieHasMore = null;
  tvHasMore = null;
  renderedIds = new Set();
  removeInfiniteScroll();
  document.getElementById("searchResults").innerHTML = "";
  fetchAndRenderResults(true);
}

async function loadGenres() {
  const res = await fetch(`${API}/tmdb/genres`);
  const genres = await res.json();
  const chips = document.getElementById("genreChips");
  if (!chips) return;

  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "genre-chip";
    btn.textContent = g.name;
    btn.dataset.id = g.id;
    btn.onclick = () => toggleGenre(btn, g.id);
    chips.appendChild(btn);
  });
}

function toggleGenre(btn, id) {
  btn.classList.toggle("active");
  if (btn.classList.contains("active")) {
    activeFilters.genreIds.push(id);
  } else {
    activeFilters.genreIds = activeFilters.genreIds.filter((x) => x !== id);
  }
}

function setType(type) {
  activeFilters.type = type;
  document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
  const ids = {
    all: ["typeAll", "sheetTypeAll"],
    movie: ["typeMovie", "sheetTypeMovie"],
    tv: ["typeTv", "sheetTypeTv"],
  };
  ids[type].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  });
}

//RULETAAAA
function spinRuleta() {
  const cards = document.querySelectorAll("#moviesGrid .movie-card");
  if (!cards.length) return;

  const randomCard = cards[Math.floor(Math.random() * cards.length)];
  const title = randomCard.querySelector(".movie-title").textContent;
  const year = randomCard.querySelector(".movie-year").textContent;
  const poster = randomCard.querySelector("img")?.src ?? null;
  const tmdbId = randomCard.dataset.tmdbId;
  const type = randomCard.dataset.type;

  document.getElementById("ruletaTitle").textContent = title;
  document.getElementById("ruletaYear").textContent = year;
  document.getElementById("ruletaPoster").src = poster ?? "";
  document.getElementById("ruletaPoster").style.display = poster ? "block" : "none";
  document.getElementById("ruletaBtn").onclick = () => {
    window.location.href = `/movie.html?id=${tmdbId}&type=${type}`;
  };

  document.getElementById("ruletaModal").classList.remove("hidden");
}

function closeRuleta() {
  document.getElementById("ruletaModal").classList.add("hidden");
}

function toggleContinent(btn, continent) {
  btn.classList.toggle("active");
  if (btn.classList.contains("active")) {
    activeFilters.continents.push(continent);
  } else {
    activeFilters.continents = activeFilters.continents.filter((c) => c !== continent);
  }
}

function openFilterSheet() {
  if (!document.getElementById("sheetGenreChips").children.length) {
    loadSheetGenres();
  }
  document.getElementById("filterOverlay").classList.remove("hidden");
  document.getElementById("filterSheet").classList.remove("hidden");
}

function closeFilterSheet() {
  document.getElementById("filterOverlay").classList.add("hidden");
  document.getElementById("filterSheet").classList.add("hidden");
}

async function loadSheetGenres() {
  const res = await fetch(`${API}/tmdb/genres`);
  const genres = await res.json();
  const chips = document.getElementById("sheetGenreChips");
  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "genre-chip";
    btn.textContent = g.name;
    btn.dataset.id = g.id;
    btn.onclick = () => {
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) activeFilters.genreIds.push(g.id);
      else activeFilters.genreIds = activeFilters.genreIds.filter((x) => x !== g.id);
    };
    chips.appendChild(btn);
  });
}

function updateSheetYearFilter() {
  const min = parseInt(document.getElementById("sheetYearMin").value);
  const max = parseInt(document.getElementById("sheetYearMax").value);
  document.getElementById("sheetYearMinDisplay").textContent = min;
  document.getElementById("sheetYearMaxDisplay").textContent = max;
  activeFilters.yearMin = String(min);
  activeFilters.yearMax = String(max);
}

function toggleSheetContinent(btn, continent) {
  btn.classList.toggle("active");
  if (btn.classList.contains("active")) activeFilters.continents.push(continent);
  else activeFilters.continents = activeFilters.continents.filter((c) => c !== continent);
}

function applySheetFilters() {
  const hasFilters =
    activeFilters.yearMin !== "1900" ||
    activeFilters.yearMax !== "2026" ||
    activeFilters.genreIds.length > 0 ||
    activeFilters.continents.length > 0 ||
    activeFilters.countryName ||
    activeFilters.type !== "all";
  document.getElementById("filterBtn").classList.toggle("filter-active", hasFilters);
  closeFilterSheet();
  moviePage = 1;
  tvPage = 1;
  movieHasMore = null;
  tvHasMore = null;
  renderedIds = new Set();
  removeInfiniteScroll();
  document.getElementById("searchResults").innerHTML = "";
  fetchAndRenderResults(true);
}

// FIX: igual que clearFilters, reasigna global y sincroniza ambos paneles
function clearSheetFilters() {
  activeFilters = { yearMin: null, yearMax: null, genreIds: [], type: "all", continents: [], countryName: "" };

  // Reset sheet sliders
  document.getElementById("sheetYearMin").value = 1900;
  document.getElementById("sheetYearMax").value = 2026;
  document.getElementById("sheetYearMinDisplay").textContent = "1900";
  document.getElementById("sheetYearMaxDisplay").textContent = "2026";

  // Reset desktop sliders también para que queden sincronizados
  const yearMinEl = document.getElementById("yearMin");
  const yearMaxEl = document.getElementById("yearMax");
  if (yearMinEl) {
    yearMinEl.value = 1900;
    document.getElementById("yearMinDisplay").textContent = "1900";
  }
  if (yearMaxEl) {
    yearMaxEl.value = 2026;
    document.getElementById("yearMaxDisplay").textContent = "2026";
  }

  // Reset todos los chips
  document.querySelectorAll(".genre-chip").forEach((c) => c.classList.remove("active"));
  document.querySelectorAll(".continent-chip").forEach((c) => c.classList.remove("active"));

  // Reset country inputs
  document.getElementById("sheetCountryInput").value = "";
  const countryInput = document.getElementById("countryInput");
  if (countryInput) countryInput.value = "";

  // Reset type buttons
  document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("sheetTypeAll").classList.add("active");
  const typeAll = document.getElementById("typeAll");
  if (typeAll) typeAll.classList.add("active");

  document.getElementById("filterBtn").classList.remove("filter-active");
  closeFilterSheet();
  moviePage = 1;
  tvPage = 1;
  movieHasMore = null;
  tvHasMore = null;
  renderedIds = new Set();
  removeInfiniteScroll();
  document.getElementById("searchResults").innerHTML = "";
  fetchAndRenderResults(true);
}
let currentSort = { field: null, asc: false };

function toggleSortMenu() {
  document.getElementById("sortMenu").classList.toggle("hidden");
}

function sortMovies(field) {
  if (currentSort.field === field) {
    currentSort.asc = !currentSort.asc; // toggle dirección
  } else {
    currentSort.field = field;
    currentSort.asc = false; // default: mayor a menor
  }

  // Actualizar label del botón
  const dir = currentSort.asc ? "↑" : "↓";
  const labels = { popularity: "Popularity", year: "Year", rating: "Rating", alpha: "A-Z" };
  document.getElementById("btnSort").textContent = `${labels[field]} ${dir}`;
  document.getElementById("sortMenu").classList.add("hidden");

  const cards = Array.from(document.querySelectorAll("#moviesGrid .movie-card"));

  cards.sort((a, b) => {
    let valA, valB;
    if (field === "alpha") {
      valA = a.querySelector(".movie-title").textContent.toLowerCase();
      valB = b.querySelector(".movie-title").textContent.toLowerCase();
      return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (field === "year") {
      valA = parseInt(a.querySelector(".movie-year").textContent) || 0;
      valB = parseInt(b.querySelector(".movie-year").textContent) || 0;
    }
    if (field === "rating") {
      valA = parseFloat(a.querySelector(".movie-rating").textContent.replace("★", "")) || 0;
      valB = parseFloat(b.querySelector(".movie-rating").textContent.replace("★", "")) || 0;
    }
    if (field === "popularity") {
      // Las cards ya vienen ordenadas por popularidad del backend, usamos su índice original
      valA = parseInt(a.dataset.originalIndex) || 0;
      valB = parseInt(b.dataset.originalIndex) || 0;
    }
    return currentSort.asc ? valA - valB : valB - valA;
  });

  const grid = document.getElementById("moviesGrid");
  cards.forEach((c) => grid.appendChild(c));
}
