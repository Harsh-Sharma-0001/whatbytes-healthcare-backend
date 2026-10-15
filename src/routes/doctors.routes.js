const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { doctorSchema, idParam } = require("../validators/schemas");
const HttpError = require("../utils/httpError");

const router = express.Router();
router.use(authenticate);

// All authenticated users can view the directory. Only the creator can modify/delete their doctor records.
router.post("/", validate(doctorSchema), async (req, res, next) => {
  try {
    const { name, specialization, email = null, contact_number = null, clinic_address = null } = req.body;
    const result = await pool.query(
      `INSERT INTO doctors (created_by, name, specialization, email, contact_number, clinic_address)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, created_by, name, specialization, email, contact_number, clinic_address, created_at, updated_at`,
      [req.user.id, name, specialization, email, contact_number, clinic_address]
    );
    res.status(201).json({ doctor: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return next(new HttpError(409, "A doctor with this email already exists."));
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, created_by, name, specialization, email, contact_number, clinic_address, created_at, updated_at
       FROM doctors ORDER BY name ASC`
    );
    res.json({ doctors: result.rows });
  } catch (err) { next(err); }
});

router.get("/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, created_by, name, specialization, email, contact_number, clinic_address, created_at, updated_at
       FROM doctors WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rowCount) throw new HttpError(404, "Doctor not found.");
    res.json({ doctor: result.rows[0] });
  } catch (err) { next(err); }
});

router.put("/:id", validate(idParam, "params"), validate(doctorSchema), async (req, res, next) => {
  try {
    const { name, specialization, email = null, contact_number = null, clinic_address = null } = req.body;
    const result = await pool.query(
      `UPDATE doctors SET name=$1, specialization=$2, email=$3, contact_number=$4, clinic_address=$5, updated_at=NOW()
       WHERE id=$6 AND created_by=$7
       RETURNING id, created_by, name, specialization, email, contact_number, clinic_address, created_at, updated_at`,
      [name, specialization, email, contact_number, clinic_address, req.params.id, req.user.id]
    );
    if (!result.rowCount) {
      const exists = await pool.query("SELECT id FROM doctors WHERE id=$1", [req.params.id]);
      if (!exists.rowCount) throw new HttpError(404, "Doctor not found.");
      throw new HttpError(403, "You can only update doctor records you created.");
    }
    res.json({ doctor: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return next(new HttpError(409, "A doctor with this email already exists."));
    next(err);
  }
});

router.delete("/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM doctors WHERE id=$1 AND created_by=$2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) {
      const exists = await pool.query("SELECT id FROM doctors WHERE id=$1", [req.params.id]);
      if (!exists.rowCount) throw new HttpError(404, "Doctor not found.");
      throw new HttpError(403, "You can only delete doctor records you created.");
    }
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
