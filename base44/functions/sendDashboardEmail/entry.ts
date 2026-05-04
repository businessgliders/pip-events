import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function encodeHeader(str) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function buildRawWithAttachments({ to, subject, html, attachments, inReplyTo, references }) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const lines = [
    `From: ${encodeHeader('Events Pilates in Pink™')} <info@pilatesinpinkstudio.com>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ];

  // Threading headers
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);

  lines.push('');
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: text/html; charset=utf-8`);
  lines.push(`Content-Transfer-Encoding: quoted-printable`);
  lines.push('');
  lines.push(html);

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push('');
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

  // Look up the request to find the existing Gmail thread (so reply lands in same thread)
  let threadId = null;
  let inReplyTo = null;
  let references = null;
  let finalSubject = subject;

  if (requestId) {
    const record = await base44.asServiceRole.entities.EventRequest.get(requestId);
    if (record) {
      threadId = record.gmail_thread_id || null;

      // Build References chain: root + all known message IDs in order
      const log = record.email_log || [];
      const allMsgIds = [];
      if (record.gmail_root_message_id) allMsgIds.push(record.gmail_root_message_id);
      for (const entry of log) {
        if (entry.rfc_message_id && !allMsgIds.includes(entry.rfc_message_id)) {
          allMsgIds.push(entry.rfc_message_id);
        }
      }

      if (allMsgIds.length > 0) {
        // In-Reply-To = the most recent message id in the chain
        inReplyTo = allMsgIds[allMsgIds.length - 1];
        references = allMsgIds.join(' ');
      }

      // Force "Re: " prefix on subject when threading (matches Gmail's threading heuristic)
      if (threadId && !/^re:\s/i.test(subject)) {
        finalSubject = `Re: ${subject}`;
      }
    }
  }

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const raw = buildRawWithAttachments({
    to,
    subject: finalSubject,
    html,
    attachments: attachments || [],
    inReplyTo,
    references,
  });

  const payload = { raw };
  if (threadId) payload.threadId = threadId;

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await sendRes.json();
  if (!sendRes.ok) return Response.json({ error: result }, { status: 500 });

  // Fetch the sent message to capture the RFC Message-ID header (for future threading)
  let sentMessageIdHeader = null;
  let sentThreadId = result.threadId || threadId;
  try {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${result.id}?format=metadata&metadataHeaders=Message-ID`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (msgRes.ok) {
      const msg = await msgRes.json();
      const headers = msg.payload?.headers || [];
      sentMessageIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id')?.value || null;
      sentThreadId = msg.threadId || sentThreadId;
    }
  } catch (e) {
    console.warn('Could not fetch sent message metadata', e);
  }

  // Log to EventRequest email_log if requestId provided
  if (requestId && logEntry) {
    const record = await base44.asServiceRole.entities.EventRequest.get(requestId);
    if (record) {
      const existingLog = record.email_log || [];
      const enrichedLog = {
        ...logEntry,
        subject: finalSubject,
        gmail_message_id: result.id,
        rfc_message_id: sentMessageIdHeader,
      };

      const updates = { email_log: [...existingLog, enrichedLog] };

      // Backfill gmail_thread_id and gmail_root_message_id on the record if missing
      if (!record.gmail_thread_id && sentThreadId) {
        updates.gmail_thread_id = sentThreadId;
      }
      if (!record.gmail_root_message_id && sentMessageIdHeader) {
        updates.gmail_root_message_id = sentMessageIdHeader;
      }

      // Auto-progress status: if currently "New", flip to "In Conversations"
      // when the studio sends an outbound (non-auto-confirmation) email.
      if (record.status === 'New' || !record.status) {
        updates.status = 'In Conversations';
      }

      await base44.asServiceRole.entities.EventRequest.update(requestId, updates);
    }
  }

  return Response.json({ success: true, result, threadId: sentThreadId });
});