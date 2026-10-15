const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { corsOrigin } = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patients.routes");
const doctorRoutes = require("./routes/doctors.routes");
const mappingRoutes = require("./routes/mappings.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/mappings", mappingRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
