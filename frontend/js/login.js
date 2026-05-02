const API = "https://nedule.uk/api";

async function submitLogin() {
  const username = document.getElementById("usernameInput").value.trim().toLowerCase();
  const password = document.getElementById("passwordInput").value;
  const errorEl = document.getElementById("loginError");
  errorEl.classList.add("hidden");

  if (!username || !password) return;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.classList.remove("hidden");
    document.getElementById("passwordInput").value = "";
    return;
  }

  localStorage.setItem(`token_${data.username}`, data.token);
  localStorage.setItem("token", data.token);
  localStorage.setItem("activeUser", data.username);
  window.location.href = "/index.html";
}
