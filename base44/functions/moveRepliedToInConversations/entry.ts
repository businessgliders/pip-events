import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Increase list limit to fetch all
    const newTickets = await base44.asServiceRole.entities.EventRequest.list('-created_date', 5000);

    // Get all inbound messages
    const inboundMessages = await base44.asServiceRole.entities.EmailMessage.filter(
      { direction: 'inbound' },
      '-created_date',
      2000
    );

    // Extract ticket numbers from inbound message subjects: [Request #N]
    const repliedTicketNumbers = new Set();
    const repliedThreadIds = new Set();
    for (const m of inboundMessages) {
      const match = m.subject && m.subject.match(/\[Request #(\d+)\]/i);
      if (match) repliedTicketNumbers.add(Number(match[1]));
      if (m.gmail_thread_id) repliedThreadIds.add(m.gmail_thread_id);
    }

    // Match by ticket_number or thread_id
    const repliedTickets = newTickets.filter(t =>
      (t.ticket_number != null && repliedTicketNumbers.has(Number(t.ticket_number))) ||
      (t.gmail_thread_id && repliedThreadIds.has(t.gmail_thread_id))
    );
    const statusBreakdown = {};
    repliedTickets.forEach(t => {
      const key = `${t.status}${t.archived ? ' (archived)' : ''}`;
      statusBreakdown[key] = (statusBreakdown[key] || 0) + 1;
    });

    // Active tickets with replies — move to In Conversations unless already there/further
    const skipStatuses = new Set(['In Conversations', 'Confirmed', 'Hosted', 'Cancelled', 'Waiting for Payment']);
    const toUpdate = repliedTickets.filter(t =>
      !t.archived &&
      !skipStatuses.has(t.status)
    );

    // Update each to In Conversations
    let updated = 0;
    for (const t of toUpdate) {
      await base44.asServiceRole.entities.EventRequest.update(t.id, {
        status: 'In Conversations',
        status_history: [
          ...(t.status_history || []),
          {
            status: 'In Conversations',
            note: 'Auto-moved: client has replied',
            name: 'System',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      updated++;
    }

    return Response.json({
      ok: true,
      total_tickets_scanned: newTickets.length,
      inbound_messages: inboundMessages.length,
      replied_ticket_numbers: Array.from(repliedTicketNumbers),
      matched_tickets: repliedTickets.length,
      status_breakdown: statusBreakdown,
      updated,
      updated_ids: toUpdate.map(t => ({ id: t.id, name: t.full_name, ticket: t.ticket_number, prev_status: t.status })),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});