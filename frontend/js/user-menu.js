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
  if (document.getElementById("usernameLabel")) document.getElementById("usernameLabel").textContent = name;
  if (document.getElementById("avatarInitial")) document.getElementById("avatarInitial").textContent = user.initial;
  // Actualizar el dropdown
  document.querySelectorAll(".user-menu .avatar").forEach((el) => (el.textContent = user.initial));
  document.querySelectorAll(".user-menu span").forEach((el) => (el.textContent = name));
}

function updateNavLinks(name) {
  const user = USERS[name];
  const listsBtn = document.querySelector('.nav-btn[data-page="lists"]');
  const imdbBtn = document.querySelector('.nav-btn[data-page="imdb"]');
  const swipeBtn = document.querySelector('.nav-btn[data-page="swipe"]');
  if (listsBtn) listsBtn.onclick = () => (window.location.href = `/${user.path}/lists.html`);
  if (imdbBtn) imdbBtn.onclick = () => (window.location.href = `/${user.path}/imdb.html`);
  if (swipeBtn) swipeBtn.onclick = () => (window.location.href = `/swipe.html`);
}

function toggleMenu() {
  document.getElementById("userMenu").classList.toggle("open");
}

function goToProfile() {
  document.getElementById("userMenu").classList.remove("open");
  window.location.href = "/profile.html";
}

function logout() {
  const user = getActiveUser();
  localStorage.removeItem(`token_${user}`);
  localStorage.removeItem("token");
  localStorage.removeItem("activeUser");
  window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const active = getActiveUser();
  updateNavbar(active);
  updateNavLinks(active);
  updateMobileNav(active);
  setupMobileNav();
});

document.addEventListener("click", (e) => {
  const badge = document.getElementById("userBadge");
  const menu = document.getElementById("userMenu");
  if (badge && menu && !badge.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove("open");
  }
  const mobileUserBtn = document.getElementById("mobileUserBtn");
  const mobileUserMenu = document.getElementById("mobileUserMenu");
  if (mobileUserBtn && mobileUserMenu && !mobileUserBtn.contains(e.target) && !mobileUserMenu.contains(e.target)) {
    mobileUserMenu.classList.add("hidden");
  }
  const infoBtn = document.getElementById("infoBtn");
  const infoMenu = document.getElementById("infoMenu");
  if (infoBtn && infoMenu && !infoBtn.contains(e.target) && !infoMenu.contains(e.target)) {
    infoMenu.classList.add("hidden");
  }
});

function toggleInfoMenu() {
  document.getElementById("infoMenu").classList.toggle("hidden");
}

function goToReviews() {
  window.location.href = "/reviews.html";
}
function goToHidden() {
  window.location.href = "/hidden.html";
}
function goToWatching() {
  window.location.href = "/watching.html";
}

function toggleMobileUserMenu() {
  const menu = document.getElementById("mobileUserMenu");
  if (menu) menu.classList.toggle("hidden");
}

function updateMobileNav(name) {
  const avatar = document.getElementById("mobileAvatar");
  const username = document.getElementById("mobileUsername");
  if (avatar) avatar.textContent = name[0];
  if (username) username.textContent = name;
}

function setupMobileNav() {
  const user = getActiveUser();
  const path = user === "Edu" ? "edu" : "nicole";
  const swipeBtn = document.getElementById("mobileSwipeBtn");
  const imdbBtn = document.getElementById("mobileImdbBtn");
  const listsBtn = document.getElementById("mobileListsBtn");
  if (swipeBtn) swipeBtn.onclick = () => (window.location.href = "/swipe.html");
  if (imdbBtn) imdbBtn.onclick = () => (window.location.href = `/${path}/imdb.html`);
  if (listsBtn) listsBtn.onclick = () => (window.location.href = `/${path}/lists.html`);
}
