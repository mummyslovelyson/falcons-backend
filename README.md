# Hinterland Falcons Pathfinder API & Backend

Express.js + MySQL backend service for the **Hinterland Falcons Pathfinder Club & Santasi AYM** portal.

Repository: [https://github.com/mummyslovelyson/falcons-backend](https://github.com/mummyslovelyson/falcons-backend)

---

## Features & Endpoints

- **Public & Intake Registration (`/api/registrations`)**:
  - Full online registration intake with passport photo (`applicant.profileImage`), constituent church selection, and progressive class level (`completedClasses`).
- **Member & Parent Portal (`/api/user`)**:
  - `POST /api/user/login`: Authentication by Reference ID (e.g. `PF-2026-XXXX`) or registered phone/email.
  - `GET /api/user/me`: Authenticated member profile & digital card info.
  - `PUT /api/user/profile`: Update contact numbers and emergency details.
  - `GET /api/user/uniforms`: Member uniform requests and fulfillment statuses.
  - `GET /api/user/attendance`: Roll-call attendance records.
  - `GET /api/user/events`: Upcoming club activities and drill sessions.
- **Constituent Churches Management (`/api/churches`)**:
  - Manage local constituent churches, pastor contacts, and clerk credentials.
- **Church Leader Portal (`/api/church-portal`)**:
  - Dedicated access for church directors to view member rosters and applications.
- **Uniform Requisitions (`/api/uniforms`)**:
  - Regulation uniform fabric orders and status processing.
- **Administrative Suite (`/api/auth/admin`)**:
  - Secure JWT cookie sessions for district administrators.
- **Automated Database Bootstrap**:
  - Auto-creates all required tables and seeds default admins, churches, events, and honors on startup.

---

## Local Setup

1. Ensure MySQL is running (e.g. via XAMPP, Docker, or native service).
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Configure your database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
4. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```
   *The server runs on `http://localhost:5000/api`.*

---

## Deployment (Render, Railway, VPS, Docker)

1. Set environment variables on your hosting provider:
   - `PORT`: (provided automatically or `5000`)
   - `DATABASE_URL` or standard MySQL variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
   - `CLIENT_ORIGIN`: Your deployed frontend URL (e.g. `https://hinterlandfalcons.org` or `http://localhost:8080`)
   - `JWT_SECRET`: A secure random secret string
   - `COOKIE_SECURE`: `true` (for HTTPS in production)
2. Start command:
   ```bash
   npm start
   ```

---

## Default Credentials

- **Admin Portal**: `admin@pathfinder.com` (or `admin@tnuc.gh`) / `pathfinder`
- **Church Portal**: `santasi_clerk` / `Pathfinder@2026` (or any constituent church clerk username)

