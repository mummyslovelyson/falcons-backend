import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { asyncHandler, mapChurch } from '../utils/helpers.js';
import {
  requireAdmin,
  requireChurch,
  setAdminCookie,
  setChurchCookie,
  clearAuthCookies,
  readToken,
  ADMIN_COOKIE,
  CHURCH_COOKIE,
} from '../middleware/auth.js';

const router = Router();

router.post('/admin/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const rows = await query('SELECT * FROM admins WHERE email = ?', [email.trim().toLowerCase()]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return res.status(401).json({ message: 'Invalid administrator credentials' });
  }
  const token = setAdminCookie(res, { id: admin.id, email: admin.email, name: admin.name });
  res.json({ id: admin.id, email: admin.email, name: admin.name, token });
}));

router.post('/admin/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get('/admin/me', asyncHandler(async (req, res) => {
  const user = readToken(req, ADMIN_COOKIE);
  if (!user || user.role !== 'admin') {
    return res.json(null);
  }
  const rows = await query('SELECT id, name, email FROM admins WHERE id = ?', [user.id]);
  if (!rows.length) return res.json(null);
  res.json(rows[0]);
}));

router.put('/admin/password', requireAdmin, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const rows = await query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(currentPassword || '', admin.password_hash))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, admin.id]);
  res.json({ ok: true });
}));

router.post('/church/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const rows = await query('SELECT * FROM churches WHERE username = ?', [username.trim()]);
  const church = rows[0];
  if (!church || !(await bcrypt.compare(password, church.password_hash))) {
    return res.status(401).json({ message: 'Invalid church credentials' });
  }
  const token = setChurchCookie(res, { id: church.id, username: church.username, name: church.name });
  res.json({ ...mapChurch(church), token });
}));

router.post('/church/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get('/church/me', asyncHandler(async (req, res) => {
  const user = readToken(req, CHURCH_COOKIE);
  if (!user || user.role !== 'church') {
    return res.json(null);
  }
  const rows = await query('SELECT * FROM churches WHERE id = ?', [user.id]);
  if (!rows.length) return res.json(null);
  res.json(mapChurch(rows[0]));
}));

export default router;
