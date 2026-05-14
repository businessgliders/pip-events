// DISABLED: This endpoint is no longer in use.
// Inbound email is handled via the Gmail connector + ingestGmailReply.
// This handler is kept as a stub returning 410 Gone so that any stale
// webhooks pointed at this URL fail closed and cannot be used to spoof
// inbound communications.
Deno.serve(() => {
  return Response.json(
    { error: 'This endpoint has been retired. Inbound email is handled via the Gmail connector.' },
    { status: 410 }
  );
});