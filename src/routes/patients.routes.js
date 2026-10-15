const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { patientSchema, idParam } = require("../validators/schemas");
const HttpError = require("../utils/httpError");

const router = express.Router();
router.use(authenticate);

router.post("/", validate(patientSchema), async (req, res, next) => {
  try {
    const { name, date_of_birth = null, gender = null, contact_number = null, address = null } = req.body;
    const result = await pool.query(
      `INSERT INTO patients (user_id, name, date_of_birth, gender, contact_number, address)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, user_id, name, date_of_birth, gender, contact_number, address, created_at, updated_at`,
      [req.user.id, name, date_of_birth, gender, contact_number, address]
    );
    res.status(201).json({ patient: result.rows[0] });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, date_of_birth, gender, contact_number, address, created_at, updated_at
       FROM patients WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ patients: result.rows });
  } catch (err) { next(err); }
});

router.get("/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, date_of_birth, gender, contact_number, address, created_at, updated_at
       FROM patients WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) throw new HttpError(404, "Patient not found.");
    res.json({ patient: result.rows[0] });
  } catch (err) { next(err); }
});

router.put("/:id", validate(idParam, "params"), validate(patientSchema), async (req, res, next) => {
  try {
    const { name, date_of_birth = null, gender = null, contact_number = null, address = null } = req.body;
    const result = await pool.query(
      `UPDATE patients SET name=$1, date_of_birth=$2, gender=$3, contact_number=$4, address=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7
       RETURNING id, user_id, name, date_of_birth, gender, contact_number, address, created_at, updated_at`,
      [name, date_of_birth, gender, contact_number, address, req.params.id, req.user.id]
    );
    if (!result.rowCount) throw new HttpError(404, "Patient not found.");
    res.json({ patient: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete("/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM patients WHERE id=$1 AND user_id=$2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) throw new HttpError(404, "Patient not found.");
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
