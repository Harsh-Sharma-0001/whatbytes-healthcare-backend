# WhatBytes Healthcare Backend

A RESTful healthcare backend built with **Node.js, Express, and PostgreSQL**. It provides JWT-based authentication, patient and doctor management, and patient–doctor assignments, with request validation and ownership checks.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Errors and status codes](#errors-and-status-codes)
- [Security and authorization](#security-and-authorization)
- [Testing with Postman](#testing-with-postman)
- [Troubleshooting](#troubleshooting)
- [Submission checklist](#submission-checklist)

## Features

- User registration and login with JWT access tokens.
- bcrypt password hashing.
- Patient CRUD with ownership enforcement.
- Doctor CRUD; authenticated users can read the directory, while only the creator can update or delete a doctor.
- Patient–doctor assignment creation, listing, and deletion.
- Zod request validation and centralized error handling.
- PostgreSQL constraints, foreign keys, uniqueness checks, and indexes.
- Helmet, CORS configuration, request-body size limits, and rate limiting.

## Technology Stack

| Component           | Technology                         |
| ------------------- | ---------------------------------- |
| Runtime             | Node.js 18+                        |
| HTTP Framework      | Express.js                         |
| Database            | PostgreSQL                         |
| Database Access     | `pg` with parameterized SQL        |
| Authentication      | JWT (HS256)                        |
| Password Hashing    | `bcryptjs`                         |
| Validation          | Zod                                |
| Security Middleware | Helmet, CORS, `express-rate-limit` |
| Development Server  | Nodemon                            |

## Project structure

```text
whatbytes-healthcare-backend/
├── scripts/
│   └── init-db.js              # Initializes the database schema
├── sql/
│   └── schema.sql              # Tables, constraints, and indexes
├── src/
│   ├── config/
│   │   └── env.js
│   ├── db/
│   │   └── pool.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── patients.routes.js
│   │   ├── doctors.routes.js
│   │   └── mappings.routes.js
│   ├── utils/
│   │   └── httpError.js
│   ├── validators/
│   │   └── schemas.js
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL installed and running
- Postman or another HTTP client for testing

Check your Node.js and npm versions:

```bash
node --version
npm --version
```

## Getting started

Run the following commands from the project root (the directory containing `package.json`).

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

In `psql` or pgAdmin, run:

```sql
CREATE DATABASE whatbytes_healthcare;
```

If you choose a different database name, use that name in your connection string.

### 3. Configure environment variables

Create `.env` from the example file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Edit `.env` and set the PostgreSQL connection details. Follow the variable names and format in `.env.example`.

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put the generated value in `JWT_SECRET`. Never commit `.env` or share real credentials.

### 4. Initialize the schema

```bash
npm run db:init
```

Expected output:

```text
Database schema initialized successfully.
```

The script executes `sql/schema.sql` against the database configured in `.env`. Existing tables are not modified by `CREATE TABLE IF NOT EXISTS`; missing indexes are created by `CREATE INDEX IF NOT EXISTS`.

### 5. Start the server

```bash
npm run dev
```

The API should be available at `http://localhost:3000`. The startup output should confirm that the server is running and PostgreSQL is connected.

Check the health endpoint:

```http
GET http://localhost:3000/health
```

Expected status: `200 OK`.

## Environment variables

Use `.env.example` and `src/config/env.js` as the source of truth for supported variable names and defaults. Typical settings include:

| Variable                | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `PORT`                  | HTTP port (the local setup uses `3000`)                  |
| `DATABASE_URL`          | PostgreSQL connection string                             |
| `JWT_SECRET`            | Secret used to sign and verify JWTs                      |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime; defaults to `15m` in this setup   |
| `BCRYPT_ROUNDS`         | bcrypt password-hashing cost                             |

Do not publish actual values from `.env`.

## Authentication

Registration and login are public. Both return an `access` token on success.

For every protected request, include this header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Access tokens expire according to `JWT_ACCESS_EXPIRES_IN` (15 minutes by default). Log in again to obtain a new token after expiration.

### Register a user

`POST /api/auth/register/`

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "ChangeMe123!"
}
```

### Log in

`POST /api/auth/login/`

```json
{
  "email": "user@example.com",
  "password": "ChangeMe123!"
}
```

Use test credentials for local development, not a real account password.

## API reference

Base URL: `http://localhost:3000`

Trailing slashes are optional in the Express routes. All endpoints below, except health and authentication, require a valid JWT.

### Health

| Method | Endpoint  | Auth required | Purpose                |
| ------ | --------- | ------------- | ---------------------- |
| `GET`  | `/health` | No            | Check API availability |

### Authentication

| Method | Endpoint              | Purpose                  |
| ------ | --------------------- | ------------------------ |
| `POST` | `/api/auth/register/` | Register a user          |
| `POST` | `/api/auth/login/`    | Log in and receive a JWT |

### Patients

Patient access is restricted to the authenticated owner.

| Method   | Endpoint             | Purpose                          |
| -------- | -------------------- | -------------------------------- |
| `POST`   | `/api/patients/`     | Create a patient                 |
| `GET`    | `/api/patients/`     | List the current user's patients |
| `GET`    | `/api/patients/:id/` | Retrieve an owned patient        |
| `PUT`    | `/api/patients/:id/` | Update an owned patient          |
| `DELETE` | `/api/patients/:id/` | Delete an owned patient          |

Example request body:

```json
{
  "name": "Aarav Sharma",
  "date_of_birth": "1998-04-15",
  "gender": "male",
  "contact_number": "+91-9000000000",
  "address": "Mathura, Uttar Pradesh"
}
```

Allowed gender values: `female`, `male`, `other`, `prefer_not_to_say`. Optional fields may be omitted on creation. For `PUT`, `name` is required; omitted optional fields are set to `null`.

### Doctors

All authenticated users can read the doctor directory. Only the creator can update or delete a doctor record.

| Method   | Endpoint            | Purpose                                  |
| -------- | ------------------- | ---------------------------------------- |
| `POST`   | `/api/doctors/`     | Create a doctor                          |
| `GET`    | `/api/doctors/`     | List all doctors                         |
| `GET`    | `/api/doctors/:id/` | Retrieve a doctor                        |
| `PUT`    | `/api/doctors/:id/` | Update a doctor created by the current user |
| `DELETE` | `/api/doctors/:id/` | Delete a doctor created by the current user |

Example request body:

```json
{
  "name": "Dr. Meera Singh",
  "specialization": "Cardiology",
  "email": "meera@example.com",
  "contact_number": "+91-9111111111",
  "clinic_address": "Mathura, Uttar Pradesh"
}
```

For `PUT`, `name` and `specialization` are required. Omitted optional fields are set to `null`.

### Patient–doctor mappings

A user can create and view mappings only for patients they own.

| Method   | Endpoint                     | Purpose                                      |
| -------- | ---------------------------- | -------------------------------------------- |
| `POST`   | `/api/mappings/`             | Assign a doctor to an owned patient          |
| `GET`    | `/api/mappings/`             | List mappings for the current user's patients |
| `GET`    | `/api/mappings/:patient_id/` | List doctors assigned to an owned patient    |
| `DELETE` | `/api/mappings/:id/`         | Delete a mapping for an owned patient        |

Example request body:

```json
{
  "patient": 1,
  "doctor": 1
}
```

Both IDs must refer to existing records. Duplicate patient–doctor assignments return `409 Conflict`.

## Errors and status codes

Validation errors use a structured response such as:

```json
{
  "error": "Validation failed.",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

| Status                      | Meaning                                                     |
| --------------------------- | ----------------------------------------------------------- |
| `200 OK`                    | Request succeeded                                           |
| `201 Created`               | Resource created                                            |
| `204 No Content`            | Deletion succeeded; response has no body                    |
| `400 Bad Request`           | Invalid input or validation failure                         |
| `401 Unauthorized`          | Missing, invalid, or expired token; or invalid credentials  |
| `403 Forbidden`             | Authenticated user is not allowed to modify the resource    |
| `404 Not Found`             | Resource not found or not accessible under ownership rules  |
| `409 Conflict`              | Duplicate email or patient–doctor assignment                |
| `500 Internal Server Error` | Unexpected server error                                     |

Exact messages depend on the endpoint and error condition.

## Security and authorization

- **Password security:** Passwords are hashed with bcrypt and are not returned in API responses.
- **JWT:** Protected routes verify HS256 access tokens using a server-side secret.
- **SQL injection mitigation:** Queries use parameterized SQL.
- **Input validation:** Zod validates payloads and rejects unexpected keys where configured.
- **Patient ownership:** Patient retrieval, updates, and deletion are scoped to the authenticated user.
- **Doctor permissions:** Authenticated users can read doctors; only the creator can update or delete them.
- **Mapping ownership:** Mapping operations enforce ownership of the associated patient.
- **Database integrity:** Foreign keys and uniqueness constraints protect relationships and prevent duplicate assignments.
- **HTTP protections:** Helmet, CORS configuration, request-body limits, and rate limiting are enabled.

> This is an assignment project, not a production security or healthcare-compliance assessment. Use synthetic data for development and testing.

## Testing with Postman

1. Start PostgreSQL, initialize the schema, and run the API.
2. Register **User A** and save the returned `access` token.
3. Use User A's token to create a patient, create a doctor, and create a mapping using their IDs.
4. Test patient listing, doctor listing, and mapping retrieval.
5. Register **User B** and switch to User B's token.
6. Verify that User B cannot retrieve, update, or delete User A's patient.
7. Verify that User B cannot create or delete mappings for User A's patient.
8. Verify that User B cannot update or delete a doctor created by User A.
9. Test missing/invalid tokens, invalid payloads, duplicate emails, duplicate mappings, and nonexistent IDs.
10. Confirm successful deletions return `204 No Content`.

For protected requests, always set:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Save and export the Postman collection to make the API and authorization tests easy to review.

## Troubleshooting

### PostgreSQL connection fails

- Confirm the PostgreSQL service is running.
- Check the host, port, username, password, and database name in `.env`.
- Ensure the database exists before running `npm run db:init`.
- Confirm the database user has permission to create tables and indexes.

### Schema initialization fails

- Confirm `DATABASE_URL` points to the intended database.
- Read the terminal error for the specific SQL or connection problem.
- Remember that `CREATE TABLE IF NOT EXISTS` does not alter an existing table.

### A protected endpoint returns `401 Unauthorized`

- Confirm the `Authorization` header uses `Bearer YOUR_ACCESS_TOKEN`.
- Check that the token is complete and has not expired.
- Log in again and retry with the new token.

### A request returns `404 Not Found`

- Verify the endpoint and resource ID.
- Patient and mapping endpoints intentionally enforce ownership and do not expose another user's patient records.

### A request returns `409 Conflict`

- Check whether the email is already registered or the patient–doctor assignment already exists.

## Submission checklist

- [ ] Ensure `.env` is ignored by Git.
- [ ] Ensure no credentials, JWT secrets, or real patient data are committed.
- [ ] Verify a clean setup with `npm install` and `npm run db:init`.
- [ ] Start the server and verify `GET /health`.
- [ ] Run the Postman endpoint and ownership tests.
