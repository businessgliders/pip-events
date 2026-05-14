import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

const STYLE_GUIDE = `Tone: warm, friendly, professional. Pilates in Pink is a boutique pink-themed Pilates studio offering private events, bridal showers, bachelorette parties, and corporate wellness experiences.
- Keep replies concise (2-4 short paragraphs max).
- Address the client by their first name when known.
- Sign off as the staff member writing (signature added separately — do NOT include a sign-off block).
- Never invent facts about pricing, schedules, or terms — defer to confirming details if unsure.
- Use plain HTML with <p> tags only. No headers, no inline styles.`;

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function buildThreadContext(base44, ticket) {
  const messages = await base44.asServiceRole.entities.EmailMessage.filter({ ticket_id: ticket.id }, 'sent_at', 200);
  const lines = [];
  lines.push(`=== EVENT INQUIRY (Ticket #${ticket.ticket_number || ticket.id.slice(-8)}) ===`);
  lines.push(`Client: ${ticket.full_name} <${ticket.email}>`);
  lines.push(`Event type: ${ticket.event_type || '-'}`);
  lines.push(`Event date: ${ticket.event_date || '-'}`);
  lines.push(`Guests: ${ticket.number_of_guests || '-'}`);
  lines.push(`Time slot: ${ticket.time_slot || '-'}`);
  lines.push(`Duration: ${ticket.duration || '-'}`);
  lines.push(`Classes: ${(ticket.selected_classes || []).join(', ') || '-'}`);
  lines.push(`Add-ons: ${(ticket.add_ons || []).join(', ') || '-'}`);
  lines.push(`Budget: ${ticket.budget || '-'}`);
  lines.push(`Notes: ${ticket.notes || '-'}`);
  lines.push('');
  lines.push('=== EMAIL THREAD ===');
  for (const m of messages) {
    const who = m.direction === 'inbound' ? `Client (${m.from_name || m.from_email})` : `Staff (${m.sent_by || 'team'})`;
    lines.push(`--- ${who} · ${m.sent_at || ''} ---`);
    lines.push(`Subject: ${m.subject || ''}`);
    lines.push(stripHtml(m.body_html || m.body_text || '').slice(0, 1500));
    lines.push('');
  }
  return { context: lines.join('\n'), messageCount: messages.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { mode, ticket_id, description, draft, force_refresh } = await req.json();
    if (!mode || !ticket_id) return Response.json({ error: 'Missing mode or ticket_id' }, { status: 400 });

    const ticket = await base44.asServiceRole.entities.EventRequest.get(ticket_id);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });

    const { context, messageCount } = await buildThreadContext(base44, ticket);

    if (mode === 'suggest') {
      // Check cache
      if (
        !force_refresh &&
        Array.isArray(ticket.ai_suggestions) &&
        ticket.ai_suggestions.length > 0 &&
        ticket.ai_suggestions_message_count === messageCount
      ) {
        return Response.json({
          suggestions: ticket.ai_suggestions,
          cached: true,
          generated_at: ticket.ai_suggestions_generated_at,
        });
      }

      const prompt = `${STYLE_GUIDE}\n\n${context}\n\n=== TASK ===\nGenerate EXACTLY 3 distinct reply suggestions for the staff to send to this client. Each suggestion must take a different angle:\n1. Direct/Quick — short, decisive answer\n2. Detailed/Thorough — covers everything, asks clarifying questions\n3. Warm/Relational — leads with warmth and rapport-building\n\nReturn JSON matching the schema. Each body_html must be valid HTML with <p> tags only.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  body_html: { type: 'string' },
                },
                required: ['label', 'body_html'],
              },
            },
          },
          required: ['suggestions'],
        },
      });

      const suggestions = result?.suggestions || [];
      const generatedAt = new Date().toISOString();

      await base44.asServiceRole.entities.EventRequest.update(ticket_id, {
        ai_suggestions: suggestions,
        ai_suggestions_generated_at: generatedAt,
        ai_suggestions_message_count: messageCount,
      });

      return Response.json({ suggestions, cached: false, generated_at: generatedAt });
    }

    if (mode === 'compose') {
      if (!description) return Response.json({ error: 'description required for compose' }, { status: 400 });
      const prompt = `${STYLE_GUIDE}\n\n${context}\n\n=== TASK ===\nThe staff member wants to convey this in their reply: "${description}"\n\nWrite the full email body in HTML (<p> tags only, no sign-off block). Return JSON: { "body_html": "..." }`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { body_html: { type: 'string' } },
          required: ['body_html'],
        },
      });
      return Response.json({ body_html: result?.body_html || '' });
    }

    if (mode === 'polish') {
      if (!draft) return Response.json({ error: 'draft required for polish' }, { status: 400 });
      const prompt = `${STYLE_GUIDE}\n\n${context}\n\n=== TASK ===\nPolish the following draft for grammar, tone, and flow while preserving the staff member's intent and key facts. Do not add or invent new information.\n\nDRAFT:\n${draft}\n\nReturn JSON: { "body_html": "..." } with <p> tags only.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { body_html: { type: 'string' } },
          required: ['body_html'],
        },
      });
      return Response.json({ body_html: result?.body_html || '' });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('aiEmailAssist error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});