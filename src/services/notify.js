import { query } from '../config/db.js';
import { makeId, parseJson } from '../utils/helpers.js';
import { sendSms } from './sms.js';
import { sendEmail } from './email.js';

export async function getSettings() {
  const rows = await query('SELECT payload FROM club_settings WHERE id = 1');
  if (!rows.length) {
    return {
      clubName: 'Hinterland Falcons Pathfinder Club',
      emailAlerts: true,
      smsAlerts: false,
      templateReceived: 'Dear {name}, thank you for registering with Hinterland Falcons Pathfinder Club. Your application is currently under leadership review.',
      templateApproved: 'Congratulations {name}! Your application to the Hinterland Falcons Pathfinder Club has been approved. Welcome to the 2026 club season.',
      templateRejected: 'Dear {name}, thank you for your interest. Unfortunately, your application requires additional review or verification. Please contact club leadership.',
      email: '',
      phone: '',
    };
  }
  return parseJson(rows[0].payload, {});
}

export async function addNotification({ category, title, description, link, church }) {
  const id = makeId('NTF');
  await query(
    `INSERT INTO notifications (id, category, title, description, time_label, is_read, link, church, created_at)
     VALUES (?, ?, ?, ?, 'Just now', 0, ?, ?, ?)`,
    [id, category, title, description, link || '/', church || null, new Date().toISOString()]
  );
  return id;
}

function fillTemplate(template, name) {
  return String(template || '').replaceAll('{name}', name || 'Applicant');
}

async function deliver(settings, phone, email, message) {
  const tasks = [];
  if (settings.smsAlerts && phone) {
    tasks.push(sendSms(phone, message).catch((err) => console.error('[notify] sms', err.message)));
  }
  if (settings.emailAlerts && email) {
    tasks.push(
      sendEmail(email, settings.clubName || 'Hinterland Falcons', `<p>${message}</p>`).catch((err) =>
        console.error('[notify] email', err.message)
      )
    );
  }
  await Promise.all(tasks);
}

export async function notifyRegistrationReceived(registration) {
  const settings = await getSettings();
  const name = registration.applicant?.fullName;
  const church = registration.applicant?.church;
  await addNotification({
    category: 'Intake',
    title: 'New Member Registration',
    description: `${name} submitted registration for ${church || 'Santasi Central SDA'}.`,
    link: '/admin/applications',
    church,
  });
  await deliver(
    settings,
    registration.applicant?.phone,
    registration.applicant?.email || registration.guardian?.email,
    fillTemplate(settings.templateReceived, name)
  );
}

export async function notifyRegistrationStatus(registration) {
  const settings = await getSettings();
  const name = registration.applicant?.fullName;
  const template =
    registration.status === 'approved' ? settings.templateApproved : settings.templateRejected;
  await deliver(
    settings,
    registration.applicant?.phone,
    registration.applicant?.email || registration.guardian?.email,
    fillTemplate(template, name)
  );
}

export async function notifyUniformRequest(request) {
  await addNotification({
    category: 'Uniform',
    title: 'New Uniform Request',
    description: `${request.memberName} requested ${request.totalYards} yds fabric (${request.memberChurch}).`,
    link: '/admin/uniform-requests',
    church: request.memberChurch,
  });
}
