import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapRegistration } from '../utils/helpers.js';

const router = Router();

router.get('/registrations/lookup', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Search value is required' });
  const like = `%${q}%`;
  const rows = await query('SELECT * FROM registrations ORDER BY submitted_at DESC');
  const match = rows.map(mapRegistration).find((item) => {
    const idMatch = item.id.toLowerCase() === q.toLowerCase();
    const nameMatch = String(item.applicant?.fullName || '').toLowerCase().includes(q.toLowerCase());
    const phoneMatch = String(item.applicant?.phone || '').includes(q);
    return idMatch || nameMatch || phoneMatch;
  });
  if (!match) return res.status(404).json({ message: 'No matching application' });
  res.json({
    id: match.id,
    status: match.status,
    submittedAt: match.submittedAt,
    notes: match.notes,
    applicant: {
      fullName: match.applicant.fullName,
      church: match.applicant.church,
    },
    membership: {
      membershipCategory: match.membership.membershipCategory,
    },
  });
}));

router.get('/churches', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT id, name FROM churches ORDER BY name');
  res.json(rows);
}));

export default router;
