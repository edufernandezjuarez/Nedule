const API = "https://nedule.uk/api";

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

async function loadWatching() {
  const userId = getUserId();
  const res = await fetch(`${API}/progress/user/${userId}`);
  const items = await res.json();
  const container = document.getElementById("watchingList");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = '<p class="empty-msg">No series in progress</p>';
    return;
  }

  items.forEach((item) => renderWatchingRow(item, container));
}

function renderWatchingRow(item, container) {
  const tmdbId = item.imdb_id.replace("tmdb_", "");
  const row = document.createElement("div");
  row.className = "review-row";
  row.id = `watching-row-${item.movie_id}`;
  row.innerHTML = `
    <img class="review-row-poster" src="${item.poster_url ?? ""}" alt="${item.title}"
      style="cursor:pointer" onclick="window.location.href='/movie.html?id=${tmdbId}&type=tv'" />
    <div class="review-row-info" style="flex:1">
      <div class="review-row-title" style="cursor:pointer"
        onclick="window.location.href='/movie.html?id=${tmdbId}&type=tv'">${item.title}</div>
      <div class="review-row-year">Series · ${item.year}</div>
      <div class="watching-tracker">
        <div class="tracker-group">
          <span class="tracker-label">SEASON</span>
          <div class="tracker-controls">
            <button class="tracker-btn" onclick="updateProgress(${item.movie_id}, ${tmdbId}, -1, 0)">−</button>
            <span class="tracker-val" id="season-${item.movie_id}">${item.season}</span>
            <button class="tracker-btn" onclick="updateProgress(${item.movie_id}, ${tmdbId}, 1, 0)">+</button>
          </div>
        </div>
        <div class="tracker-group">
          <span class="tracker-label">EPISODE</span>
          <div class="tracker-controls">
            <button class="tracker-btn" onclick="updateProgress(${item.movie_id}, ${tmdbId}, 0, -1)">−</button>
            <span class="tracker-val" id="episode-${item.movie_id}">${item.episode}</span>
            <button class="tracker-btn" onclick="updateProgress(${item.movie_id}, ${tmdbId}, 0, 1)">+</button>
          </div>
        </div>
        <button class="tracker-done-btn" onclick="markDone(${item.movie_id})">✓ Done</button>
      </div>
    </div>
  `;
  container.appendChild(row);
}

async function updateProgress(movieId, tmdbId, seasonDelta, episodeDelta) {
  const userId = getUserId();
  const seasonEl = document.getElementById(`season-${movieId}`);
  const episodeEl = document.getElementById(`episode-${movieId}`);

  let season = parseInt(seasonEl.textContent) + seasonDelta;
  let episode = parseInt(episodeEl.textContent) + episodeDelta;

  if (season < 1) season = 1;
  if (episode < 1) episode = 1;

  seasonEl.textContent = season;
  episodeEl.textContent = episode;

  await fetch(`${API}/progress/${tmdbId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, season, episode }),
  });
}

async function markDone(movieId) {
  const userId = getUserId();
  await fetch(`${API}/progress/${movieId}/user/${userId}`, { method: "DELETE" });
  document.getElementById(`watching-row-${movieId}`).remove();
  const container = document.getElementById("watchingList");
  if (!container.children.length) {
    container.innerHTML = '<p class="empty-msg">No series in progress</p>';
  }
}

document.addEventListener("DOMContentLoaded", loadWatching);
