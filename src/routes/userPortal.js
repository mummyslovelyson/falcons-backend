import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, mapRegistration, mapChurchMember, mapUniform, parseJson } from '../utils/helpers.js';
import { setUserCookie, readToken, USER_COOKIE, requireUser } from '../middleware/auth.js';

const router = Router();

// Helper to normalize phone numbers for comparison (removes spaces, dashes, parentheses)
function normalizeContact(str) {
  return String(str || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * POST /api/user/login
 * Member / Parent login by Reference ID and/or registered phone / email.
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { referenceId, contact } = req.body || {};
  const cleanRef = (referenceId || '').trim();
  const cleanContact = normalizeContact(contact);

  if (!cleanRef && !cleanContact) {
    return res.status(400).json({ message: 'Please enter your Reference ID or registered Phone/Email' });
  }

  // 1. Check registrations table
  const regRows = await query('SELECT * FROM registrations');
  for (const row of regRows) {
    const reg = mapRegistration(row);
    const idMatch = cleanRef && (row.id.toLowerCase() === cleanRef.toLowerCase());
    const phoneMatch = cleanContact && (
      normalizeContact(reg.applicant?.phone).includes(cleanContact) ||
      normalizeContact(reg.guardian?.phone).includes(cleanContact) ||
      normalizeContact(reg.applicant?.email).includes(cleanContact) ||
      normalizeContact(reg.guardian?.email).includes(cleanContact)
    );

    // If both provided, match both (or ref match). If only one provided, match that one.
    if ((cleanRef && cleanContact && (idMatch || phoneMatch)) ||
        (cleanRef && !cleanContact && idMatch) ||
        (!cleanRef && cleanContact && phoneMatch)) {
      const token = setUserCookie(res, {
        id: reg.id,
        name: reg.applicant?.fullName || 'Member',
        type: 'registration',
      });
      return res.json({
        type: 'registration',
        record: reg,
        token,
      });
    }
  }

  // 2. Check church_members table
  const memberRows = await query('SELECT * FROM church_members');
  for (const row of memberRows) {
    const mem = mapChurchMember(row);
    const fullName = `${mem.firstName} ${mem.lastName}`.trim();
    const idMatch = cleanRef && (row.id.toLowerCase() === cleanRef.toLowerCase());
    const phoneMatch = cleanContact && (
      normalizeContact(mem.phone).includes(cleanContact) ||
      normalizeContact(mem.email).includes(cleanContact) ||
      normalizeContact(mem.parentGuardianPhone).includes(cleanContact)
    );

    if ((cleanRef && cleanContact && (idMatch || phoneMatch)) ||
        (cleanRef && !cleanContact && idMatch) ||
        (!cleanRef && cleanContact && phoneMatch)) {
      const token = setUserCookie(res, {
        id: mem.id,
        name: fullName,
        type: 'church_member',
      });
      return res.json({
        type: 'church_member',
        record: mem,
        token,
      });
    }
  }

  return res.status(404).json({
    message: 'No matching member or registration found. Please verify your Reference ID or contact details.',
  });
}));

/**
 * GET /api/user/me
 * Retrieves current authenticated member profile.
 */
router.get('/me', asyncHandler(async (req, res) => {
  const tokenUser = readToken(req, USER_COOKIE);
  if (!tokenUser || tokenUser.role !== 'user') {
    return res.json(null);
  }

  // Search in registrations
  const regRows = await query('SELECT * FROM registrations WHERE id = ?', [tokenUser.id]);
  if (regRows.length > 0) {
    return res.json({
      type: 'registration',
      record: mapRegistration(regRows[0]),
    });
  }

  // Search in church_members
  const memRows = await query('SELECT * FROM church_members WHERE id = ?', [tokenUser.id]);
  if (memRows.length > 0) {
    return res.json({
      type: 'church_member',
      record: mapChurchMember(memRows[0]),
    });
  }

  return res.json(null);
}));

/**
 * POST /api/user/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie(USER_COOKIE, { path: '/' });
  res.json({ ok: true });
});

/**
 * GET /api/user/uniforms
 * Retrieves uniforms requested by this member
 */
router.get('/uniforms', requireUser, asyncHandler(async (req, res) => {
  const tokenUser = req.userAuth;
  const rows = await query('SELECT * FROM uniform_requests ORDER BY submitted_at DESC');
  const mapped = rows.map(mapUniform);

  // Filter for matching member name or ID
  const memberName = (tokenUser.name || '').toLowerCase();
  const filtered = mapped.filter((u) => {
    return (
      u.memberName.toLowerCase().includes(memberName) ||
      memberName.includes(u.memberName.toLowerCase())
    );
  });

  res.json(filtered);
}));

/**
 * GET /api/user/attendance
 * Retrieves attendance records for this member
 */
router.get('/attendance', requireUser, asyncHandler(async (req, res) => {
  const tokenUser = req.userAuth;
  const rows = await query('SELECT * FROM attendance WHERE member_id = ? ORDER BY meeting_date DESC', [tokenUser.id]);
  if (rows.length > 0) {
    return res.json(rows.map(r => ({
      date: r.meeting_date,
      status: r.status,
      className: r.class_name,
    })));
  }

  // Fallback match by name
  const nameRows = await query('SELECT * FROM attendance WHERE name LIKE ? ORDER BY meeting_date DESC', [`%${tokenUser.name}%`]);
  res.json(nameRows.map(r => ({
    date: r.meeting_date,
    status: r.status,
    className: r.class_name,
  })));
}));

/**
 * GET /api/user/events
 * Upcoming club events
 */
router.get('/events', requireUser, asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM club_events ORDER BY event_date ASC');
  res.json(rows.map(row => ({
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

/**
 * PUT /api/user/profile
 * Allows member to update emergency contact or contact details
 */
router.put('/profile', requireUser, asyncHandler(async (req, res) => {
  const tokenUser = req.userAuth;
  const body = req.body || {};

  if (tokenUser.type === 'registration') {
    const rows = await query('SELECT * FROM registrations WHERE id = ?', [tokenUser.id]);
    if (!rows.length) return res.status(404).json({ message: 'Registration not found' });

    const current = mapRegistration(rows[0]);
    if (body.phone) current.applicant.phone = body.phone;
    if (body.email) current.applicant.email = body.email;
    if (body.address) current.applicant.address = body.address;
    if (body.emergencyContact) current.guardian.emergencyContact = body.emergencyContact;
    if (body.emergencyPhone) current.guardian.emergencyPhone = body.emergencyPhone;

    await query(
      'UPDATE registrations SET applicant = ?, guardian = ? WHERE id = ?',
      [JSON.stringify(current.applicant), JSON.stringify(current.guardian), tokenUser.id]
    );
    return res.json({ ok: true, record: current });
  }

  if (tokenUser.type === 'church_member') {
    await query(
      `UPDATE church_members SET phone = COALESCE(?, phone), email = COALESCE(?, email),
        address = COALESCE(?, address), emergency_contact = COALESCE(?, emergency_contact),
        emergency_phone = COALESCE(?, emergency_phone)
       WHERE id = ?`,
      [body.phone, body.email, body.address, body.emergencyContact, body.emergencyPhone, tokenUser.id]
    );
    const rows = await query('SELECT * FROM church_members WHERE id = ?', [tokenUser.id]);
    return res.json({ ok: true, record: mapChurchMember(rows[0]) });
  }

  res.json({ ok: true });
}));

export default router;
