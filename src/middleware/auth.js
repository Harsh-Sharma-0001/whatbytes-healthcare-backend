const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const HttpError = require("../utils/httpError");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Authentication required. Use Authorization: Bearer <access_token>."));
  }
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    if (!payload.sub || !payload.email) throw new Error("Invalid token payload");
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired access token."));
  }
}

module.exports = { authenticate };
