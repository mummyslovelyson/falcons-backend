-- ==========================================================
-- Hinterland Falcons Pathfinder Club - PostgreSQL Schema
-- Designed for Neon Console (neon.tech) / PostgreSQL
-- ==========================================================

-- 1. Administrators Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at VARCHAR(40) NOT NULL
);

-- 2. Churches Table
CREATE TABLE IF NOT EXISTS churches (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  pastor_name VARCHAR(190) NOT NULL DEFAULT '',
  contact_phone VARCHAR(40) NOT NULL DEFAULT '',
  contact_email VARCHAR(190) NOT NULL DEFAULT '',
  location VARCHAR(190) NOT NULL DEFAULT '',
  district VARCHAR(190) NOT NULL DEFAULT '',
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at VARCHAR(40) NOT NULL
);

-- 3. Church Members Table
CREATE TABLE IF NOT EXISTS church_members (
  id VARCHAR(64) PRIMARY KEY,
  church_id VARCHAR(64) NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  date_of_birth VARCHAR(40) NOT NULL DEFAULT '',
  gender VARCHAR(20) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL DEFAULT '',
  address TEXT,
  membership_category VARCHAR(40) NOT NULL DEFAULT 'Pathfinder',
  pathfinder_class VARCHAR(40) NOT NULL DEFAULT '',
  parent_guardian_name VARCHAR(190) NOT NULL DEFAULT '',
  parent_guardian_phone VARCHAR(40) NOT NULL DEFAULT '',
  emergency_contact VARCHAR(190) NOT NULL DEFAULT '',
  emergency_phone VARCHAR(40) NOT NULL DEFAULT '',
  date_joined VARCHAR(40) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  special_notes TEXT,
  profile_photo TEXT,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL
);

-- 4. Online Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  id VARCHAR(64) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_at VARCHAR(40) NOT NULL,
  reviewed_at VARCHAR(40) NULL,
  reviewed_by VARCHAR(120) NULL,
  notes TEXT,
  applicant TEXT NOT NULL,
  membership TEXT NOT NULL,
  guardian TEXT NOT NULL,
  consent TEXT NOT NULL
);

-- 5. Uniform Requests Table
CREATE TABLE IF NOT EXISTS uniform_requests (
  id VARCHAR(64) PRIMARY KEY,
  member_name VARCHAR(190) NOT NULL,
  member_phone VARCHAR(40) NOT NULL DEFAULT '',
  member_church VARCHAR(190) NOT NULL DEFAULT '',
  member_category VARCHAR(80) NOT NULL DEFAULT '',
  gender VARCHAR(20) NOT NULL DEFAULT '',
  fabrics TEXT NOT NULL,
  total_yards DECIMAL(8,1) NOT NULL DEFAULT 0,
  special_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_at VARCHAR(40) NOT NULL,
  processed_at VARCHAR(40) NULL,
  processed_by VARCHAR(120) NULL,
  admin_notes TEXT
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(40) NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT,
  time_label VARCHAR(40) NOT NULL DEFAULT 'Just now',
  is_read SMALLINT NOT NULL DEFAULT 0,
  link VARCHAR(190) NOT NULL DEFAULT '/',
  church VARCHAR(190) NULL,
  created_at VARCHAR(40) NOT NULL
);

-- 7. Club Events Table
CREATE TABLE IF NOT EXISTS club_events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  category VARCHAR(40) NOT NULL,
  event_date VARCHAR(40) NOT NULL,
  event_time VARCHAR(40) NOT NULL DEFAULT '',
  location VARCHAR(190) NOT NULL DEFAULT '',
  status VARCHAR(40) NOT NULL DEFAULT 'Upcoming',
  participants_count INT NOT NULL DEFAULT 0
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  meeting_date VARCHAR(20) NOT NULL,
  member_id VARCHAR(64) NOT NULL,
  name VARCHAR(190) NOT NULL,
  class_name VARCHAR(80) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'Present',
  CONSTRAINT uniq_attendance UNIQUE (meeting_date, member_id)
);

-- 9. Transactions & Finances Table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  txn_date VARCHAR(20) NOT NULL,
  member_name VARCHAR(190) NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(80) NOT NULL,
  receipt_no VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Completed'
);

-- 10. AY Honors Table
CREATE TABLE IF NOT EXISTS honors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  category VARCHAR(40) NOT NULL,
  level VARCHAR(20) NOT NULL,
  requirements_count INT NOT NULL DEFAULT 0,
  badge_color VARCHAR(80) NOT NULL DEFAULT 'bg-emerald-600',
  recipients_count INT NOT NULL DEFAULT 0
);

-- 11. Club Settings Table
CREATE TABLE IF NOT EXISTS club_settings (
  id INT PRIMARY KEY,
  payload TEXT NOT NULL
);

-- ==========================================================
-- SEED DATA (Runs safely with ON CONFLICT DO NOTHING)
-- ==========================================================

