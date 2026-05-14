import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const all = await base44.asServiceRole.entities.EventRequest.list('-created_date', 5000);

    let updated = 0;
    let skipped = 0;

    for (const r of all) {
      if (r.submitted_date) {
        skipped++;
        continue;
      }
      // Best guess: use created_date as the submission time
      const guess = r.created_date;
      if (!guess) {
        skipped++;
        continue;
      }
      await base44.asServiceRole.entities.EventRequest.update(r.id, {
        submitted_date: new Date(guess).toISOString(),
      });
      updated++;
      await new Promise(res => setTimeout(res, 150));
    }

    return Response.json({ success: true, total: all.length, updated, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});