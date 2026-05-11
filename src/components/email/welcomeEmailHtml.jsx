// Branded welcome email HTML used as a synthetic welcome bubble in the thread
// (also reusable if we ever want to actually send a welcome email).
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

export function buildWelcomeHtml({ clientName, inquiryType, ticketShortId }) {
  const firstName = (clientName || '').split(' ')[0] || 'there';
  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;">
      <div style="text-align:center;margin-bottom:16px;">
        <img src="${LOGO_URL}" width="56" style="display:inline-block;" />
      </div>
      <h2 style="color:#e86c84;font-size:20px;margin:0 0 12px;">Thank you, ${firstName}! 💕</h2>
      <p>We've received your ${inquiryType || 'event'} inquiry and our team will be in touch within 1–2 business days to plan the perfect experience for you.</p>
      <p style="color:#9a7070;font-size:13px;">Reference: <strong>Ticket #${ticketShortId || ''}</strong></p>
      <p style="margin-top:24px;color:#b67651;"><strong>Pilates in Pink ™ Studio</strong></p>
    </div>
  `;
}