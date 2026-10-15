const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/schemas");
const { bcryptRounds, jwtSecret, jwtAccessExpiresIn } = require("../config/env");
const HttpError = require("../utils/httpError");

const router = express.Router();

function createAccessToken(user) {
  return jwt.sign({ email: user.email }, jwtSecret, {
    subject: String(user.id),
    expiresIn: jwtAccessExpiresIn,
    algorithm: "HS256"
  });
}

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, bcryptRounds);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );
    const user = result.rows[0];
    res.status(201).json({
      message: "User registered successfully.",
      user,
      access: createAccessToken(user),
      token_type: "Bearer",
      expires_in: jwtAccessExpiresIn
    });
  } catch (err) {
    if (err.code === "23505") return next(new HttpError(409, "An account with this email already exists."));
    next(err);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    const valid = user && await bcrypt.compare(password, user.password_hash);
    if (!valid) return next(new HttpError(401, "Invalid email or password."));
    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.json({
      message: "Login successful.",
      user: safeUser,
      access: createAccessToken(safeUser),
      token_type: "Bearer",
      expires_in: jwtAccessExpiresIn
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
