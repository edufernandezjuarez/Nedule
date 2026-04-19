// js/user-menu.js

const USERS = {
    Edu: { initial: 'E', path: 'edu' },
    Nicole: { initial: 'N', path: 'nicole' }
};

function getActiveUser() {
    return localStorage.getItem('activeUser') || 'Edu';
}

function setActiveUser(name) {
    localStorage.setItem('activeUser', name);
}

function updateNavbar(name) {
    const user = USERS[name];
    document.getElementById('usernameLabel').textContent = name;
    document.getElementById('avatarInitial').textContent = user.initial;
}

function updateNavLinks(name) {
    const user = USERS[name];
    const imdbBtn = document.querySelector('.nav-btn[data-page="imdb"]');
    if (imdbBtn) {
        imdbBtn.onclick = () => window.location.href = `/${user.path}/imdb.html`;
    }
}

function toggleMenu() {
    document.getElementById('userMenu').classList.toggle('open');
}

function selectUser(name) {
    setActiveUser(name);
    document.getElementById('userMenu').classList.remove('open');
    window.location.href = '/inicio.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const active = getActiveUser();
    updateNavbar(active);
    updateNavLinks(active);
});

document.addEventListener('click', e => {
    const badge = document.getElementById('userBadge');
    const menu = document.getElementById('userMenu');
    if (!badge.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
    }
});