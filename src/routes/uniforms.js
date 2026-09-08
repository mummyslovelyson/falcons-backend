import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapUniform, makeId } from '../utils/helpers.js';
import { requireAdmin } from '../middleware/auth.js';
import { notifyUniformRequest } from '../services/notify.js';

const router = Router();

router.get('/', requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM uniform_requests ORDER BY submitted_at DESC');
  res.json(rows.map(mapUniform));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const fabrics = Array.isArray(body.fabrics) ? body.fabrics : [];
  const totalYards = Number(body.totalYards) || fabrics.reduce((sum, item) => sum + Number(item.yards || 0), 0);
  const request = {
    id: body.id || `UNI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    memberName: body.memberName || '',
    memberPhone: body.memberPhone || '',
    memberChurch: body.memberChurch || '',
    memberCategory: body.memberCategory || '',
    gender: body.gender || '',
    fabrics,
    totalYards,
    specialNotes: body.specialNotes || '',
    status: body.status || 'pending',
    submittedAt: body.submittedAt || new Date().toISOString(),
    processedAt: body.processedAt || null,
    processedBy: body.processedBy || null,
    adminNotes: body.adminNotes || null,
  };
  await query(
    `INSERT INTO uniform_requests
      (id, member_name, member_phone, member_church, member_category, gender, fabrics, total_yards, special_notes, status, submitted_at, processed_at, processed_by, admin_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request.id, request.memberName, request.memberPhone, request.memberChurch, request.memberCategory, request.gender,
      JSON.stringify(request.fabrics), request.totalYards, request.specialNotes, request.status, request.submittedAt,
      request.processedAt, request.processedBy, request.adminNotes,
    ]
  );
  await notifyUniformRequest(request);
  res.status(201).json(request);
}));

router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM uniform_requests WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Uniform request not found' });
  const current = mapUniform(rows[0]);
  const next = { ...current, ...req.body };
  if (req.body.fabrics) next.fabrics = req.body.fabrics;
  await query(
    `UPDATE uniform_requests SET member_name=?, member_phone=?, member_church=?, member_category=?, gender=?, fabrics=?,
      total_yards=?, special_notes=?, status=?, processed_at=?, processed_by=?, admin_notes=? WHERE id=?`,
    [
      next.memberName, next.memberPhone, next.memberChurch, next.memberCategory, next.gender, JSON.stringify(next.fabrics || []),
      next.totalYards, next.specialNotes, next.status, next.processedAt || null, next.processedBy || null, next.adminNotes || null,
      req.params.id,
    ]
  );
  res.json(next);
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await query('DELETE FROM uniform_requests WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
