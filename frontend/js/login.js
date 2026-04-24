const API = "http://nedule.duckdns.org:3000/api";
let selectedUser = null;

function selectUser(name) {
  selectedUser = name;
  document
    .querySelectorAll(".login-user-btn")
    .forEach((b) => b.classList.remove("selected"));
  event.currentTarget.classList.add("selected");
  document.getElementById("loginFor").textContent =
    `Enter password for ${name}`;
  document.getElementById("passwordSection").classList.remove("hidden");
  document.getElementById("passwordInput").focus();
  document.getElementById("passwordInput").value = "";
}

async function submitLogin() {
  if (!selectedUser) return;
  const password = document.getElementById("passwordInput").value;
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: selectedUser, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    document.getElementById("passwordInput").value = "";
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("activeUser", data.username);
  const path =
    data.username === "Edu" ? "/edu/lists.html" : "/nicole/lists.html";
  window.location.href = path;
}
