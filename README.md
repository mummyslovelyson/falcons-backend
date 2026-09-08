# Hinterland Falcons Pathfinder API & Backend

Node.js / Express.js + **PostgreSQL** (Neon) backend service for the **Hinterland Falcons Pathfinder Club & Santasi AYM** portal.

Repository: [https://github.com/mummyslovelyson/falcons-backend](https://github.com/mummyslovelyson/falcons-backend)

---

## Database Architecture (PostgreSQL)

This backend runs natively on **PostgreSQL** (specifically optimized for [Neon Serverless PostgreSQL](https://neon.tech)).

### Quick Database Setup:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
   ```
3. Initialize the database schema & initial seed data:
   ```bash
   npm run init-db
   ```
   *(This runs `sql/init-db.js`, which imports `sql/schema.sql` into your PostgreSQL database).*

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

---

## Local Development

```bash
npm install
npm run dev
```
*The server runs on `http://localhost:5000/api`.*

---

## Production Deployment (Render, Railway, VPS, Docker)

1. Set environment variables on your hosting provider:
   - `PORT`: (provided automatically or `5000`)
   - `DATABASE_URL`: Your PostgreSQL connection string (from Neon or another PostgreSQL provider).
   - `CLIENT_ORIGIN`: Your deployed frontend URL (e.g. `https://hinterlandfalcons.org`)
   - `JWT_SECRET`: A secure random secret string
   - `COOKIE_SECURE`: `true` (for HTTPS in production)
2. Start command:
   ```bash
   npm start
   ```

---

## Default Seed Credentials

After running `npm run init-db`:

- **District Admin**:
  - Email: `admin@pathfinder.com` or `admin@tnuc.gh`
  - Password: `pathfinder`
- **Church Portals (Santasi, Anyinam, Apire, Brofoyedru, Fankyenebra, Twedie)**:
  - Usernames: `santasi_clerk`, `anyinam_clerk`, `apire_clerk`, etc.
  - Initial Password: `Pathfinder@2026`
