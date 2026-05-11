import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SENDER_EMAIL = 'events@pilatesinpinkstudio.com';

function base64UrlDecode(str) {
  if (!str) return '';
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    try { return atob(padded); } catch { return ''; }
  }
}

function extractBodies(payload) {
  let html = '', text = '';
  function walk(part) {
    if (!part) return;
    const mime = part.mimeType || '';
    if (mime === 'text/html' && part.body?.data && !html) html = base64UrlDecode(part.body.data);
    else if (mime === 'text/plain' && part.body?.data && !text) text = base64UrlDecode(part.body.data);
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return { html, text };
}

function parseFromHeader(value) {
  if (!value) return { name: '', email: '' };
  const m = value.match(/^"?([^"<]*)"?\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: '', email: value.trim() };
}

function extractTicketNumber(subject) {
  if (!subject) return null;
  // Match new [Request #...] and legacy [Ticket #...] tags
  const m = subject.match(/\[(?:Request|Ticket) #([A-Za-z0-9]+)\]/);
  return m ? m[1] : null;
}

async function processOne(base44, accessToken, messageId, stats) {
  // Idempotency: skip if already ingested
  const existing = await base44.asServiceRole.entities.EmailMessage.filter({ gmail_message_id: messageId }, null, 1);
  if (existing.length > 0) {
    stats.duplicates++;
    return;
  }

  const msgRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  if (!msgRes.ok) {
    stats.fetch_failed++;
    return;
  }
  const msg = await msgRes.json();

  // Skip SENT-labeled messages (our own outbound)
  if ((msg.labelIds || []).includes('SENT')) {
    stats.skipped_sent++;
    return;
  }

  const headers = msg.payload?.headers || [];
  const getH = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Skip auto-replies / bulk
  const autoSub = getH('Auto-Submitted').toLowerCase();
  if (autoSub && autoSub !== 'no') {
    stats.skipped_auto++;
    return;
  }
  const precedence = getH('Precedence').toLowerCase();
  if (['bulk', 'auto_reply', 'list'].includes(precedence)) {
    stats.skipped_auto++;
    return;
  }

  const from = parseFromHeader(getH('From'));
  // Skip emails from our own sender (echoes)
  if (from.email.toLowerCase() === SENDER_EMAIL.toLowerCase()) {
    stats.skipped_self++;
    return;
  }

  const subject = getH('Subject');
  const inReplyTo = getH('In-Reply-To');
  const references = getH('References');
  const rfcMessageId = getH('Message-ID');
  const dateHeader = getH('Date');

  // Find parent EventRequest
  let parentId = null;

  // 1. By [Ticket #XYZ] tag
  const ticketTag = extractTicketNumber(subject);
  if (ticketTag) {
    // Try ticket_number (numeric)
    const asNum = parseInt(ticketTag, 10);
    if (!isNaN(asNum)) {
      const byNum = await base44.asServiceRole.entities.EventRequest.filter({ ticket_number: asNum }, null, 1);
      if (byNum[0]) parentId = byNum[0].id;
    }
    // Legacy: id.slice(-8)
    if (!parentId) {
      const allRecent = await base44.asServiceRole.entities.EventRequest.list('-created_date', 500);
      const match = allRecent.find(r => r.id.slice(-8) === ticketTag);
      if (match) parentId = match.id;
    }
  }

  // 2. Fallback: match In-Reply-To against existing EmailMessage.rfc_message_id
  if (!parentId && inReplyTo) {
    const matchMsgs = await base44.asServiceRole.entities.EmailMessage.filter({ rfc_message_id: inReplyTo }, null, 1);
    if (matchMsgs[0]?.ticket_id) parentId = matchMsgs[0].ticket_id;
  }

  // 3. Fallback: match by thread_id
  if (!parentId && msg.threadId) {
    const byThread = await base44.asServiceRole.entities.EmailMessage.filter({ gmail_thread_id: msg.threadId }, null, 1);
    if (byThread[0]?.ticket_id) parentId = byThread[0].ticket_id;
  }

  // 4. Final fallback: match by from email
  if (!parentId && from.email) {
    const byEmail = await base44.asServiceRole.entities.EventRequest.filter({ email: from.email }, '-created_date', 1);
    if (byEmail[0]) parentId = byEmail[0].id;
  }

  if (!parentId) {
    stats.dropped++;
    return;
  }

  const { html, text } = extractBodies(msg.payload);
  const sentAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

  await base44.asServiceRole.entities.EmailMessage.create({
    ticket_id: parentId,
    gmail_thread_id: msg.threadId,
    gmail_message_id: messageId,
    rfc_message_id: rfcMessageId,
    in_reply_to: inReplyTo,
    references,
    direction: 'inbound',
    from_email: from.email,
    from_name: from.name,
    to_email: SENDER_EMAIL,
    subject,
    body_html: html,
    body_text: text,
    snippet: msg.snippet || '',
    sent_at: sentAt,
    send_status: 'received',
    read_by: [],
    read_at: [],
  });

  // Auto-reopen if Completed/Cancelled
  const ticket = await base44.asServiceRole.entities.EventRequest.get(parentId);
  if (ticket && (ticket.status === 'Completed' || ticket.status === 'Cancelled')) {
    await base44.asServiceRole.entities.EventRequest.update(parentId, { status: 'In Conversations' });
  }

  stats.ingested++;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Accept either { message_ids: [...] } (poller) or { data: { new_message_ids: [...] } } (webhook)
    let ids = [];
    if (Array.isArray(body.message_ids)) ids = body.message_ids;
    else if (Array.isArray(body?.data?.new_message_ids)) ids = body.data.new_message_ids;

    if (ids.length === 0) {
      return Response.json({ success: true, ingested: 0, note: 'no message ids' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const stats = { ingested: 0, duplicates: 0, dropped: 0, skipped_sent: 0, skipped_auto: 0, skipped_self: 0, fetch_failed: 0 };
    for (const id of ids) {
      try {
        await processOne(base44, accessToken, id, stats);
      } catch (e) {
        console.error('process message failed', id, e);
        stats.fetch_failed++;
      }
    }

    return Response.json({ success: true, ...stats });
  } catch (error) {
    console.error('ingestGmailReply error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});