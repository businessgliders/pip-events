import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // Pull all requests
    const all = await base44.asServiceRole.entities.EventRequest.list('-created_date', 5000);

    // Sort chronologically by submitted_date (fallback created_date), oldest first
    const sorted = [...all].sort((a, b) => {
      const da = new Date(a.submitted_date || a.created_date).getTime();
      const db = new Date(b.submitted_date || b.created_date).getTime();
      return da - db;
    });

    let nextNum = 1;
    let assigned = 0;
    let kept = 0;

    for (const r of sorted) {
      if (r.ticket_number) {
        // Preserve existing numbers, advance counter past them
        if (r.ticket_number >= nextNum) nextNum = r.ticket_number + 1;
        kept++;
        continue;
      }
      await base44.asServiceRole.entities.EventRequest.update(r.id, { ticket_number: nextNum });
      nextNum++;
      assigned++;
      // Small throttle to avoid rate limits
      await new Promise(res => setTimeout(res, 150));
    }

    return Response.json({
      success: true,
      total: sorted.length,
      assigned,
      kept_existing: kept,
      next_number: nextNum,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});