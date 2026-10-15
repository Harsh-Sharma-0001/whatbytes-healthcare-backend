const { z } = require("zod");

const email = z.string().trim().email().max(254).transform(v => v.toLowerCase());
const idParam = z.object({ id: z.coerce.number().int().positive() });
const patientIdParam = z.object({ patient_id: z.coerce.number().int().positive() });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8).max(72)
}).strict();

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72)
}).strict();

const patientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  date_of_birth: z.string().date().optional().nullable(),
  gender: z.enum(["female", "male", "other", "prefer_not_to_say"]).optional().nullable(),
  contact_number: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable()
}).strict();

const doctorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  specialization: z.string().trim().min(2).max(120),
  email: email.optional().nullable(),
  contact_number: z.string().trim().max(30).optional().nullable(),
  clinic_address: z.string().trim().max(500).optional().nullable()
}).strict();

const mappingSchema = z.object({
  patient: z.coerce.number().int().positive(),
  doctor: z.coerce.number().int().positive()
}).strict();

module.exports = {
  registerSchema, loginSchema, patientSchema, doctorSchema, mappingSchema,
  idParam, patientIdParam
};
