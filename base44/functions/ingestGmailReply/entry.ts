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
    // Only treat as body if it's NOT an attachment (no filename)
    const isAttachment = !!part.filename && part.filename.length > 0;
    if (!isAttachment) {
      if (mime === 'text/html' && part.body?.data && !html) html = base64UrlDecode(part.body.data);
      else if (mime === 'text/plain' && part.body?.data && !text) text = base64UrlDecode(part.body.data);
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return { html, text };
}

function extractAttachmentParts(payload) {
  const out = [];
  function walk(part) {
    if (!part) return;
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      // Skip inline images embedded in HTML (Content-Disposition: inline with Content-ID)
      const headers = part.headers || [];
      const disposition = (headers.find(h => h.name.toLowerCase() === 'content-disposition')?.value || '').toLowerCase();
      const isInline = disposition.startsWith('inline');
      if (!isInline) {
        out.push({
          filename: part.filename,
          contentType: part.mimeType || 'application/octet-stream',
          attachmentId: part.body.attachmentId,
          size: part.body.size || 0,
        });
      }
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return out;
}

async function downloadAndUploadAttachment(base44, accessToken, messageId, att) {
  // Fetch attachment bytes from Gmail
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${att.attachmentId}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Gmail attachment fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data.data) throw new Error('No attachment data returned');

  // base64url -> binary -> Blob -> File
  const b64 = data.data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: att.contentType });
  const file = new File([blob], att.filename, { type: att.contentType });

  const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  const fileUrl = uploadRes?.file_url || uploadRes?.url || uploadRes?.data?.file_url || uploadRes?.data?.url;
  if (!fileUrl) throw new Error('UploadFile returned no url');

  return {
    filename: att.filename,
    url: fileUrl,
    content_type: att.contentType,
    size: att.size,
  };
}

function parseFromHeader(value) {
  if (!value) return { name: '', email: '' };
  const m = value.match(/^"?([^"<]*)"?\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: '', email: value.trim() };
}

function extractTicketNumber(subject) {
  if (!subject) return null;
  // Only match our [Request #N] tag. We intentionally do NOT match the legacy
  // [Ticket #N] format because that string is also used by an unrelated external
  // support system that shares the same Gmail mailbox — matching it caused replies
  // from that system to be misattached to our event-request tickets.
  const m = subject.match(/\[Request #([A-Za-z0-9]+)\]/);
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

  // NOTE: We intentionally do NOT fall back to "match by from email". That fallback
  // is unsafe — any returning client's stray email (or an unrelated email from a
  // shared mailbox) would get attached to their most recent ticket, causing
  // misattribution. If we can't match via [Request #N] tag, In-Reply-To, or
  // thread_id, we drop the message rather than guess.

  if (!parentId) {
    stats.dropped++;
    return;
  }

  const { html, text } = extractBodies(msg.payload);
  const sentAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

  // Extract & upload attachments (skip inline images)
  const attachmentParts = extractAttachmentParts(msg.payload);
  const uploadedAttachments = [];
  for (const part of attachmentParts) {
    try {
      const uploaded = await downloadAndUploadAttachment(base44, accessToken, messageId, part);
      uploadedAttachments.push(uploaded);
    } catch (e) {
      console.error('attachment upload failed', part.filename, e);
    }
  }

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
    attachments: uploadedAttachments,
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

    // Auth: accept EITHER an authenticated admin user OR a matching shared secret.
    // The secret may come from query string, x-webhook-secret header, or the
    // request body (service-role function invocations from pollGmailReplies use the body).
    const url = new URL(req.url);
    const providedSecret =
      url.searchParams.get('secret') ||
      req.headers.get('x-webhook-secret') ||
      body.secret;
    const expectedSecret = Deno.env.get('WEBHOOK_SHARED_SECRET');
    const secretMatches = !!expectedSecret && providedSecret === expectedSecret;

    if (!secretMatches) {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
      }
    }

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