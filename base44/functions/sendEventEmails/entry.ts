import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SENDER_EMAIL = 'events@pilatesinpinkstudio.com';
const OWNER_EMAIL = 'info@pilatesinpinkstudio.com';

function encodeHeader(str) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function buildRaw({ to, bcc, subject, html, replyTo, inReplyTo, references }) {
  const lines = [
    `From: ${encodeHeader('Pilates in Pink ™')} <${SENDER_EMAIL}>`,
  ];
  if (replyTo) lines.push(`Reply-To: ${encodeHeader('Pilates in Pink ™')} <${replyTo}>`);
  lines.push(`To: ${to}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  lines.push(
    `Subject: ${encodeHeader(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
  );
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push('', html);
  return btoa(unescape(encodeURIComponent(lines.join('\r\n'))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(accessToken, { to, bcc, subject, html, replyTo, inReplyTo, references, threadId }) {
  const raw = buildRaw({ to, bcc, subject, html, replyTo, inReplyTo, references });
  const payload = { raw };
  if (threadId) payload.threadId = threadId;
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function fetchSentMeta(accessToken, gmailId) {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailId}?format=metadata&metadataHeaders=Message-ID`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!res.ok) return {};
    const msg = await res.json();
    const headers = msg.payload?.headers || [];
    return {
      threadId: msg.threadId,
      rfcMessageId: headers.find(h => h.name.toLowerCase() === 'message-id')?.value || null,
    };
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { form, record_id, app_url } = await req.json();

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const guestNote = form.number_of_guests > 9
    ? `<p style="margin:4px 0;font-size:12px;color:#e86c84;">⚠️ Group larger than 9 — multiple sessions may be needed</p>`
    : '';

  // ── Email to SUBMITTER ──────────────────────────────────────
  const submitterHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fce4ec;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fce4ec;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f1889b,#e86c84);border-radius:20px 20px 0 0;padding:40px 32px;text-align:center;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
            width="64" height="64" style="margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
          <h1 style="color:white;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Thank You, ${form.full_name}! 💕</h1>
          <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:15px;">Your event request has been received</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:rgba(255,255,255,0.95);padding:32px;">
          <p style="color:#7a4a3a;font-size:15px;line-height:1.6;margin:0 0 24px;">
            We're thrilled you're considering <strong>Pilates in Pink™ Studio</strong> for your <strong>${form.event_type}</strong>! 
            Our team will review your request and get back to you within <strong>24 hours</strong> to confirm availability and next steps.
          </p>

          <!-- Summary Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">📋 Your Request Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr>
                  <td style="padding:6px 0;color:#a07878;width:45%;">Event Type</td>
                  <td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.event_type}</td>
                </tr>
                <tr style="background:rgba(241,136,155,0.05);">
                  <td style="padding:6px 0;color:#a07878;">Preferred Date</td>
                  <td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.event_date}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#a07878;">Number of Guests</td>
                  <td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.number_of_guests}</td>
                </tr>
                ${form.time_slot ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;">Time Slot</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.time_slot}</td></tr>` : ''}
                ${form.duration ? `<tr><td style="padding:6px 0;color:#a07878;">Duration</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.duration}</td></tr>` : ''}
                ${form.preferred_times ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;">Preferred Time(s)</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.preferred_times}</td></tr>` : ''}
                ${form.selected_classes?.length ? `<tr><td style="padding:6px 0;color:#a07878;vertical-align:top;">Classes</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.selected_classes.join('<br/>')}</td></tr>` : ''}
                ${form.add_ons?.length ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;vertical-align:top;">Add-Ons</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.add_ons.join('<br/>')}</td></tr>` : ''}
                ${form.budget ? `<tr><td style="padding:6px 0;color:#a07878;">Budget</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.budget}</td></tr>` : ''}
                ${form.notes ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;vertical-align:top;">Notes</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${form.notes}</td></tr>` : ''}
              </table>
            </td></tr>
          </table>

          <!-- What happens next -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:14px;border:1px solid #bbf7d0;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">✅ What Happens Next</p>
              <ol style="margin:0;padding-left:18px;color:#4a7a5a;font-size:14px;line-height:2;">
                <li>Our team reviews your request within <strong>24 hours</strong></li>
                <li>We confirm availability for your preferred date</li>
                <li>You'll receive a personalized quote &amp; booking details</li>
                <li>Once confirmed, we send all the event day info!</li>
              </ol>
            </td></tr>
          </table>

          <!-- Please note -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f9;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">📌 Please Note</p>
              <ul style="margin:0;padding-left:18px;color:#9a5a6a;font-size:13px;line-height:2;">
                <li>Each session accommodates up to 9 guests and lasts 50 minutes</li>
                <li>Booking is subject to studio availability and written confirmation</li>
                <li>Only in-house décor company is permitted for event decorations</li>
                <li>No outside food or catering is permitted in the studio</li>
              </ul>
            </td></tr>
          </table>

          <p style="color:#a07878;font-size:14px;text-align:center;margin:0;">
            Questions? Reply to this email or reach us at 
            <a href="mailto:events@pilatesinpinkstudio.com" style="color:#f1889b;text-decoration:none;">events@pilatesinpinkstudio.com</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:linear-gradient(135deg,#f1889b,#e86c84);border-radius:0 0 20px 20px;padding:24px 32px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:13px;font-weight:600;">Pilates in Pink™ Studio</p>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:12px;">We can't wait to create something beautiful with you 💕</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Email to OWNER ──────────────────────────────────────────
  const ownerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fce4ec;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fce4ec;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f1889b,#e86c84);border-radius:20px 20px 0 0;padding:32px;text-align:center;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
            width="56" height="56" style="display:block;margin:0 auto 12px;" />
          <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">🎉 New Event Request!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${form.event_type} — ${form.full_name}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:rgba(255,255,255,0.97);padding:32px;">

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:12px;border:1px solid #ffc107;margin-bottom:24px;">
            <tr><td style="padding:14px 20px;">
              <p style="margin:0;font-size:14px;color:#856404;">
                ⚡ <strong>Action Required:</strong> Please review and respond to this request within 24 hours.
              </p>
            </td></tr>
          </table>

          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">👤 Contact Information</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:20px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr><td style="padding:5px 0;color:#a07878;width:40%;">Full Name</td><td style="padding:5px 0;font-weight:700;color:#5a3535;font-size:15px;">${form.full_name}</td></tr>
                <tr style="background:rgba(241,136,155,0.05);"><td style="padding:5px 0;color:#a07878;">Email</td><td style="padding:5px 0;font-weight:600;color:#5a3535;"><a href="mailto:${form.email}" style="color:#f1889b;text-decoration:none;">${form.email}</a></td></tr>
                <tr><td style="padding:5px 0;color:#a07878;">Phone</td><td style="padding:5px 0;font-weight:600;color:#5a3535;"><a href="tel:${form.phone}" style="color:#f1889b;text-decoration:none;">${form.phone || '—'}</a></td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">📅 Event Details</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:20px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr><td style="padding:5px 0;color:#a07878;width:40%;">Event Type</td><td style="padding:5px 0;font-weight:700;color:#5a3535;">${form.event_type}</td></tr>
                <tr style="background:rgba(241,136,155,0.05);"><td style="padding:5px 0;color:#a07878;">Preferred Date</td><td style="padding:5px 0;font-weight:700;color:#e86c84;">${form.event_date}</td></tr>
                ${form.preferred_times ? `<tr><td style="padding:5px 0;color:#a07878;">Preferred Time(s)</td><td style="padding:5px 0;font-weight:600;color:#5a3535;">${form.preferred_times}</td></tr>` : ''}
                <tr style="background:rgba(241,136,155,0.05);"><td style="padding:5px 0;color:#a07878;">Number of Guests</td><td style="padding:5px 0;font-weight:700;color:#5a3535;">${form.number_of_guests} guests${guestNote}</td></tr>
                ${form.time_slot ? `<tr><td style="padding:5px 0;color:#a07878;">Time Slot</td><td style="padding:5px 0;font-weight:600;color:#5a3535;">${form.time_slot}</td></tr>` : ''}
                ${form.duration ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:5px 0;color:#a07878;">Duration</td><td style="padding:5px 0;font-weight:600;color:#5a3535;">${form.duration}</td></tr>` : ''}
                ${form.additional_dates ? `<tr><td style="padding:5px 0;color:#a07878;">Additional Dates</td><td style="padding:5px 0;font-weight:600;color:#5a3535;">${form.additional_dates}</td></tr>` : ''}
              </table>
            </td></tr>
          </table>

          ${form.selected_classes?.length ? `
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">🧘 Selected Classes</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:20px;">
            <tr><td style="padding:16px 24px;">
              ${form.selected_classes.map(c => `<p style="margin:4px 0;font-size:14px;color:#5a3535;">• ${c}</p>`).join('')}
            </td></tr>
          </table>` : ''}

          ${form.add_ons?.length ? `
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">✨ Add-Ons Requested</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:20px;">
            <tr><td style="padding:16px 24px;">
              ${form.add_ons.map(a => `<p style="margin:4px 0;font-size:14px;color:#5a3535;">• ${a}</p>`).join('')}
            </td></tr>
          </table>` : ''}

          ${form.budget || form.notes ? `
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">💬 Budget & Notes</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${form.budget ? `<p style="margin:0 0 8px;font-size:14px;color:#a07878;">Budget: <strong style="color:#5a3535;">${form.budget}</strong></p>` : ''}
              ${form.notes ? `<p style="margin:0;font-size:14px;color:#5a3535;line-height:1.6;font-style:italic;">"${form.notes}"</p>` : ''}
            </td></tr>
          </table>` : ''}

          ${'__DASHBOARD_BUTTON__'}

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:linear-gradient(135deg,#f1889b,#e86c84);border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:12px;">Pilates in Pink™ Studio — Event Management System</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Look up the just-created EventRequest record so we can use its request # in the subject + dashboard deep-link.
  // Prefer the explicit record_id passed by the frontend; fall back to email+date lookup for safety.
  let record = null;
  if (record_id) {
    try { record = await base44.asServiceRole.entities.EventRequest.get(record_id); } catch { /* fall through */ }
  }
  if (!record) {
    const records = await base44.asServiceRole.entities.EventRequest.filter({ email: form.email, event_date: form.event_date }, '-created_date', 1);
    record = records?.[0];
  }

  // Assign a sequential ticket_number if this record doesn't have one yet
  let requestNumber = record?.ticket_number;
  if (record && !requestNumber) {
    const highest = await base44.asServiceRole.entities.EventRequest.filter({}, '-ticket_number', 1);
    const maxNum = highest?.[0]?.ticket_number || 0;
    requestNumber = maxNum + 1;
    await base44.asServiceRole.entities.EventRequest.update(record.id, { ticket_number: requestNumber });
    record.ticket_number = requestNumber;
  }

  const requestShortId = requestNumber || (record ? record.id.slice(-8) : 'NEW');
  const requestTag = `[Request #${requestShortId}]`;

  // Unified subject — used for BOTH the requestor email (To) and owner copy (Bcc).
  // Identical Message-ID + subject = Gmail groups owner's view of all client replies into one thread.
  const unifiedSubject = `🎉 ${requestTag} ${form.event_type} Event Request - ${form.full_name}`;
  const confirmationSubject = unifiedSubject;

  // Build dashboard deep-link button for owner email — always use production URL
  const PRODUCTION_URL = 'https://events.pilatesinpinkstudio.com';
  const dashboardUrl = record
    ? `${PRODUCTION_URL}/RequestDashboard?ticket=${record.id}&focus=compose`
    : null;
  const dashboardButton = dashboardUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#f1889b,#e86c84);color:white;text-decoration:none;padding:14px 28px;border-radius:50px;font-weight:700;font-size:14px;">
          ✉️ Reply to ${form.full_name} in Dashboard
        </a>
      </td></tr></table>`
    : `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px;">
        <a href="mailto:${form.email}?subject=Re: Your ${form.event_type} Request at Pilates in Pink Studio" style="display:inline-block;background:linear-gradient(135deg,#f1889b,#e86c84);color:white;text-decoration:none;padding:14px 28px;border-radius:50px;font-weight:700;font-size:14px;">
          ✉️ Reply to ${form.full_name}
        </a>
      </td></tr></table>`;

  const ownerHtmlFinal = ownerHtml.replace('__DASHBOARD_BUTTON__', dashboardButton);

  // 1) Send the welcome email to the requestor (BCC owner) FIRST so we can capture
  //    its Gmail threadId + RFC Message-ID.
  const submitterResult = await sendGmail(accessToken, {
    to: form.email,
    bcc: OWNER_EMAIL,
    subject: confirmationSubject,
    html: submitterHtml,
    replyTo: SENDER_EMAIL,
  });

  // Capture threading metadata from the submitter email so future replies stay in the same thread
  let threadMeta = {};
  if (submitterResult?.id) {
    threadMeta = await fetchSentMeta(accessToken, submitterResult.id);
  }

  // 2) Send the internal owner notification THREADED onto the welcome — Gmail will
  //    merge it into the same conversation on the owner's side, so future client
  //    replies (which thread off the welcome) appear alongside the owner notification
  //    in one unified thread.
  const ownerResult = await sendGmail(accessToken, {
    to: OWNER_EMAIL,
    subject: confirmationSubject,
    html: ownerHtmlFinal,
    inReplyTo: threadMeta.rfcMessageId || undefined,
    references: threadMeta.rfcMessageId || undefined,
    threadId: threadMeta.threadId || undefined,
  });

  // Log the initial confirmation email on the EventRequest record + create EmailMessage row
  if (record) {
    const existingLog = record.email_log || [];
    const updates = {
      email_log: [...existingLog, {
        sent_at: new Date().toISOString(),
        direction: 'initial',
        template_name: 'Auto-Confirmation',
        subject: confirmationSubject,
        body_html: submitterHtml,
        gmail_message_id: submitterResult?.id || null,
        rfc_message_id: threadMeta.rfcMessageId || null,
      }],
    };
    if (threadMeta.threadId) updates.gmail_thread_id = threadMeta.threadId;
    if (threadMeta.rfcMessageId) updates.gmail_root_message_id = threadMeta.rfcMessageId;

    await base44.asServiceRole.entities.EventRequest.update(record.id, updates);

    // Create EmailMessage row for the welcome bubble in the new thread UI
    if (submitterResult?.id) {
      await base44.asServiceRole.entities.EmailMessage.create({
        ticket_id: record.id,
        gmail_thread_id: threadMeta.threadId || null,
        gmail_message_id: submitterResult.id,
        rfc_message_id: threadMeta.rfcMessageId || null,
        direction: 'outbound',
        from_email: SENDER_EMAIL,
        from_name: 'Pilates in Pink ™',
        to_email: form.email,
        subject: confirmationSubject,
        body_html: submitterHtml,
        body_text: '',
        sent_by: 'system',
        sent_at: new Date().toISOString(),
        is_welcome: true,
        send_status: 'sent',
        read_by: [],
        read_at: [],
      });
    }
  }

  return Response.json({ success: true, submitterResult, ownerResult, threadMeta });
});