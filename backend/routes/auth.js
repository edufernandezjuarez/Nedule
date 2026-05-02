const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const USERS = {
  Edu: process.env.PASSWORD_EDU,
  Nicole: process.env.PASSWORD_NICOLE,
};

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username: rawUsername, password } = req.body;
  const username = rawUsername?.trim().charAt(0).toUpperCase() + rawUsername?.trim().slice(1).toLowerCase();
  if (!USERS[username]) {
    return res.status(401).json({ error: "Usuario no encontrado" });
  }

  if (password !== USERS[username]) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET);

  res.json({ token, username });
});

// GET /api/auth/verify
router.get("/verify", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ valid: false });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
