import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapRegistration, makeId, calculateAge } from '../utils/helpers.js';
import { requireAdmin } from '../middleware/auth.js';
import { notifyRegistrationReceived, notifyRegistrationStatus } from '../services/notify.js';

const router = Router();

router.get('/', requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM registrations ORDER BY submitted_at DESC');
  res.json(rows.map(mapRegistration));
}));

router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Registration not found' });
  res.json(mapRegistration(rows[0]));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const applicant = {
    ...(body.applicant || {}),
    age: calculateAge(body.applicant?.dateOfBirth),
  };
  const registration = {
    id: body.id || makeId('PF'),
    applicant,
    membership: body.membership || {},
    guardian: body.guardian || {},
    consent: {
      ...(body.consent || {}),
      signatureDate: body.consent?.signatureDate || new Date().toISOString(),
    },
    status: body.status || 'pending',
    submittedAt: body.submittedAt || new Date().toISOString(),
    reviewedAt: body.reviewedAt || null,
    reviewedBy: body.reviewedBy || null,
    notes: body.notes || null,
  };

  await query(
    `INSERT INTO registrations
      (id, status, submitted_at, reviewed_at, reviewed_by, notes, applicant, membership, guardian, consent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      registration.id,
      registration.status,
      registration.submittedAt,
      registration.reviewedAt,
      registration.reviewedBy,
      registration.notes,
      JSON.stringify(registration.applicant),
      JSON.stringify(registration.membership),
      JSON.stringify(registration.guardian),
      JSON.stringify(registration.consent),
    ]
  );

  if (registration.status === 'pending') {
    await notifyRegistrationReceived(registration);
  }
  res.status(201).json(registration);
}));

router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Registration not found' });
  const current = mapRegistration(rows[0]);
  const updates = req.body || {};
  const next = {
    ...current,
    ...updates,
    applicant: updates.applicant ? { ...current.applicant, ...updates.applicant } : current.applicant,
    membership: updates.membership ? { ...current.membership, ...updates.membership } : current.membership,
    guardian: updates.guardian ? { ...current.guardian, ...updates.guardian } : current.guardian,
    consent: updates.consent ? { ...current.consent, ...updates.consent } : current.consent,
  };

  await query(
    `UPDATE registrations SET status = ?, submitted_at = ?, reviewed_at = ?, reviewed_by = ?, notes = ?,
      applicant = ?, membership = ?, guardian = ?, consent = ? WHERE id = ?`,
    [
      next.status,
      next.submittedAt,
      next.reviewedAt || null,
      next.reviewedBy || null,
      next.notes || null,
      JSON.stringify(next.applicant),
      JSON.stringify(next.membership),
      JSON.stringify(next.guardian),
      JSON.stringify(next.consent),
      req.params.id,
    ]
  );

  if (updates.status && updates.status !== current.status && (updates.status === 'approved' || updates.status === 'rejected')) {
    await notifyRegistrationStatus(next);
  }
  res.json(next);
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await query('DELETE FROM registrations WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
