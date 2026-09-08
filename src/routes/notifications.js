import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapNotification, makeId } from '../utils/helpers.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendSms } from '../services/sms.js';
import { sendEmail } from '../services/email.js';
import { getSettings } from '../services/notify.js';

const router = Router();

router.post('/send-message', requireAdmin, asyncHandler(async (req, res) => {
  const { recipientName, recipientPhone, recipientEmail, message } = req.body || {};
  if (!message || (!recipientPhone && !recipientEmail)) {
    return res.status(400).json({ message: 'Recipient contact and message body are required' });
  }

  const settings = await getSettings();
  if (recipientPhone) {
    await sendSms(recipientPhone, message).catch((err) => console.warn('[send-message] sms error:', err.message));
  }
  if (recipientEmail && settings.emailAlerts) {
    await sendEmail(recipientEmail, `Message from ${settings.clubName || 'Santasi AYM'}`, `<p>${message}</p>`).catch((err) => console.warn('[send-message] email error:', err.message));
  }

  const notifId = makeId('MSG');
  await query(
    `INSERT INTO notifications (id, category, title, description, time_label, is_read, link, created_at)
     VALUES (?, 'Uniform', ?, ?, 'Just now', 1, '/admin/uniform-requests', ?)`,
    [notifId, `Message dispatched to ${recipientName || 'Member'}`, message.slice(0, 180), new Date().toISOString()]
  );

  res.json({ success: true, notifId });
}));

router.get('/', requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
  res.json(rows.map(mapNotification));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const id = makeId('NTF');
  const createdAt = new Date().toISOString();
  await query(
    `INSERT INTO notifications (id, category, title, description, time_label, is_read, link, church, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [id, body.category || 'General', body.title, body.description || '', body.time || 'Just now', body.link || '/', body.church || null, createdAt]
  );
  res.status(201).json({
    id,
    category: body.category || 'General',
    title: body.title,
    description: body.description || '',
    time: body.time || 'Just now',
    read: false,
    link: body.link || '/',
    church: body.church,
    createdAt,
  });
}));

router.put('/:id/read', requireAdmin, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.put('/read-all', requireAdmin, asyncHandler(async (_req, res) => {
  await query('UPDATE notifications SET is_read = 1');
  res.json({ ok: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.delete('/', requireAdmin, asyncHandler(async (_req, res) => {
  await query('DELETE FROM notifications');
  res.json({ ok: true });
}));

export default router;
