import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SENDER_EMAIL = 'events@pilatesinpinkstudio.com';
const SENDER_NAME = 'Pilates in Pink ™';
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

// One-time migration: convert EventRequest.email_log entries into EmailMessage rows.
// Idempotent — skips entries that already have a matching EmailMessage (by gmail_message_id, or by sent_at+ticket_id).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.email || !user.email.toLowerCase().endsWith(`@${STAFF_DOMAIN}`)) {
      return Response.json({ error: 'Forbidden — staff only' }, { status: 403 });
    }

    const tickets = await base44.asServiceRole.entities.EventRequest.list('-created_date', 1000);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const ticket of tickets) {
      const log = ticket.email_log || [];
      if (log.length === 0) continue;

      // Existing EmailMessage rows for this ticket
      const existing = await base44.asServiceRole.entities.EmailMessage.filter({ ticket_id: ticket.id }, null, 500);
      const existingByGmail = new Set(existing.map(e => e.gmail_message_id).filter(Boolean));
      const existingBySentAt = new Set(existing.map(e => e.sent_at).filter(Boolean));

      for (const entry of log) {
        // Skip if already migrated
        if (entry.gmail_message_id && existingByGmail.has(entry.gmail_message_id)) {
          totalSkipped++;
          continue;
        }
        if (entry.sent_at && existingBySentAt.has(entry.sent_at)) {
          totalSkipped++;
          continue;
        }

        // Determine direction
        let direction = 'outbound';
        let isWelcome = false;
        let fromEmail = SENDER_EMAIL;
        let fromName = SENDER_NAME;
        let toEmail = ticket.email;

        if (entry.direction === 'inbound') {
          direction = 'inbound';
          fromEmail = ticket.email;
          fromName = ticket.full_name || '';
          toEmail = SENDER_EMAIL;
        } else if (entry.direction === 'initial') {
          direction = 'outbound';
          isWelcome = true;
        }

        await base44.asServiceRole.entities.EmailMessage.create({
          ticket_id: ticket.id,
          gmail_thread_id: ticket.gmail_thread_id || null,
          gmail_message_id: entry.gmail_message_id || null,
          rfc_message_id: entry.rfc_message_id || null,
          direction,
          from_email: fromEmail,
          from_name: fromName,
          to_email: toEmail,
          subject: entry.subject || `[Ticket #${ticket.ticket_number || ticket.id.slice(-8)}] (migrated)`,
          body_html: entry.body_html || '',
          body_text: '',
          sent_by: direction === 'outbound' ? (user.email) : null,
          sent_at: entry.sent_at || ticket.created_date,
          is_welcome: isWelcome,
          send_status: direction === 'inbound' ? 'received' : 'sent',
          read_by: [user.email],
          read_at: [{ email: user.email, timestamp: new Date().toISOString() }],
        });
        totalCreated++;
      }
    }

    return Response.json({ success: true, tickets: tickets.length, created: totalCreated, skipped: totalSkipped });
  } catch (error) {
    console.error('migrateEmailLog error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});