import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all records
    let allRecords = [];
    let offset = 0;
    const batchSize = 100;
    while (true) {
      const batch = await base44.asServiceRole.entities.EventRequest.list('-created_date', batchSize, offset);
      if (!batch || batch.length === 0) break;
      allRecords = allRecords.concat(batch);
      if (batch.length < batchSize) break;
      offset += batchSize;
    }

    // Group by dedup key: email + event_date + event_type (normalized)
    const seen = new Map();
    const toDelete = [];

    // Sort by submitted_date or created_date ascending so we keep the earliest entry
    allRecords.sort((a, b) => {
      const aDate = a.submitted_date || a.created_date || '';
      const bDate = b.submitted_date || b.created_date || '';
      return aDate.localeCompare(bDate);
    });

    for (const record of allRecords) {
      const key = [
        (record.email || '').toLowerCase().trim(),
        record.event_date || '',
        (record.event_type || '').toLowerCase().trim(),
      ].join('|');

      if (seen.has(key)) {
        toDelete.push(record.id);
      } else {
        seen.set(key, record.id);
      }
    }

    // Delete duplicates with small delay to avoid rate limits
    let deleted = 0;
    for (const id of toDelete) {
      await base44.asServiceRole.entities.EventRequest.delete(id);
      deleted++;
      await new Promise(r => setTimeout(r, 80));
    }

    return Response.json({
      success: true,
      total_fetched: allRecords.length,
      duplicates_deleted: deleted,
      remaining: allRecords.length - deleted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});