const API = "http://nedule.duckdns.org:3000/api";

async function loadPerson() {
  const params = new URLSearchParams(window.location.search);
  const personId = params.get("id");
  const name = params.get("name");

  let id = personId;

  if (!id && name) {
    const res = await fetch(
      `${API}/tmdb/person/search/${encodeURIComponent(name)}`,
    );
    const data = await res.json();
    if (data.id) id = data.id;
    else {
      document.getElementById("personName").textContent = "Person not found";
      return;
    }
  }

  if (!id) return;

  const res = await fetch(`${API}/tmdb/person/${id}`);
  const person = await res.json();

  document.title = `${person.name} — Nedule`;
  document.getElementById("personName").textContent = person.name;
  document.getElementById("personKnownFor").textContent =
    person.known_for ?? "";

  const photo = document.getElementById("personPhoto");
  if (person.photo_url) {
    photo.src = person.photo_url;
    photo.alt = person.name;
  } else {
    photo.parentElement.innerHTML = `<div class="person-no-photo">${person.name[0]}</div>`;
  }

  renderCredits(person.credits);
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

document.addEventListener("DOMContentLoaded", loadPerson);
