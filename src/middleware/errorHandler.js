const HttpError = require("../utils/httpError");

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err instanceof HttpError ? err.status : (err.status || 500);
  if (status >= 500) console.error(err);
  const body = { error: status >= 500 ? "Internal server error." : err.message };
  if (err.details) body.details = err.details;
  res.status(status).json(body);
}
module.exports = { notFound, errorHandler };
