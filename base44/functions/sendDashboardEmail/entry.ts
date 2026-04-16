import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

function encodeHeader(str) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function buildRawWithAttachments({ to, subject, html, attachments }) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const lines = [
    `From: ${encodeHeader('Events Pilates in Pink™')} <info@pilatesinpinkstudio.com>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    '',
    html,
  ];

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      // att = { filename, mimeType, base64Data }
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push('');
      // Chunk base64 at 76 chars per line (RFC 2045)
      const chunks = att.base64Data.match(/.{1,76}/g) || [];
      lines.push(...chunks);
    }
  }

  lines.push(`--${boundary}--`);

  return btoa(unescape(encodeURIComponent(lines.join('\r\n'))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { to, subject, html, requestId, logEntry, attachments } = await req.json();

  if (!to || !subject || !html) {
    return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
  }

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const raw = buildRawWithAttachments({ to, subject, html, attachments: attachments || [] });

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  const result = await res.json();
  if (!res.ok) return Response.json({ error: result }, { status: 500 });

  // Log to EventRequest email_log if requestId provided
  if (requestId && logEntry) {
    const record = await base44.asServiceRole.entities.EventRequest.get(requestId);
    if (record) {
      const existingLog = record.email_log || [];
      await base44.asServiceRole.entities.EventRequest.update(requestId, {
        email_log: [...existingLog, logEntry],
      });
    }
  }

  return Response.json({ success: true, result });
});