-- Seed Initial Admins (password: pathfinder)
INSERT INTO admins (id, name, email, password_hash, created_at)
VALUES
  (1, 'Pathfinder Director', 'admin@pathfinder.com', '$2a$10$7VVUBEV9OsPHeyVCiFC32uZB9UtZAJ6ItpuCkVvLd7IQHrI9vin7C', '2026-01-01T00:00:00.000Z'),
  (2, 'District Executive', 'admin@tnuc.gh', '$2a$10$7VVUBEV9OsPHeyVCiFC32uZB9UtZAJ6ItpuCkVvLd7IQHrI9vin7C', '2026-01-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('admins', 'id'), coalesce(max(id), 1)) FROM admins;

-- Seed Constituent Churches across Santasi District (password: Pathfinder@2026)
INSERT INTO churches (id, name, pastor_name, contact_phone, contact_email, location, district, username, password_hash, created_at)
VALUES
  ('CH-ANYINAM', 'Anyinam SDA Church', 'Pastor Osei Bonsu', '+233 24 100 2001', 'anyinam@santasiaym.org', 'Anyinam - Kumasi', 'Santasi District', 'anyinam_clerk', '$2a$10$yu/ZGpzzvI7K4l/.0IVqTOuEIzfZS2RqvXr3yeH6GWpnOn6cj9cbu', '2026-01-01T00:00:00.000Z'),
  ('CH-SANTASI', 'Santasi Central SDA Church', 'Pastor Emmanuel Amankwah', '+233 24 200 3002', 'santasi@santasiaym.org', 'Santasi - Kumasi', 'Santasi District', 'santasi_clerk', '$2a$10$yu/ZGpzzvI7K4l/.0IVqTOuEIzfZS2RqvXr3yeH6GWpnOn6cj9cbu', '2026-01-01T00:00:00.000Z'),
  ('CH-APIRE', 'Apire SDA Church', 'Pastor Daniel Mensah', '+233 24 300 4003', 'apire@santasiaym.org', 'Apire - Kumasi', 'Santasi District', 'apire_clerk', '$2a$10$yu/ZGpzzvI7K4l/.0IVqTOuEIzfZS2RqvXr3yeH6GWpnOn6cj9cbu', '2026-01-01T00:00:00.000Z'),
  ('CH-BROFOYEDRU', 'Brofoyedru SDA Church', 'Pastor Samuel Darko', '+233 24 400 5004', 'brofoyedru@santasiaym.org', 'Brofoyedru - Kumasi', 'Santasi District', 'brofoyedru_clerk', '$2a$10$yu/ZGpzzvI7K4l/.0IVqTOuEIzfZS2RqvXr3yeH6GWpnOn6cj9cbu', '2026-01-01T00:00:00.000Z'),
  ('CH-FANKYENEBRA', 'Fankyenebra SDA Church', 'Pastor Kwabena Agyemang', '+233 24 500 6005', 'fankyenebra@santasiaym.org', 'Fankyenebra - Kumasi', 'Santasi District', 'fankyenebra_clerk', '$2a$10$yu/ZGpzzvI7K4l/.0IVqTOuEIzfZS2RqvXr3yeH6GWpnOn6cj9cbu', '2026-01-01T00:00:00.000Z'),
  ('CH-TWEDIE', 'Twedie SDA Church', 'Pastor Isaac Frimpong', '+233 24 600 7006', 'twedie@santasiaym.org', 'Twedie - Kumasi', 'Santasi District', 'twedie_clerk', '$2a$10$yu/ZGpzzvI7K4l/.0IVqTOuEIzfZS2RqvXr3yeH6GWpnOn6cj9cbu', '2026-01-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Seed Core Club Events
INSERT INTO club_events (id, title, category, event_date, event_time, location, status, participants_count)
VALUES
  ('EV-001', 'Sunday Field Drills & Progressive Class Work', 'Weekly Training', 'Every Sunday', '2:00 PM – 5:30 PM', 'Santasi SDA Church Grounds', 'Active', 65),
  ('EV-002', 'Sabbath AYM Divine Service & Society Meeting', 'Spiritual', 'Every Saturday', '4:30 PM – 6:15 PM', 'Santasi Sanctuary', 'Scheduled', 80),
  ('EV-003', 'Campcraft & Survival Knot Assessment Exercise', 'Curriculum Exam', 'Last Sunday of Month', '2:30 PM', 'Santasi Drill Grounds', 'Upcoming', 50),
  ('EV-004', 'Ashanti South Ghana Conference Camporee 2026', 'Conference Event', 'August 18 – 24, 2026', 'All Day Event', 'Bekwai Camporee Grounds', 'Scheduled', 120)
ON CONFLICT (id) DO NOTHING;

-- Seed Core AY Honors
INSERT INTO honors (id, name, category, level, requirements_count, badge_color, recipients_count)
VALUES
  ('HN-01', 'Camping Skills', 'Wilderness', 'Basic', 8, 'bg-emerald-600', 45),
  ('HN-02', 'Knotcraft', 'Pioneering', 'Standard', 10, 'bg-amber-600', 52),
  ('HN-03', 'First Aid', 'Health', 'Standard', 9, 'bg-rose-600', 38),
  ('HN-04', 'Nature Trees', 'Nature', 'Basic', 7, 'bg-green-700', 40),
  ('HN-05', 'Bible Marking', 'Spiritual', 'Advanced', 8, 'bg-blue-600', 60),
  ('HN-06', 'Camp Cookery', 'Household', 'Basic', 6, 'bg-yellow-600', 30)
ON CONFLICT (id) DO NOTHING;
