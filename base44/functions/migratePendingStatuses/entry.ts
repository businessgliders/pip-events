// One-shot migration: convert legacy "Pending" status to either "New" or "In Conversations".
// Rule: if email_log has any entry with direction === 'outbound', mark "In Conversations".
//       Otherwise, mark "New".
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const all = [];
  let page = 1;
  while (true) {
    const batch = await base44.asServiceRole.entities.EventRequest.list('-created_date', 200, page);
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }

  const pending = all.filter(r => r.status === 'Pending');

  let toNew = 0;
  let toInConv = 0;

  for (const r of pending) {
    const log = r.email_log || [];
    const hasOutbound = log.some(e => e.direction === 'outbound');
    const newStatus = hasOutbound ? 'In Conversations' : 'New';
    await base44.asServiceRole.entities.EventRequest.update(r.id, { status: newStatus });
    if (newStatus === 'New') toNew += 1;
    else toInConv += 1;
    await new Promise(res => setTimeout(res, 80));
  }

  return Response.json({
    success: true,
    totalScanned: all.length,
    pendingFound: pending.length,
    migratedToNew: toNew,
    migratedToInConversations: toInConv,
  });
});