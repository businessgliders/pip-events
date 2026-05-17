import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SENDER_EMAIL = 'events@pilatesinpinkstudio.com';
const SENDER_NAME = 'Pilates in Pink ™';
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

function encodeRfc2047(str) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function toQuotedPrintable(str) {
  // Basic QP: encode non-ASCII + soft-wrap long lines
  const encoded = unescape(encodeURIComponent(str)).replace(/([^\x20-\x7E\n])/g, (m) =>
    '=' + m.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
  );
  // Soft line breaks every 75 chars
  return encoded.replace(/(.{1,75})(?=.)/g, '$1=\r\n');
}

function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(p|div|br|h[1-6]|li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function chunkBase64(b64, size = 76) {
  return b64.replace(new RegExp(`(.{1,${size}})`, 'g'), '$1\r\n').trim();
}

async function fetchAttachmentBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch attachment: ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  return { base64: btoa(bin), contentType };
}

function buildMime({ to, subject, htmlBody, textBody, inReplyTo, references, attachments = [] }) {
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const mixedBoundary = `mix_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const hasAttachments = attachments && attachments.length > 0;

  const lines = [
    `From: ${encodeRfc2047(SENDER_NAME)} <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${encodeRfc2047(subject)}`,
    `MIME-Version: 1.0`,
  ];
  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
  } else {
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
  }
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push('');

  if (hasAttachments) {
    lines.push(`--${mixedBoundary}`);
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    lines.push('');
  }

  // Alternative part (plain + html)
  lines.push(`--${altBoundary}`);
  lines.push(`Content-Type: text/plain; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: quoted-printable`);
  lines.push('');
  lines.push(toQuotedPrintable(textBody));

  lines.push(`--${altBoundary}`);
  lines.push(`Content-Type: text/html; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: quoted-printable`);
  lines.push('');
  lines.push(toQuotedPrintable(htmlBody));

  lines.push(`--${altBoundary}--`);

  // Attachments
  if (hasAttachments) {
    for (const att of attachments) {
      lines.push(`--${mixedBoundary}`);
      lines.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push('');
      lines.push(chunkBase64(att.base64));
    }
    lines.push(`--${mixedBoundary}--`);
  }

  return lines.join('\r\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { ticket_id, body_html, is_welcome, attachments: attachmentInputs } = await req.json();
    if (!ticket_id || !body_html) {
      return Response.json({ error: 'Missing ticket_id or body_html' }, { status: 400 });
    }

    // Fetch attachments and base64-encode them (server-side, so we have raw bytes)
    const attachments = [];
    const attachmentMeta = []; // for storing on EmailMessage record
    if (Array.isArray(attachmentInputs)) {
      for (const att of attachmentInputs) {
        if (!att?.url || !att?.filename) continue;
        const { base64, contentType } = await fetchAttachmentBase64(att.url);
        const resolvedType = att.contentType || contentType;
        attachments.push({
          filename: att.filename,
          contentType: resolvedType,
          base64,
        });
        attachmentMeta.push({
          filename: att.filename,
          url: att.url,
          content_type: resolvedType,
          size: att.size || null,
        });
      }
    }

    const ticket = await base44.asServiceRole.entities.EventRequest.get(ticket_id);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });

    // Look up prior messages to find existing thread + references chain
    const prior = await base44.asServiceRole.entities.EmailMessage.filter(
      { ticket_id },
      'sent_at',
      500
    );

    // Anchor threading on the welcome email if one exists — guarantees assignment
    // emails land in the SAME Gmail conversation as the welcome + client replies.
    const welcomeEmail = prior.find(m => m.is_welcome && m.rfc_message_id) || null;

    const lastMsg = prior.length > 0 ? prior[prior.length - 1] : null;
    const threadId =
      welcomeEmail?.gmail_thread_id ||
      ticket.gmail_thread_id ||
      lastMsg?.gmail_thread_id ||
      null;

    // Build References chain — welcome's Message-ID first (root), then any later replies
    const msgIdChain = [];
    if (welcomeEmail?.rfc_message_id) msgIdChain.push(welcomeEmail.rfc_message_id);
    if (ticket.gmail_root_message_id && !msgIdChain.includes(ticket.gmail_root_message_id)) {
      msgIdChain.push(ticket.gmail_root_message_id);
    }
    for (const m of prior) {
      if (m.rfc_message_id && !msgIdChain.includes(m.rfc_message_id)) msgIdChain.push(m.rfc_message_id);
    }
    const inReplyTo = msgIdChain.length > 0 ? msgIdChain[msgIdChain.length - 1] : null;
    const references = msgIdChain.length > 0 ? msgIdChain.join(' ') : null;

    // Subject — prefer the welcome's exact subject (Gmail's strongest threading signal)
    const requestTag = `[Request #${ticket.ticket_number || ticket.id.slice(-8)}]`;
    const legacyTicketTag = `[Ticket #${ticket.ticket_number || ticket.id.slice(-8)}]`;
    const baseSubject = welcomeEmail?.subject || lastMsg?.subject;
    let subject;
    if (baseSubject) {
      const hasTag = baseSubject.includes(requestTag) || baseSubject.includes(legacyTicketTag);
      subject = hasTag ? baseSubject : `${requestTag} ${baseSubject}`;
      if (!/^re:\s/i.test(subject)) subject = `Re: ${subject}`;
    } else {
      subject = `🎉 ${requestTag} Your Pilates in Pink Event Inquiry`;
    }

    // Append signature unless welcome email
    let finalHtml = body_html;
    if (!is_welcome) {
      let signature = user.signature_html;
      if (!signature) {
        // Fallback: try to load full user record
        const userList = await base44.asServiceRole.entities.User.filter({ email: user.email });
        signature = userList?.[0]?.signature_html;
      }
      if (!signature) {
        signature = `<p style="margin-top:24px;color:#b67651;"><strong>${user.full_name || 'Pilates in Pink Team'}</strong><br/>Pilates in Pink ™ Studio</p>`;
      }
      finalHtml = `${body_html}<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f7b1bd;">${signature}</div>`;
    }

    const wrappedHtml = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;">${finalHtml}</div>`;
    const textBody = stripHtml(finalHtml);

    const mime = buildMime({
      to: ticket.email,
      subject,
      htmlBody: wrappedHtml,
      textBody,
      inReplyTo,
      references,
      attachments,
    });

    const raw = base64UrlEncode(mime);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const payload = { raw };
    if (threadId) payload.threadId = threadId;

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const sendResult = await sendRes.json();

    if (!sendRes.ok) {
      // Log failed send
      await base44.asServiceRole.entities.EmailMessage.create({
        ticket_id,
        direction: 'outbound',
        from_email: SENDER_EMAIL,
        from_name: SENDER_NAME,
        to_email: ticket.email,
        subject,
        body_html: finalHtml,
        body_text: textBody,
        sent_by: user.email,
        sent_at: new Date().toISOString(),
        is_welcome: !!is_welcome,
        send_status: 'failed',
        send_error: JSON.stringify(sendResult).slice(0, 500),
        attachments: attachmentMeta,
        read_by: [user.email],
      });
      return Response.json({ error: 'Gmail send failed', details: sendResult }, { status: 500 });
    }

    // Fetch Message-ID header
    let rfcMessageId = null;
    let actualThreadId = sendResult.threadId || threadId;
    try {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${sendResult.id}?format=metadata&metadataHeaders=Message-ID`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const headers = meta.payload?.headers || [];
        rfcMessageId = headers.find(h => h.name.toLowerCase() === 'message-id')?.value || null;
        actualThreadId = meta.threadId || actualThreadId;
      }
    } catch (e) {
      console.warn('Could not fetch message metadata', e);
    }

    // Create EmailMessage row
    const msgRow = await base44.asServiceRole.entities.EmailMessage.create({
      ticket_id,
      gmail_thread_id: actualThreadId,
      gmail_message_id: sendResult.id,
      rfc_message_id: rfcMessageId,
      in_reply_to: inReplyTo,
      references,
      direction: 'outbound',
      from_email: SENDER_EMAIL,
      from_name: SENDER_NAME,
      to_email: ticket.email,
      subject,
      body_html: finalHtml,
      body_text: textBody,
      sent_by: user.email,
      sent_at: new Date().toISOString(),
      is_welcome: !!is_welcome,
      send_status: 'sent',
      attachments: attachmentMeta,
      read_by: [user.email],
      read_at: [{ email: user.email, timestamp: new Date().toISOString() }],
    });

    // Backfill thread IDs on ticket if missing + auto-progress status
    const updates = {};
    if (!ticket.gmail_thread_id && actualThreadId) updates.gmail_thread_id = actualThreadId;
    if (!ticket.gmail_root_message_id && rfcMessageId) updates.gmail_root_message_id = rfcMessageId;
    // Auto-progress New → In Conversations only for genuine staff replies
    // (excludes welcome/auto-confirmation emails and any non-staff sender)
    const isStaffReply = !is_welcome && user.email && user.email.toLowerCase().endsWith(`@${STAFF_DOMAIN}`);
    if (isStaffReply && (ticket.status === 'New' || !ticket.status)) updates.status = 'In Conversations';
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.EventRequest.update(ticket_id, updates);
    }

    return Response.json({ success: true, message: msgRow });
  } catch (error) {
    console.error('sendTicketEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});