import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapRegistration } from '../utils/helpers.js';

const router = Router();

router.get('/registrations/lookup', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Search value is required' });

  // Direct indexed ID lookup first (O(1))
  const idRows = await query('SELECT * FROM registrations WHERE LOWER(id) = LOWER(?) LIMIT 1', [q]);
  let row = idRows[0];

  // If not found by ID, search applicant JSON with parameterized ILIKE and limit candidate inspection
  if (!row) {
    const candidateRows = await query(
      'SELECT * FROM registrations WHERE applicant ILIKE ? ORDER BY submitted_at DESC LIMIT 10',
      [`%${q}%`]
    );
    row = candidateRows.find((r) => {
      const item = mapRegistration(r);
      const nameMatch = String(item.applicant?.fullName || '').toLowerCase().includes(q.toLowerCase());
      const phoneMatch = String(item.applicant?.phone || '').includes(q);
      return nameMatch || phoneMatch;
    });
  }

  if (!row) return res.status(404).json({ message: 'No matching application' });
  const match = mapRegistration(row);
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
