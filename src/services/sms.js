const SMS_URL = 'https://api.smsonlinegh.com/v5/message/sms/send';

function normalizeGhanaNumber(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  return digits;
}

export async function sendSms(phone, text) {
  const key = process.env.SMSONLINEGH_API_KEY;
  const destination = normalizeGhanaNumber(phone);
  if (!key) {
    console.warn('[sms] SMSONLINEGH_API_KEY is not set; skipping SMS');
    return { skipped: true };
  }
  if (!destination) {
    return { skipped: true, reason: 'invalid-phone' };
  }

  const response = await fetch(SMS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Host: 'api.smsonlinegh.com',
      Authorization: `key ${key}`,
    },
    body: JSON.stringify({
      text,
      type: 0,
      sender: process.env.SMS_SENDER || 'FALCONS',
      destinations: [destination],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[sms] SMSOnlineGH request failed', data);
    throw new Error(data.message || 'Failed to send SMS');
  }
  return data;
}
