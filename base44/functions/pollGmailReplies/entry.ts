import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // List recent inbound messages (last hour, not in sent)
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' +
        encodeURIComponent('newer_than:1h -in:sent in:inbox') +
        '&maxResults=50',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      return Response.json({ error: 'Gmail list failed', details: err }, { status: 500 });
    }

    const list = await listRes.json();
    const allIds = (list.messages || []).map(m => m.id);

    if (allIds.length === 0) {
      return Response.json({ success: true, polled: 0, new: 0 });
    }

    // Filter out IDs we've already ingested
    const newIds = [];
    for (const id of allIds) {
      const existing = await base44.asServiceRole.entities.EmailMessage.filter({ gmail_message_id: id }, null, 1);
      if (existing.length === 0) newIds.push(id);
    }

    if (newIds.length === 0) {
      return Response.json({ success: true, polled: allIds.length, new: 0 });
    }

    // Delegate to ingestGmailReply
    const ingestRes = await base44.asServiceRole.functions.invoke('ingestGmailReply', { message_ids: newIds });

    return Response.json({ success: true, polled: allIds.length, new: newIds.length, ingest: ingestRes });
  } catch (error) {
    console.error('pollGmailReplies error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});