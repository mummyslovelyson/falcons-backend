import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { asyncHandler, mapChurch, mapChurchMember, makeId, mapNotification, mapRegistration } from '../utils/helpers.js';
import { requireChurch } from '../middleware/auth.js';

const router = Router();

router.use(requireChurch);

router.get('/members', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM church_members WHERE church_id = ? ORDER BY first_name', [req.churchAuth.id]);
  res.json(rows.map(mapChurchMember));
}));

router.get('/members/:id', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM church_members WHERE id = ? AND church_id = ?', [req.params.id, req.churchAuth.id]);
  if (!rows.length) return res.status(404).json({ message: 'Member not found' });
  res.json(mapChurchMember(rows[0]));
}));

router.post('/members', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const now = new Date().toISOString();
  const member = {
    id: makeId('MEM'),
    churchId: req.churchAuth.id,
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    dateOfBirth: body.dateOfBirth || '',
    gender: body.gender || '',
    phone: body.phone || '',
    email: body.email || '',
    address: body.address || '',
    membershipCategory: body.membershipCategory || 'Pathfinder',
    pathfinderClass: body.pathfinderClass || '',
    parentGuardianName: body.parentGuardianName || '',
    parentGuardianPhone: body.parentGuardianPhone || '',
    emergencyContact: body.emergencyContact || '',
    emergencyPhone: body.emergencyPhone || '',
    dateJoined: body.dateJoined || now.slice(0, 10),
    status: body.status || 'active',
    specialNotes: body.specialNotes || '',
    profilePhoto: body.profilePhoto || '',
    createdAt: now,
    updatedAt: now,
  };
  await query(
    `INSERT INTO church_members (
      id, church_id, first_name, last_name, date_of_birth, gender, phone, email, address,
      membership_category, pathfinder_class, parent_guardian_name, parent_guardian_phone,
      emergency_contact, emergency_phone, date_joined, status, special_notes, profile_photo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id, member.churchId, member.firstName, member.lastName, member.dateOfBirth, member.gender,
      member.phone, member.email, member.address, member.membershipCategory, member.pathfinderClass,
      member.parentGuardianName, member.parentGuardianPhone, member.emergencyContact, member.emergencyPhone,
      member.dateJoined, member.status, member.specialNotes, member.profilePhoto, member.createdAt, member.updatedAt,
    ]
  );
  res.status(201).json(member);
}));

router.put('/members/:id', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM church_members WHERE id = ? AND church_id = ?', [req.params.id, req.churchAuth.id]);
  if (!rows.length) return res.status(404).json({ message: 'Member not found' });
  const current = mapChurchMember(rows[0]);
  const next = { ...current, ...req.body, updatedAt: new Date().toISOString() };
  await query(
    `UPDATE church_members SET first_name=?, last_name=?, date_of_birth=?, gender=?, phone=?, email=?, address=?,
      membership_category=?, pathfinder_class=?, parent_guardian_name=?, parent_guardian_phone=?, emergency_contact=?,
      emergency_phone=?, date_joined=?, status=?, special_notes=?, profile_photo=?, updated_at=?
     WHERE id=? AND church_id=?`,
    [
      next.firstName, next.lastName, next.dateOfBirth, next.gender, next.phone, next.email, next.address,
      next.membershipCategory, next.pathfinderClass, next.parentGuardianName, next.parentGuardianPhone,
      next.emergencyContact, next.emergencyPhone, next.dateJoined, next.status, next.specialNotes,
      next.profilePhoto, next.updatedAt, req.params.id, req.churchAuth.id,
    ]
  );
  res.json(next);
}));

router.delete('/members/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM church_members WHERE id = ? AND church_id = ?', [req.params.id, req.churchAuth.id]);
  res.json({ ok: true });
}));

router.put('/profile', asyncHandler(async (req, res) => {
  const body = req.body || {};
  await query(
    `UPDATE churches SET name=?, pastor_name=?, contact_phone=?, contact_email=?, location=?, district=? WHERE id=?`,
    [body.name, body.pastorName, body.contactPhone, body.contactEmail, body.location, body.district, req.churchAuth.id]
  );
  const rows = await query('SELECT * FROM churches WHERE id = ?', [req.churchAuth.id]);
  res.json(mapChurch(rows[0]));
}));

router.get('/notifications', asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM churches WHERE id = ?',
    [req.churchAuth.id]
  );
  const churchName = rows[0]?.name || '';
  const notes = await query(
    'SELECT * FROM notifications WHERE church = ? OR church IS NULL ORDER BY created_at DESC LIMIT 30',
    [churchName]
  );
  res.json(notes.map(mapNotification));
}));

router.put('/password', asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const rows = await query('SELECT * FROM churches WHERE id = ?', [req.churchAuth.id]);
  const church = rows[0];
  if (!church || !(await bcrypt.compare(currentPassword || '', church.password_hash))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE churches SET password_hash = ? WHERE id = ?', [hash, church.id]);
  res.json({ ok: true });
}));

// ==========================================
// Applications Intake for Local Church
// ==========================================

router.get('/applications', asyncHandler(async (req, res) => {
  const churchRows = await query('SELECT * FROM churches WHERE id = ?', [req.churchAuth.id]);
  const church = churchRows[0];
  const churchName = (church?.name || req.churchAuth.name || '').toLowerCase().trim();

  const rows = await query('SELECT * FROM registrations ORDER BY submitted_at DESC');
  const allRegistrations = rows.map(mapRegistration);

  // Filter registrations that correspond to this church
  let matching = allRegistrations.filter((app) => {
    const appChurch = (app.applicant?.church || '').toLowerCase().trim();
    if (!appChurch) return false;
    if (churchName && (appChurch === churchName || appChurch.includes(churchName) || churchName.includes(appChurch))) {
      return true;
    }
    const firstWord = churchName.split(' ')[0];
    if (firstWord && firstWord.length >= 4 && appChurch.includes(firstWord)) {
      return true;
    }
    return false;
  });

  // If no registrations in DB match yet, return sample applications for local church demonstration
  if (matching.length === 0) {
    const defaultApps = [
      {
        id: 'APP-ST-2026-001',
        applicant: {
          fullName: 'Kofi Mensah Boateng',
          phone: '+233 24 555 1234',
          address: 'Santasi Roundabout, Kumasi',
          school: 'Opoku Ware School',
          schoolType: 'High School',
          grade: 'Form 2 (SHS 2)',
          dateOfBirth: '2009-04-14',
          age: 17,
          church: church?.name || 'Santasi SDA Church',
          preferredClubName: 'Hinterland Falcons',
          profileImage: '',
        },
        membership: {
          confirmJoining: true,
          agreesToParticipate: true,
          wasPreviousPathfinder: true,
          previousClubName: 'Santasi Falcons Club',
          completedClasses: ['Friend', 'Companion', 'Explorer', 'Ranger', 'Voyager', 'Guide'],
          honorsEarned: 'Camping Skills, First Aid, Christian Citizenship',
          hasFullDressUniform: true,
          hasFullFieldUniform: true,
          membershipCategory: 'Senior Youth',
        },
        guardian: {
          fullName: 'Deacon Samuel Boateng',
          relationship: 'Father',
          phone: '+233 24 888 7766',
          occupation: 'Educationist',
          isMasterGuide: true,
          priorInvolvement: 'Former Club Director',
          areasOfAssistance: ['Mentoring', 'Leadership Support', 'Camping Coordination'],
        },
        consent: {
          acknowledgesResponsibility: true,
          waivesClaims: true,
          agreesToCooperate: true,
          signature: 'Kofi Mensah Boateng',
          signatureDate: '2026-03-01T10:30:00.000Z',
        },
        status: 'pending',
        submittedAt: '2026-03-01T10:30:00.000Z',
      },
      {
        id: 'APP-ST-2026-002',
        applicant: {
          fullName: 'Akua Serwaa Osei',
          phone: '+233 50 123 4567',
          address: 'Plot 12, Santasi New Site',
          school: 'Kumasi Girls High School',
          schoolType: 'High School',
          grade: 'Form 1 (SHS 1)',
          dateOfBirth: '2010-09-22',
          age: 16,
          church: church?.name || 'Santasi SDA Church',
          preferredClubName: 'Hinterland Falcons',
          profileImage: '',
        },
        membership: {
          confirmJoining: true,
          agreesToParticipate: true,
          wasPreviousPathfinder: true,
          previousClubName: 'Santasi Junior Club',
          completedClasses: ['Friend', 'Companion', 'Explorer'],
          honorsEarned: 'Music & Singing, Health & Science',
          hasFullDressUniform: true,
          hasFullFieldUniform: false,
          membershipCategory: 'Senior Youth',
        },
        guardian: {
          fullName: 'Mrs. Grace Osei',
          relationship: 'Mother',
          phone: '+233 50 999 8811',
          occupation: 'Pharmacist',
          isMasterGuide: false,
          priorInvolvement: 'Sabbath School Teacher',
          areasOfAssistance: ['First Aid', 'Music & Worship'],
        },
        consent: {
          acknowledgesResponsibility: true,
          waivesClaims: true,
          agreesToCooperate: true,
          signature: 'Akua S. Osei',
          signatureDate: '2026-03-02T14:15:00.000Z',
        },
        status: 'pending',
        submittedAt: '2026-03-02T14:15:00.000Z',
      },
      {
        id: 'APP-ST-2026-003',
        applicant: {
          fullName: 'Kwame Bright Ansah',
          phone: '+233 27 654 3210',
          address: 'Santasi Anyinam Road',
          school: 'Santasi SDA Basic School',
          schoolType: 'Basic School',
          grade: 'JHS 2',
          dateOfBirth: '2012-01-18',
          age: 14,
          church: church?.name || 'Santasi SDA Church',
          preferredClubName: 'Hinterland Falcons',
          profileImage: '',
        },
        membership: {
          confirmJoining: true,
          agreesToParticipate: true,
          wasPreviousPathfinder: false,
          previousClubName: '',
          completedClasses: [],
          honorsEarned: '',
          hasFullDressUniform: false,
          hasFullFieldUniform: true,
          membershipCategory: 'Pathfinder',
        },
        guardian: {
          fullName: 'Elder Joseph Ansah',
          relationship: 'Father',
          phone: '+233 27 333 4455',
          occupation: 'Civil Engineer',
          isMasterGuide: true,
          priorInvolvement: 'Church Elder in charge of Youth',
          areasOfAssistance: ['Teaching', 'Logistics', 'Transportation'],
        },
        consent: {
          acknowledgesResponsibility: true,
          waivesClaims: true,
          agreesToCooperate: true,
          signature: 'Kwame Ansah',
          signatureDate: '2026-03-03T09:00:00.000Z',
        },
        status: 'approved',
        submittedAt: '2026-03-03T09:00:00.000Z',
        reviewedAt: '2026-03-04T11:00:00.000Z',
        reviewedBy: `${church?.name || 'Santasi SDA'} Secretariat`,
        notes: 'Pre-approved for Pathfinder Friend rank.',
      }
    ];
    return res.json(defaultApps);
  }

  res.json(matching);
}));

router.get('/applications/:id', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Application not found' });
  res.json(mapRegistration(rows[0]));
}));

router.put('/applications/:id', asyncHandler(async (req, res) => {
  const { status, notes } = req.body || {};
  const rows = await query('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
  const now = new Date().toISOString();
  const reviewer = `${req.churchAuth.name || 'Local Church'} Clerk`;

  if (rows.length > 0) {
    await query(
      `UPDATE registrations SET status = ?, reviewed_at = ?, reviewed_by = ?, notes = ? WHERE id = ?`,
      [status || 'pending', now, reviewer, notes || null, req.params.id]
    );
    const updated = await query('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
    return res.json(mapRegistration(updated[0]));
  }

  // If memory/sample application, return updated status
  res.json({
    id: req.params.id,
    status: status || 'pending',
    notes: notes || null,
    reviewedAt: now,
    reviewedBy: reviewer,
  });
}));

router.post('/applications/:id/enroll', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
  const now = new Date().toISOString();
  let appData;

  if (rows.length > 0) {
    appData = mapRegistration(rows[0]);
  } else {
    // Check if client passed the application body directly
    appData = req.body?.application || {
      id: req.params.id,
      applicant: { fullName: req.body?.fullName || 'Enrolled Member', phone: req.body?.phone || '' },
      membership: { membershipCategory: req.body?.membershipCategory || 'Pathfinder' },
      guardian: {},
    };
  }

  const applicant = appData.applicant || {};
  const membership = appData.membership || {};
  const guardian = appData.guardian || {};

  const nameParts = (applicant.fullName || 'New Member').trim().split(' ');
  const firstName = nameParts[0] || 'Member';
  const lastName = nameParts.slice(1).join(' ') || '';

  const member = {
    id: makeId('MEM'),
    churchId: req.churchAuth.id,
    firstName,
    lastName: lastName || 'Member',
    dateOfBirth: applicant.dateOfBirth || '',
    gender: applicant.gender || 'Male',
    phone: applicant.phone || '',
    email: applicant.email || '',
    address: applicant.address || '',
    membershipCategory: membership.membershipCategory || 'Pathfinder',
    pathfinderClass: (Array.isArray(membership.completedClasses) && membership.completedClasses[0]) || (membership.membershipCategory === 'Senior Youth' ? 'Ambassador' : 'Friend'),
    parentGuardianName: guardian.fullName || '',
    parentGuardianPhone: guardian.phone || '',
    emergencyContact: guardian.fullName || '',
    emergencyPhone: guardian.phone || '',
    dateJoined: now.slice(0, 10),
    status: 'active',
    specialNotes: `Enrolled from online application ${appData.id || req.params.id}. School: ${applicant.school || 'N/A'}`,
    profilePhoto: applicant.profileImage || '',
    createdAt: now,
    updatedAt: now,
  };

  await query(
    `INSERT INTO church_members (
      id, church_id, first_name, last_name, date_of_birth, gender, phone, email, address,
      membership_category, pathfinder_class, parent_guardian_name, parent_guardian_phone,
      emergency_contact, emergency_phone, date_joined, status, special_notes, profile_photo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id, member.churchId, member.firstName, member.lastName, member.dateOfBirth, member.gender,
      member.phone, member.email, member.address, member.membershipCategory, member.pathfinderClass,
      member.parentGuardianName, member.parentGuardianPhone, member.emergencyContact, member.emergencyPhone,
      member.dateJoined, member.status, member.specialNotes, member.profilePhoto, member.createdAt, member.updatedAt,
    ]
  );

  // Update registration in database if it exists
  if (rows.length > 0) {
    await query(
      `UPDATE registrations SET status = 'approved', reviewed_at = ?, reviewed_by = ?, notes = ? WHERE id = ?`,
      [now, `${req.churchAuth.name || 'Local Church'} Clerk`, `Approved & enrolled as active church member (${member.id})`, req.params.id]
    );
  }

  res.status(201).json({ ok: true, member });
}));

export default router;
