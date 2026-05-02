const API = "https://nedule.uk/api";

function getUserId() {
  const name = getActiveUser();
  return name === "Edu" ? 1 : 2;
}

async function loadReviews() {
  const userId = getUserId();
  const name = getActiveUser();

  const res = await fetch(`${API}/reviews/user/${userId}`);
  const reviews = await res.json();

  const container = document.getElementById("reviewsList");
  container.innerHTML = "";

  if (!reviews.length) {
    container.innerHTML = '<p class="empty-msg">No reviews yet</p>';
    return;
  }

  reviews.forEach((r) => {
    const tmdbId = r.imdb_id.replace("tmdb_", "");
    const item = document.createElement("div");
    item.className = "review-row clickable";
    item.innerHTML = `
      <img class="review-row-poster" src="${r.poster_url ?? ""}" alt="${r.title}" />
      <div class="review-row-info">
        <div class="review-row-title">${r.title}</div>
        <div class="review-row-year">${r.year} · ${r.media_type === "tv" ? "Series" : "Movie"}</div>
        <div class="review-row-stars">${"★".repeat(r.rating)}${"☆".repeat(10 - r.rating)}</div>
        <div class="review-row-score">${r.rating}/10</div>
        ${r.comment ? `<p class="review-row-comment">${r.comment}</p>` : ""}
      </div>
    `;
    item.onclick = () => {
      window.location.href = `/movie.html?id=${tmdbId}&type=${r.media_type ?? "movie"}`;
    };
    container.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", loadReviews);
