import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { asyncHandler, mapChurch, mapChurchMember, makeId } from '../utils/helpers.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM churches ORDER BY name ASC');
  res.json(rows.map((row) => mapChurch(row)));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name?.trim()) return res.status(400).json({ message: 'Church name is required' });
  const password = body.password?.trim() || 'Pathfinder@2026';
  const church = {
    id: body.id || makeId('CH'),
    name: body.name.trim(),
    pastorName: body.pastorName?.trim() || 'Church Pastor',
    contactPhone: body.contactPhone?.trim() || '',
    contactEmail: body.contactEmail?.trim() || '',
    location: body.location?.trim() || 'Santasi Area',
    district: body.district?.trim() || 'Santasi District',
    username: body.username?.trim() || `${body.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_clerk`,
    createdAt: new Date().toISOString(),
  };
  const hash = await bcrypt.hash(password, 10);
  try {
    await query(
      `INSERT INTO churches
        (id, name, pastor_name, contact_phone, contact_email, location, district, username, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        church.id,
        church.name,
        church.pastorName,
        church.contactPhone,
        church.contactEmail,
        church.location,
        church.district,
        church.username,
        hash,
        church.createdAt,
      ]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    throw err;
  }
  res.status(201).json({ ...church, password });
}));

router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM churches WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Church not found' });
  const current = rows[0];
  const body = req.body || {};
  const next = {
    name: body.name ?? current.name,
    pastor_name: body.pastorName ?? current.pastor_name,
    contact_phone: body.contactPhone ?? current.contact_phone,
    contact_email: body.contactEmail ?? current.contact_email,
    location: body.location ?? current.location,
    district: body.district ?? current.district,
    username: body.username ?? current.username,
    password_hash: current.password_hash,
  };
  let plainPassword;
  if (body.password && body.password !== '********' && body.password.trim()) {
    next.password_hash = await bcrypt.hash(body.password.trim(), 10);
    plainPassword = body.password.trim();
  }
  await query(
    `UPDATE churches SET name = ?, pastor_name = ?, contact_phone = ?, contact_email = ?, location = ?, district = ?, username = ?, password_hash = ?
     WHERE id = ?`,
    [
      next.name,
      next.pastor_name,
      next.contact_phone,
      next.contact_email,
      next.location,
      next.district,
      next.username,
      next.password_hash,
      req.params.id,
    ]
  );
  const mapped = mapChurch({ ...current, ...next, id: req.params.id });
  if (plainPassword) mapped.password = plainPassword;
  res.json(mapped);
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await query('DELETE FROM churches WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.get('/:id/members', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM church_members WHERE church_id = ? ORDER BY first_name', [req.params.id]);
  res.json(rows.map(mapChurchMember));
}));

export default router;
