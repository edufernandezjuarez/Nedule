const API = "https://nedule.uk/api";

let currentPage = 1;
let isLoading = false;
let personId = null;
let allCredits = [];
let activeTab = "movie";

async function loadPerson() {
  const params = new URLSearchParams(window.location.search);
  personId = params.get("id");
  const name = params.get("name");

  if (!personId && name) {
    const res = await fetch(`${API}/tmdb/person/search/${encodeURIComponent(name)}`);
    const data = await res.json();
    if (data.id) personId = data.id;
    else {
      document.getElementById("personName").textContent = "Person not found";
      return;
    }
  }

  if (!personId) return;
  await fetchCredits(true);
}

async function fetchCredits(reset = false) {
  if (isLoading) return;
  isLoading = true;

  const res = await fetch(`${API}/tmdb/person/${personId}?page=${currentPage}`);
  const person = await res.json();

  if (reset) {
    document.title = `${person.name} — Nedule`;
    document.getElementById("personName").textContent = person.name;
    document.getElementById("personKnownFor").textContent = person.known_for ?? "";

    const photo = document.getElementById("personPhoto");
    if (person.photo_url) {
      photo.src = person.photo_url;
      photo.alt = person.name;
    } else {
      photo.parentElement.innerHTML = `<div class="person-no-photo">${person.name[0]}</div>`;
    }
  }

  if (reset) allCredits = [];
  allCredits = allCredits.concat(person.credits);
  renderCredits(allCredits.filter((c) => c.type === activeTab));

  if (person.hasMore) {
    setupInfiniteScroll();
  } else {
    removeInfiniteScroll();
  }

  isLoading = false;
}

function renderCredits(credits) {
  const grid = document.getElementById("creditsGrid");
  grid.innerHTML = "";

  credits.forEach((item) => {
    const card = document.createElement("div");
    card.className = "movie-card clickable";
    card.innerHTML = `
      <div class="movie-poster">
        <img src="${item.poster_url}" alt="${item.title}" />
      </div>
      <div class="movie-info">
        <div class="movie-title">${item.title}</div>
        <div class="movie-year">${item.year}</div>
        <div class="movie-rating">★ ${item.rating}</div>
        ${item.role ? `<div class="credit-role">${item.role}</div>` : ""}
      </div>
    `;
    card.onclick = () => {
      window.location.href = `/movie.html?id=${item.tmdb_id}&type=${item.type}`;
    };
    grid.appendChild(card);
  });
}

function setupInfiniteScroll() {
  removeInfiniteScroll();
  const sentinel = document.createElement("div");
  sentinel.id = "scrollSentinel";
  document.getElementById("creditsGrid").appendChild(sentinel);

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading) {
        currentPage++;
        fetchCredits();
      }
    },
    { threshold: 1.0 },
  );

  observer.observe(sentinel);
  window._personObserver = observer;
}

function removeInfiniteScroll() {
  if (window._personObserver) {
    window._personObserver.disconnect();
    window._personObserver = null;
  }
  document.getElementById("scrollSentinel")?.remove();
}
function setTab(tab) {
  activeTab = tab;
  document.getElementById("tabMovies").classList.toggle("active", tab === "movie");
  document.getElementById("tabSeries").classList.toggle("active", tab === "tv");

  // Si no cargamos todo todavía, traer todo primero
  if (window._personObserver) {
    // Hay más páginas, cargar todo antes de filtrar
    loadAllAndFilter();
  } else {
    renderCredits(allCredits.filter((c) => c.type === activeTab));
  }
}

async function loadAllAndFilter() {
  removeInfiniteScroll();
  while (true) {
    currentPage++;
    const res = await fetch(`${API}/tmdb/person/${personId}?page=${currentPage}`);
    const person = await res.json();
    allCredits = allCredits.concat(person.credits);
    if (!person.hasMore) break;
  }
  renderCredits(allCredits.filter((c) => c.type === activeTab));
}
document.addEventListener("DOMContentLoaded", loadPerson);
