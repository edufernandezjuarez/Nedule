const API = "https://nedule.uk/api";

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

async function loadHidden() {
  const userId = getUserId();
  const res = await fetch(`${API}/hidden/${userId}`);
  const titles = await res.json();
  const container = document.getElementById("hiddenList");
  container.innerHTML = "";

  if (!titles.length) {
    container.innerHTML = '<p class="empty-msg">No hidden titles</p>';
    return;
  }

  titles.forEach((t) => {
    const item = document.createElement("div");
    item.className = "review-row";
    item.innerHTML = `
      <img class="review-row-poster" src="${t.poster_url ?? ""}" alt="${t.title}" />
      <div class="review-row-info" style="flex:1;">
        <div class="review-row-title">${t.title}</div>
        <div class="review-row-year">${t.media_type === "tv" ? "Series" : "Movie"}</div>
      </div>
      <button onclick="unhideTitle(${t.tmdb_id})" style="padding:6px 14px; border-radius:8px; border:0.5px solid var(--border-medium); background:transparent; cursor:pointer; font-size:13px;">Unhide</button>
    `;
    container.appendChild(item);
  });
}

async function unhideTitle(tmdbId) {
  const userId = getUserId();
  await fetch(`${API}/hidden/${userId}/${tmdbId}`, { method: "DELETE" });
  await loadHidden();
}

document.addEventListener("DOMContentLoaded", loadHidden);
