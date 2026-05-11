import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.email?.toLowerCase().endsWith(`@${STAFF_DOMAIN}`)) {
      return Response.json({ error: 'Forbidden — staff only' }, { status: 403 });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const confirmed = await base44.asServiceRole.entities.EventRequest.filter({ status: 'Confirmed' }, '-event_date', 5000);

    let updated = 0;
    for (const r of confirmed) {
      if (r.event_date && r.event_date < today) {
        await base44.asServiceRole.entities.EventRequest.update(r.id, { status: 'Completed' });
        updated++;
        await new Promise(res => setTimeout(res, 120));
      }
    }

    return Response.json({ success: true, scanned: confirmed.length, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});