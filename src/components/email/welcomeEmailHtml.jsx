// Branded welcome email HTML used as a synthetic welcome bubble in the thread
// for legacy tickets that don't have a real EmailMessage row yet.
// Mirrors the actual auto-confirmation email sent by functions/sendEventEmails.
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

export function buildWelcomeHtml({ clientName, inquiryType, ticketShortId, ticket }) {
  const t = ticket || {};
  const guestNote = t.number_of_guests > 9
    ? `<p style="margin:4px 0;font-size:12px;color:#e86c84;">⚠️ Group larger than 9 — multiple sessions may be needed</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fce4ec;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fce4ec;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f1889b,#e86c84);border-radius:20px 20px 0 0;padding:40px 32px;text-align:center;">
          <img src="${LOGO_URL}" width="64" height="64" style="margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
          <h1 style="color:white;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Thank You, ${clientName || 'there'}! 💕</h1>
          <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:15px;">Your event request has been received</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:rgba(255,255,255,0.95);padding:32px;">
          <p style="color:#7a4a3a;font-size:15px;line-height:1.6;margin:0 0 24px;">
            We're thrilled you're considering <strong>Pilates in Pink™ Studio</strong> for your <strong>${inquiryType || 'event'}</strong>!
            Our team will review your request and get back to you within <strong>24 hours</strong> to confirm availability and next steps.
          </p>

          <!-- Summary Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f7;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">📋 Your Request Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr>
                  <td style="padding:6px 0;color:#a07878;width:45%;">Event Type</td>
                  <td style="padding:6px 0;font-weight:600;color:#5a3535;">${inquiryType || '—'}</td>
                </tr>
                ${t.event_date ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;">Preferred Date</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.event_date}</td></tr>` : ''}
                ${t.number_of_guests ? `<tr><td style="padding:6px 0;color:#a07878;">Number of Guests</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.number_of_guests}${guestNote}</td></tr>` : ''}
                ${t.time_slot ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;">Time Slot</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.time_slot}</td></tr>` : ''}
                ${t.duration ? `<tr><td style="padding:6px 0;color:#a07878;">Duration</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.duration}</td></tr>` : ''}
                ${t.preferred_times ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;">Preferred Time(s)</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.preferred_times}</td></tr>` : ''}
                ${t.selected_classes?.length ? `<tr><td style="padding:6px 0;color:#a07878;vertical-align:top;">Classes</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.selected_classes.join('<br/>')}</td></tr>` : ''}
                ${t.add_ons?.length ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;vertical-align:top;">Add-Ons</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.add_ons.join('<br/>')}</td></tr>` : ''}
                ${t.budget ? `<tr><td style="padding:6px 0;color:#a07878;">Budget</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.budget}</td></tr>` : ''}
                ${t.notes ? `<tr style="background:rgba(241,136,155,0.05);"><td style="padding:6px 0;color:#a07878;vertical-align:top;">Notes</td><td style="padding:6px 0;font-weight:600;color:#5a3535;">${t.notes}</td></tr>` : ''}
              </table>
            </td></tr>
          </table>

          <!-- What happens next -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:14px;border:1px solid #bbf7d0;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">✅ What Happens Next</p>
              <ol style="margin:0;padding-left:18px;color:#4a7a5a;font-size:14px;line-height:2;">
                <li>Our team reviews your request within <strong>24 hours</strong></li>
                <li>We confirm availability for your preferred date</li>
                <li>You'll receive a personalized quote &amp; booking details</li>
                <li>Once confirmed, we send all the event day info!</li>
              </ol>
            </td></tr>
          </table>

          <!-- Please note -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f9;border-radius:14px;border:1px solid #f7b1bd;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#b67651;text-transform:uppercase;letter-spacing:1px;">📌 Please Note</p>
              <ul style="margin:0;padding-left:18px;color:#9a5a6a;font-size:13px;line-height:2;">
                <li>Each session accommodates up to 9 guests and lasts 50 minutes</li>
                <li>Booking is subject to studio availability and written confirmation</li>
                <li>Only in-house décor company is permitted for event decorations</li>
                <li>No outside food or catering is permitted in the studio</li>
              </ul>
            </td></tr>
          </table>

          <p style="color:#a07878;font-size:14px;text-align:center;margin:0;">
            Questions? Reply to this email or reach us at
            <a href="mailto:events@pilatesinpinkstudio.com" style="color:#f1889b;text-decoration:none;">events@pilatesinpinkstudio.com</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:linear-gradient(135deg,#f1889b,#e86c84);border-radius:0 0 20px 20px;padding:24px 32px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:13px;font-weight:600;">Pilates in Pink™ Studio</p>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:12px;">We can't wait to create something beautiful with you 💕</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}