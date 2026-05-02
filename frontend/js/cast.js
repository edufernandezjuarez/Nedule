const API = "https://nedule.uk/api";

async function searchPeople() {
  const q = document.getElementById("castSearchInput").value.trim();
  if (!q) return;

  const grid = document.getElementById("castGrid");
  grid.classList.remove("hidden");
  grid.innerHTML = '<p class="empty-msg">Loading...</p>';

  const res = await fetch(`${API}/tmdb/people/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  grid.innerHTML = "";

  if (!data.length) {
    grid.innerHTML = '<p class="empty-msg">No results found</p>';
    return;
  }

  data.forEach((person) => {
    const card = document.createElement("div");
    card.className = "person-card clickable";
    card.innerHTML = `
      <div class="person-card-photo">
        ${person.photo_url ? `<img src="${person.photo_url}" alt="${person.name}" />` : `<div class="person-card-initials">${person.name[0]}</div>`}
      </div>
      <div class="person-card-info">
        <div class="person-card-name">${person.name}</div>
        <div class="person-card-dept">${person.known_for}</div>
      </div>
    `;
    card.onclick = () => {
      window.location.href = `/person.html?id=${person.id}`;
    };
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("castSearchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchPeople();
  });
});
