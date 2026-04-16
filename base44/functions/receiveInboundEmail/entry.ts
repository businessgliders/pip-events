import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Log full payload for debugging
  console.log('Inbound payload:', JSON.stringify(payload));

  // Resend inbound webhook payload shape:
  // { type: "email.received", data: { from, to, subject, html, text, headers, ... } }
  const data = payload?.data || payload;

  const fromRaw = data?.from || '';
  const subject = data?.subject || '(no subject)';
  // Resend may send html or text body
  const textFallback = data?.text ? '<pre style="white-space:pre-wrap;font-family:sans-serif;">' + data.text + '</pre>' : '';
  const bodyHtml = data?.html || textFallback || '';

  console.log('Parsed - from:', fromRaw, 'subject:', subject, 'bodyHtml length:', bodyHtml.length);

  // Extract sender email address from "Name <email>" format
  const emailMatch = fromRaw.match(/<(.+?)>/) || [null, fromRaw];
  const fromEmail = emailMatch[1]?.trim().toLowerCase();

  if (!fromEmail) {
    return Response.json({ error: 'Could not parse sender email' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // Find EventRequest records matching this sender email
  const records = await base44.asServiceRole.entities.EventRequest.filter({ email: fromEmail });

  if (!records || records.length === 0) {
    // No matching request found — still return 200 so Resend doesn't retry
    console.log(`No EventRequest found for inbound email from: ${fromEmail}`);
    return Response.json({ success: true, matched: false });
  }

  // Sort by most recent event_date to find the most relevant request
  const sorted = records.sort((a, b) => {
    const aDate = a.event_date || a.submitted_date || a.created_date || '';
    const bDate = b.event_date || b.submitted_date || b.created_date || '';
    return bDate.localeCompare(aDate);
  });

  const record = sorted[0];
  const existingLog = record.email_log || [];

  await base44.asServiceRole.entities.EventRequest.update(record.id, {
    email_log: [...existingLog, {
      sent_at: new Date().toISOString(),
      direction: 'inbound',
      template_name: 'Reply from Client',
      subject,
      body_html: bodyHtml,
      from: fromRaw,
    }],
  });

  console.log(`Logged inbound email from ${fromEmail} to request ${record.id}`);
  return Response.json({ success: true, matched: true, requestId: record.id });
});