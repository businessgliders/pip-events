import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const body = await req.json();
  const base44 = createClientFromRequest(req);

  const messageIds = body.data?.new_message_ids ?? [];

  if (messageIds.length === 0) {
    return Response.json({ success: true, skipped: true });
  }

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  for (const messageId of messageIds) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: authHeader }
    );
    if (!res.ok) continue;

    const message = await res.json();
    const headers = message.payload?.headers || [];

    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('From');
    const subject = getHeader('Subject');
    const date = getHeader('Date');
    const messageIdHeader = getHeader('Message-ID');

    // Skip emails sent by us (outbound) — only process inbound from clients
    const fromEmail = (from.match(/<(.+?)>/) || [null, from])[1]?.trim().toLowerCase();
    if (!fromEmail) continue;

    // Find matching EventRequest by sender email
    const records = await base44.asServiceRole.entities.EventRequest.filter({ email: fromEmail });
    if (!records || records.length === 0) {
      console.log(`No EventRequest found for Gmail sender: ${fromEmail}`);
      continue;
    }

    // Pick most recent event
    const sorted = records.sort((a, b) => {
      const aDate = a.event_date || a.submitted_date || a.created_date || '';
      const bDate = b.event_date || b.submitted_date || b.created_date || '';
      return bDate.localeCompare(aDate);
    });
    const record = sorted[0];

    // Check if we already logged this message (avoid duplicates)
    const existingLog = record.email_log || [];
    const alreadyLogged = existingLog.some(e => e.gmail_message_id === messageId);
    if (alreadyLogged) continue;

    // Extract body
    let bodyHtml = '';
    const parts = message.payload?.parts || [];

    const findHtmlPart = (parts) => {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
        if (part.parts) {
          const nested = findHtmlPart(part.parts);
          if (nested) return nested;
        }
      }
      return null;
    };

    // Try parts first, then top-level body
    bodyHtml = findHtmlPart(parts);
    if (!bodyHtml && message.payload?.body?.data) {
      bodyHtml = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    if (!bodyHtml) bodyHtml = '<p>(No readable content)</p>';

    await base44.asServiceRole.entities.EventRequest.update(record.id, {
      email_log: [...existingLog, {
        sent_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        direction: 'inbound',
        template_name: 'Client Reply',
        subject,
        body_html: bodyHtml,
        from,
        gmail_message_id: messageId,
      }],
    });

    console.log(`Logged Gmail reply from ${fromEmail} to request ${record.id}`);
  }

  return Response.json({ success: true, processed: messageIds.length });
});