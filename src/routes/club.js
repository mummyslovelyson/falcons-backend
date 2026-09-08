import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapChurchMember, makeId } from '../utils/helpers.js';
import { requireAdmin } from '../middleware/auth.js';
import { getSettings } from '../services/notify.js';

const router = Router();

router.get('/church-members', requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM church_members ORDER BY created_at DESC');
  res.json(rows.map(mapChurchMember));
}));

router.get('/events', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM club_events ORDER BY event_date DESC');
  res.json(rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    date: row.event_date,
    time: row.event_time,
    location: row.location,
    status: row.status,
    participantsCount: row.participants_count,
  })));
}));

router.post('/events', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const event = {
    id: makeId('EV'),
    title: body.title,
    category: body.category || 'Camporee',
    date: body.date,
    time: body.time || '9:00 AM',
    location: body.location,
    status: body.status || 'Upcoming',
    participantsCount: Number(body.participantsCount) || 0,
  };
  await query(
    `INSERT INTO club_events (id, title, category, event_date, event_time, location, status, participants_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.title, event.category, event.date, event.time, event.location, event.status, event.participantsCount]
  );
  res.status(201).json(event);
}));

router.put('/events/:id', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  await query(
    `UPDATE club_events SET title = ?, category = ?, event_date = ?, event_time = ?, location = ?, status = ?, participants_count = ?
     WHERE id = ?`,
    [body.title, body.category, body.date, body.time, body.location, body.status, Number(body.participantsCount) || 0, req.params.id]
  );
  res.json({ ok: true, id: req.params.id });
}));

router.delete('/events/:id', requireAdmin, asyncHandler(async (req, res) => {
  await query('DELETE FROM club_events WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.get('/attendance', requireAdmin, asyncHandler(async (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ message: 'date is required' });
  const rows = await query('SELECT * FROM attendance WHERE meeting_date = ?', [date]);
  res.json(rows.map((row) => ({
    memberId: row.member_id,
    name: row.name,
    className: row.class_name,
    status: row.status,
  })));
}));

router.put('/attendance', requireAdmin, asyncHandler(async (req, res) => {
  const { date, records } = req.body || {};
  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ message: 'date and records are required' });
  }
  for (const record of records) {
    await query(
      `INSERT INTO attendance (meeting_date, member_id, name, class_name, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), class_name = VALUES(class_name), status = VALUES(status)`,
      [date, record.memberId, record.name, record.className || '', record.status || 'Present']
    );
  }
  res.json({ ok: true, records });
}));

router.get('/finances', requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM transactions ORDER BY txn_date DESC');
  res.json(rows.map((row) => ({
    id: row.id,
    date: row.txn_date,
    memberName: row.member_name,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    receiptNo: row.receipt_no,
    status: row.status,
  })));
}));

router.post('/finances', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const created = {
    id: makeId('TXN'),
    date: body.date || new Date().toISOString().slice(0, 10),
    memberName: body.memberName,
    category: body.category || 'Annual Registration Dues',
    amount: Number(body.amount) || 0,
    paymentMethod: body.paymentMethod || 'MTN Mobile Money',
    receiptNo: body.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
    status: body.status || 'Completed',
  };
  await query(
    `INSERT INTO transactions (id, txn_date, member_name, category, amount, payment_method, receipt_no, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [created.id, created.date, created.memberName, created.category, created.amount, created.paymentMethod, created.receiptNo, created.status]
  );
  res.status(201).json(created);
}));

router.delete('/finances/:id', requireAdmin, asyncHandler(async (req, res) => {
  await query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.get('/settings', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await getSettings());
}));

router.put('/settings', requireAdmin, asyncHandler(async (req, res) => {
  const current = await getSettings();
  const next = { ...current, ...(req.body || {}) };
  await query(
    `INSERT INTO club_settings (id, payload) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
    [JSON.stringify(next)]
  );
  res.json(next);
}));

router.get('/honors', requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM honors ORDER BY name');
  res.json(rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    requirementsCount: row.requirements_count,
    badgeColor: row.badge_color,
    recipientsCount: row.recipients_count,
  })));
}));

router.post('/honors/:id/award', requireAdmin, asyncHandler(async (req, res) => {
  await query('UPDATE honors SET recipients_count = recipients_count + 1 WHERE id = ?', [req.params.id]);
  const rows = await query('SELECT * FROM honors WHERE id = ?', [req.params.id]);
  res.json(rows[0] || { ok: true });
}));

export default router;
