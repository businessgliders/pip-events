// Public, unauthenticated endpoint that returns ONLY the minimum data needed
// to render the public calendar grid: { event_date, event_type }.
// No names, no emails, no notes, no PII of any kind.
//
// Why this exists: the EventRequest entity is now admin-only at the RLS layer
// (correct — it contains client PII). The public landing/calendar pages still
// need to show which dates have events and roughly what type. This function
// is the *only* way unauthenticated visitors can see calendar markers.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_STATUSES = ['Confirmed', 'Pending', 'In Conversations', 'New'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to bypass admin-only RLS, but project away all PII.
    const rows = await base44.asServiceRole.entities.EventRequest.list('-event_date', 500);

    const today = new Date().toISOString().slice(0, 10);
    const cleaned = rows
      .filter(r =>
        r.event_date &&
        r.event_date >= today &&
        ALLOWED_STATUSES.includes(r.status || 'New')
      )
      .map(r => ({
        event_date: r.event_date,
        event_type: r.event_type,
      }));

    return Response.json({ events: cleaned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});