import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Pilates in Pink™ Studio <events@pilatesinpink.ca>';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { to, subject, html, requestId, logEntry } = await req.json();

  if (!to || !subject || !html) {
    return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      reply_to: 'reply@pilatesinpink.ca',
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    return Response.json({ error: result }, { status: 500 });
  }

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