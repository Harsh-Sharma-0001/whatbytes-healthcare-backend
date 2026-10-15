const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { mappingSchema, idParam, patientIdParam } = require("../validators/schemas");
const HttpError = require("../utils/httpError");

const router = express.Router();
router.use(authenticate);

router.post("/", validate(mappingSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const patient = await client.query(
      "SELECT id FROM patients WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [req.body.patient, req.user.id]
    );
    if (!patient.rowCount) throw new HttpError(404, "Patient not found.");
    const doctor = await client.query("SELECT id FROM doctors WHERE id=$1", [req.body.doctor]);
    if (!doctor.rowCount) throw new HttpError(404, "Doctor not found.");
    const result = await client.query(
      `INSERT INTO patient_doctors (patient_id, doctor_id, assigned_by)
       VALUES ($1,$2,$3)
       RETURNING id, patient_id, doctor_id, assigned_by, created_at`,
      [req.body.patient, req.body.doctor, req.user.id]
    );
    await client.query("COMMIT");
    res.status(201).json({ mapping: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return next(new HttpError(409, "This doctor is already assigned to this patient."));
    next(err);
  } finally {
    client.release();
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.patient_id, p.name AS patient_name, m.doctor_id, d.name AS doctor_name,
              d.specialization, m.assigned_by, m.created_at
       FROM patient_doctors m
       JOIN patients p ON p.id=m.patient_id
       JOIN doctors d ON d.id=m.doctor_id
       WHERE p.user_id=$1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    res.json({ mappings: result.rows });
  } catch (err) { next(err); }
});

router.get("/:patient_id", validate(patientIdParam, "params"), async (req, res, next) => {
  try {
    const patient = await pool.query(
      "SELECT id FROM patients WHERE id=$1 AND user_id=$2",
      [req.params.patient_id, req.user.id]
    );
    if (!patient.rowCount) throw new HttpError(404, "Patient not found.");
    const result = await pool.query(
      `SELECT m.id, m.patient_id, m.doctor_id, d.name AS doctor_name, d.specialization,
              d.email AS doctor_email, d.contact_number, m.assigned_by, m.created_at
       FROM patient_doctors m JOIN doctors d ON d.id=m.doctor_id
       WHERE m.patient_id=$1 ORDER BY m.created_at DESC`,
      [req.params.patient_id]
    );
    res.json({ patient_id: Number(req.params.patient_id), doctors: result.rows });
  } catch (err) { next(err); }
});

router.delete("/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM patient_doctors m
       USING patients p
       WHERE m.id=$1 AND m.patient_id=p.id AND p.user_id=$2
       RETURNING m.id`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) throw new HttpError(404, "Mapping not found.");
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
