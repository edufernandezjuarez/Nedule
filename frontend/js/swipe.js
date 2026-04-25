const API = "http://146.181.49.255:3000/api";

let currentSwipe = null;
let activeFilters = { yearMin: null, yearMax: null, genreIds: [], type: "all" };
let pendingMovie = null;

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

async function loadSwipe() {
  const card = document.getElementById("swipeCard");
  card.classList.add("swipe-loading");

  const params = new URLSearchParams({
    ...(activeFilters.yearMin &&
      activeFilters.yearMin !== "1900" && { yearMin: activeFilters.yearMin }),
    ...(activeFilters.yearMax &&
      activeFilters.yearMax !== "2026" && { yearMax: activeFilters.yearMax }),
    ...(activeFilters.genreIds.length > 0 && {
      genreIds: activeFilters.genreIds.join(","),
    }),
    ...(activeFilters.type !== "all" && { type: activeFilters.type }),
  });

  const res = await fetch(`${API}/tmdb/swipe?${params}`);
  const data = await res.json();

  card.classList.remove("swipe-loading");

  if (!data) {
    document.getElementById("swipeTitle").textContent = "No results found";
    return;
  }

  currentSwipe = data;

  document.getElementById("swipePoster").src = data.poster_url ?? "";
  document.getElementById("swipePoster").alt = data.title;
  document.getElementById("swipeTitle").textContent = data.title;
  document.getElementById("swipeMeta").textContent =
    `${data.year} · ${data.type === "tv" ? "Series" : "Movie"} · ★ ${data.rating}`;
  document.getElementById("swipeOverview").textContent = data.overview ?? "";

  document.getElementById("swipeCard").onclick = () => {
    window.open(`/movie.html?id=${data.tmdb_id}&type=${data.type}`, "_blank");
  };
}

// ── FILTROS ──
function setType(type) {
  activeFilters.type = type;
  document
    .querySelectorAll(".type-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .getElementById(
      type === "all" ? "typeAll" : type === "movie" ? "typeMovie" : "typeTv",
    )
    .classList.add("active");
}

function updateYearFilter() {
  const min = parseInt(document.getElementById("yearMin").value);
  const max = parseInt(document.getElementById("yearMax").value);
  if (min > max) {
    document.getElementById("yearMin").value = max;
    document.getElementById("yearMax").value = min;
  }
  activeFilters.yearMin = document.getElementById("yearMin").value;
  activeFilters.yearMax = document.getElementById("yearMax").value;
  document.getElementById("yearMinDisplay").textContent = activeFilters.yearMin;
  document.getElementById("yearMaxDisplay").textContent = activeFilters.yearMax;
}

async function loadGenres() {
  const res = await fetch(`${API}/tmdb/genres`);
  const genres = await res.json();
  const chips = document.getElementById("genreChips");

  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "genre-chip";
    btn.textContent = g.name;
    btn.dataset.id = g.id;
    btn.onclick = () => {
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) {
        activeFilters.genreIds.push(g.id);
      } else {
        activeFilters.genreIds = activeFilters.genreIds.filter(
          (x) => x !== g.id,
        );
      }
    };
    chips.appendChild(btn);
  });
  select.onchange = undefined;
}

// ── MODAL ──
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

  if (!allLists.length) {
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

document.addEventListener("DOMContentLoaded", () => {
  loadGenres();
  loadSwipe();
});
