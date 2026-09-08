export function parseJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function makeId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function mapRegistration(row) {
  const applicant = parseJson(row.applicant, {});
  const membership = parseJson(row.membership, {});
  const guardian = parseJson(row.guardian, {});
  const consent = parseJson(row.consent, {});

  if (!Array.isArray(membership.completedClasses)) {
    membership.completedClasses = [];
  }

  return {
    id: row.id,
    applicant,
    membership,
    guardian,
    consent,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    notes: row.notes || undefined,
  };
}

export function mapChurch(row, includePassword = false) {
  const church = {
    id: row.id,
    name: row.name,
    pastorName: row.pastor_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    location: row.location,
    district: row.district,
    username: row.username,
    password: '',
    createdAt: row.created_at,
  };
  if (includePassword) church.password = row.password_hash ? '********' : '';
  return church;
}

export function mapChurchMember(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address || '',
    membershipCategory: row.membership_category,
    pathfinderClass: row.pathfinder_class,
    parentGuardianName: row.parent_guardian_name,
    parentGuardianPhone: row.parent_guardian_phone,
    emergencyContact: row.emergency_contact,
    emergencyPhone: row.emergency_phone,
    dateJoined: row.date_joined,
    status: row.status,
    specialNotes: row.special_notes || '',
    profilePhoto: row.profile_photo || '',
    churchId: row.church_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUniform(row) {
  return {
    id: row.id,
    memberName: row.member_name,
    memberPhone: row.member_phone,
    memberChurch: row.member_church,
    memberCategory: row.member_category,
    gender: row.gender,
    fabrics: parseJson(row.fabrics, []),
    totalYards: Number(row.total_yards),
    specialNotes: row.special_notes || '',
    status: row.status,
    submittedAt: row.submitted_at,
    processedAt: row.processed_at || undefined,
    processedBy: row.processed_by || undefined,
    adminNotes: row.admin_notes || undefined,
  };
}

export function mapNotification(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    time: row.time_label,
    read: Boolean(row.is_read),
    link: row.link,
    church: row.church || undefined,
    createdAt: row.created_at,
  };
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
