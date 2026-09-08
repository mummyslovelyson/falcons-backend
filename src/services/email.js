import { Resend } from 'resend';

export async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email] RESEND_API_KEY is not set; skipping email');
    return { skipped: true };
  }
  if (!to) {
    return { skipped: true, reason: 'missing-recipient' };
  }

  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: process.env.MAIL_FROM || 'Hinterland Falcons <noreply@hinterlandfalcons.org>',
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error('[email] Resend failed', error);
    throw new Error(error.message || 'Failed to send email');
  }
  return data;
}
