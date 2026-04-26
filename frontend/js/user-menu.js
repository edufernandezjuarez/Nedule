const USERS = {
  Edu: { initial: "E", path: "edu" },
  Nicole: { initial: "N", path: "nicole" },
};

function getActiveUser() {
  return localStorage.getItem("activeUser") || "Edu";
}

function setActiveUser(name) {
  localStorage.setItem("activeUser", name);
}

function updateNavbar(name) {
  const user = USERS[name];
  document.getElementById("usernameLabel").textContent = name;
  document.getElementById("avatarInitial").textContent = user.initial;
}

function updateNavLinks(name) {
  const user = USERS[name];
  const listsBtn = document.querySelector('.nav-btn[data-page="lists"]');
  const imdbBtn = document.querySelector('.nav-btn[data-page="imdb"]');
  const swipeBtn = document.querySelector('.nav-btn[data-page="swipe"]');
  if (listsBtn)
    listsBtn.onclick = () =>
      (window.location.href = `/${user.path}/lists.html`);
  if (imdbBtn)
    imdbBtn.onclick = () => (window.location.href = `/${user.path}/imdb.html`);
  if (swipeBtn) swipeBtn.onclick = () => (window.location.href = `/swipe.html`);
}

function toggleMenu() {
  document.getElementById("userMenu").classList.toggle("open");
}

function selectUser(name) {
  setActiveUser(name);
  document.getElementById("userMenu").classList.remove("open");
  window.location.href = "/inicio.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const active = getActiveUser();
  updateNavbar(active);
  updateNavLinks(active);
});

document.addEventListener("click", (e) => {
  const badge = document.getElementById("userBadge");
  const menu = document.getElementById("userMenu");
  if (!badge.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove("open");
  }
});
function toggleInfoMenu() {
  document.getElementById("infoMenu").classList.toggle("hidden");
}

function goToReviews() {
  window.location.href = "/reviews.html";
}

document.addEventListener("click", (e) => {
  const infoBtn = document.getElementById("infoBtn");
  const infoMenu = document.getElementById("infoMenu");
  if (
    infoBtn &&
    infoMenu &&
    !infoBtn.contains(e.target) &&
    !infoMenu.contains(e.target)
  ) {
    infoMenu.classList.add("hidden");
  }
  const badge = document.getElementById("userBadge");
  const menu = document.getElementById("userMenu");
  if (!badge.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove("open");
  }
});
