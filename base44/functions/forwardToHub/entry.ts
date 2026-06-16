// Forwards a newly-created EventRequest to the PiP Hub (Unified Inbox)
// so the front desk sees the inquiry as an events ticket.
//
// Fire-and-forget from the frontend right after EventRequest.create().
// Failures are logged but never thrown back to the caller — we never want
// the hub being down to block a client's event submission.

const HUB_INTAKE_URL =
  'https://pink-app-hub.base44.app/api/apps/69841af9c747b033a60780f2/functions/spokeIntake';

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('HUB_INTAKE_SECRET');
    if (!secret) {
      console.error('forwardToHub: HUB_INTAKE_SECRET not set');
      return Response.json({ error: 'Hub secret not configured' }, { status: 500 });
    }

    const { form = {} } = await req.json();

    // Build the hub payload. Spread `form` first so any extra event fields
    // flow through, then overlay the canonical fields the hub expects.
    const payload = {
      ...form,
      source_app: 'events',
      name: form.full_name || '',
      email: form.email || '',
      phone: form.phone || '',
      subject: form.event_type || 'Event Inquiry',
      event_type: form.event_type || '',
      event_date: form.event_date || '',
      guest_count: form.number_of_guests || 0,
      preferred_times: form.preferred_times || '',
      budget: form.budget || '',
      selected_classes: form.selected_classes || [],
      add_ons: form.add_ons || [],
      message: form.notes || '',
    };

    const res = await fetch(HUB_INTAKE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`forwardToHub: hub returned ${res.status} — ${text}`);
      return Response.json(
        { error: 'Hub rejected forward', status: res.status, body: text },
        { status: 502 }
      );
    }

    return Response.json({ success: true, hub_response: text });
  } catch (error) {
    console.error('forwardToHub error:', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});