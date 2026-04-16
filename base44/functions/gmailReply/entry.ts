import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

const DEFAULT_SIGNATURE = `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f7b1bd;">
  <img src="${LOGO_URL}" width="40" style="display:block;margin-bottom:6px;" />
  <span style="font-size:13px;font-weight:600;color:#b67651;">Pilates in Pink™ Studio</span>
</div>`;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { to, subject, body, threadId, inReplyTo, references, requestId } = await req.json();

  // Fetch signature from AppSettings
  let signature = DEFAULT_SIGNATURE;
  const settings = await base44.asServiceRole.entities.AppSettings.filter({ key: 'signature' });
  if (settings?.[0]?.value) {
    signature = `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f7b1bd;">${settings[0].value}</div>`;
  }

  const fullHtml = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    ${body.replace(/\n/g, '<br/>')}
    ${signature}
  </div>`;

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  // Build RFC 2822 message
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
  ];
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push('', fullHtml);

  const raw = btoa(unescape(encodeURIComponent(lines.join('\r\n'))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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

  const result = await res.json();
  if (!res.ok) return Response.json({ error: result }, { status: 500 });

  // Log to EventRequest email_log
  if (requestId) {
    const record = await base44.asServiceRole.entities.EventRequest.get(requestId);
    if (record) {
      const existingLog = record.email_log || [];
      await base44.asServiceRole.entities.EventRequest.update(requestId, {
        email_log: [...existingLog, {
          sent_at: new Date().toISOString(),
          direction: 'outbound',
          template_name: 'Gmail Reply',
          subject,
          body_html: fullHtml,
        }],
      });
    }
  }

  return Response.json({ success: true, messageId: result.id });
});