const API = "http://146.181.49.255:3000/api";

let currentSwipe = null;
let activeFilters = { yearMin: null, yearMax: null, genreIds: [], type: "all" };
let pendingMovie = null;

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

const seenIds = new Set();

async function loadSwipe() {
  const card = document.getElementById("swipeCard");
  if (card) card.classList.add("swipe-loading");

  const params = new URLSearchParams({
    ...(activeFilters.yearMin &&
      activeFilters.yearMin !== "1900" && { yearMin: activeFilters.yearMin }),
    ...(activeFilters.yearMax &&
      activeFilters.yearMax !== "2026" && { yearMax: activeFilters.yearMax }),
    ...(activeFilters.genreIds.length > 0 && {
      genreIds: activeFilters.genreIds.join(","),
    }),
    ...(activeFilters.type !== "all" && { type: activeFilters.type }),
    exclude: [...seenIds].join(","),
    userId: getUserId(), // ← agregá esto
  });

  const res = await fetch(`${API}/tmdb/swipe?${params}`);
  const data = await res.json();

  if (card) card.classList.remove("swipe-loading");

  if (!data) {
    document.getElementById("swipeTitle").textContent = "No more results";
    return;
  }

  seenIds.add(data.tmdb_id);

  currentSwipe = data;

  if (document.getElementById("swipePoster"))
    document.getElementById("swipePoster").src = data.poster_url ?? "";
  if (document.getElementById("swipeTitle"))
    document.getElementById("swipeTitle").textContent = data.title;
  if (document.getElementById("swipeMeta"))
    document.getElementById("swipeMeta").textContent =
      `${data.year} · ${data.type === "tv" ? "Series" : "Movie"} · ★ ${data.rating}`;
  if (document.getElementById("swipeOverview"))
    document.getElementById("swipeOverview").textContent = data.overview ?? "";
  if (document.getElementById("swipeCard"))
    document.getElementById("swipeCard").onclick = () => {
      window.open(`/movie.html?id=${data.tmdb_id}&type=${data.type}`, "_blank");
    };

  if (isMobile()) {
    updateMobileCard(data);
  }
}

// ── FILTROS ──
function setType(type) {
  activeFilters.type = type;
  document
    .querySelectorAll(".type-btn")
    .forEach((b) => b.classList.remove("active"));

  // Desktop
  const desktopBtn = document.getElementById(
    type === "all" ? "typeAll" : type === "movie" ? "typeMovie" : "typeTv",
  );
  if (desktopBtn) desktopBtn.classList.add("active");

  // Mobile
  const mobileBtn = document.getElementById(
    type === "all"
      ? "mobileTypeAll"
      : type === "movie"
        ? "mobileTypeMovie"
        : "mobileTypeTv",
  );
  if (mobileBtn) mobileBtn.classList.add("active");
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
  if (isMobile()) {
    setupTouchSwipe();
  }
});

// ── MOBILE SWIPE ──
function isMobile() {
  return window.matchMedia("(max-width: 600px) and (pointer: coarse)").matches;
}

function updateMobileCard(data) {
  if (!data) return;
  document.getElementById("swipeMobilePoster").src = data.poster_url ?? "";
  document.getElementById("swipeMobileTitle").textContent = data.title;
  document.getElementById("swipeMobileMeta").textContent =
    `${data.year} · ${data.type === "tv" ? "Series" : "Movie"} · ★ ${data.rating}`;
}

function toggleMobileFilters() {
  document.getElementById("swipeMobileFiltersModal").classList.toggle("hidden");
  if (!document.getElementById("mobileGenreChips").children.length) {
    loadMobileGenres();
  }
}

async function loadMobileGenres() {
  const res = await fetch(`${API}/tmdb/genres`);
  const genres = await res.json();
  const chips = document.getElementById("mobileGenreChips");
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
}

function updateMobileYearFilter() {
  const min = parseInt(document.getElementById("mobileYearMin").value);
  const max = parseInt(document.getElementById("mobileYearMax").value);
  document.getElementById("mobileYearMinDisplay").textContent = min;
  document.getElementById("mobileYearMaxDisplay").textContent = max;
  activeFilters.yearMin = String(min);
  activeFilters.yearMax = String(max);
}

function applyMobileFilters() {
  toggleMobileFilters();
  loadSwipe();
}

function clearMobileFilters() {
  activeFilters = { yearMin: null, yearMax: null, genreIds: [], type: "all" };
  document.getElementById("mobileYearMin").value = 1900;
  document.getElementById("mobileYearMax").value = 2026;
  document.getElementById("mobileYearMinDisplay").textContent = "1900";
  document.getElementById("mobileYearMaxDisplay").textContent = "2026";
  document
    .querySelectorAll("#mobileGenreChips .genre-chip")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll("#swipeMobileFiltersModal .type-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("mobileTypeAll").classList.add("active");
  toggleMobileFilters();
  loadSwipe();
}

// ── TOUCH SWIPE ──
function setupTouchSwipe() {
  const card = document.getElementById("swipeMobileCard");
  if (!card) return;

  let startX = 0;
  let isDragging = false;

  card.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    },
    { passive: true },
  );

  card.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;
      const diffX = e.touches[0].clientX - startX;
      if (diffX < -30) card.classList.add("swiping-left");
      else if (diffX > 30) card.classList.add("swiping-right");
      else {
        card.classList.remove("swiping-left", "swiping-right");
      }
    },
    { passive: true },
  );

  card.addEventListener("touchend", async (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = e.changedTouches[0].clientX - startX;
    card.classList.remove("swiping-left", "swiping-right");

    if (diffX < -60) {
      await swipeRight(); // izquierda = agregar
    } else if (diffX > 60) {
      await loadSwipe(); // derecha = next
    }
  });
}

async function swipeRight() {
  if (!currentSwipe) return;
  const userId = getUserId();

  // Buscar o crear la lista "Swipe"
  const listsRes = await fetch(`${API}/lists/${userId}`);
  const listsData = await listsRes.json();
  const allLists = [...listsData.personal, ...listsData.shared];
  let swipeList = allLists.find((l) => l.name === "Swipe");

  if (!swipeList) {
    const createRes = await fetch(`${API}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Swipe",
        owner_id: userId,
        is_shared: false,
      }),
    });
    swipeList = await createRes.json();
  }

  await fetch(`${API}/movies/${swipeList.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...currentSwipe, added_by: userId }),
  });

  // Feedback visual
  const card = document.getElementById("swipeMobileCard");
  card.classList.add("swiping-right");
  setTimeout(async () => {
    card.classList.remove("swiping-right");
    await loadSwipe();
  }, 300);
}
