import { useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { format } from 'date-fns';
import EmailMessageItem from './EmailMessageItem';
import EmailComposer from './EmailComposer';
import { buildWelcomeHtml } from './welcomeEmailHtml';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

export default function EmailThreadPanel({ ticket, currentUser, highlightMessageId, focusComposer, onDraftDirtyChange, saveDraftRef }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const initialScrolled = useRef(false);
  const { markAsRead } = useUnreadMessages(currentUser?.email);

  const { data: rawMessages = [] } = useQuery({
    queryKey: ['email-messages', ticket.id],
    queryFn: () => base44.entities.EmailMessage.filter({ ticket_id: ticket.id }, 'sent_at', 500),
    refetchInterval: 15000,
    initialData: [],
  });

  // Filter out internal/staff-to-staff emails (notifications sent to staff domain)
  const messages = useMemo(() => {
    return rawMessages.filter(m => {
      if (m.direction === 'outbound' && m.to_email && m.to_email.toLowerCase().endsWith(`@${STAFF_DOMAIN}`)) return false;
      return true;
    });
  }, [rawMessages]);

  // Synthetic first inbound bubble — the original intake notes
  const intakeBubble = useMemo(() => {
    const fields = [];
    if (ticket.event_type) fields.push(`Event: ${ticket.event_type}`);
    if (ticket.event_date) fields.push(`Date: ${ticket.event_date}`);
    if (ticket.preferred_times) fields.push(`Time: ${ticket.preferred_times}`);
    if (ticket.number_of_guests) fields.push(`Guests: ${ticket.number_of_guests}`);
    if (ticket.time_slot) fields.push(`Slot: ${ticket.time_slot}`);
    if (ticket.duration) fields.push(`Duration: ${ticket.duration}`);
    if (ticket.selected_classes?.length) fields.push(`Classes: ${ticket.selected_classes.join(', ')}`);
    if (ticket.add_ons?.length) fields.push(`Add-ons: ${ticket.add_ons.join(', ')}`);
    if (ticket.budget) fields.push(`Budget: ${ticket.budget}`);

    const body = `<p><strong>Original inquiry from ${ticket.full_name || 'the client'}:</strong></p>` +
      `<ul>${fields.map(f => `<li>${f}</li>`).join('')}</ul>` +
      (ticket.notes ? `<p><strong>Notes:</strong> ${ticket.notes}</p>` : '');

    return {
      id: `__intake_${ticket.id}`,
      ticket_id: ticket.id,
      direction: 'inbound',
      from_name: ticket.full_name || 'Client',
      from_email: ticket.email,
      to_email: 'events@pilatesinpinkstudio.com',
      subject: `New ${ticket.event_type || 'event'} inquiry`,
      body_html: body,
      sent_at: ticket.submitted_date || ticket.created_date,
      send_status: 'received',
      __synthetic: true,
    };
  }, [ticket]);

  // Synthetic welcome bubble (only if no real welcome message exists)
  const hasRealWelcome = messages.some(m => m.is_welcome);
  const welcomeBubble = useMemo(() => {
    if (hasRealWelcome) return null;
    return {
      id: `__welcome_${ticket.id}`,
      ticket_id: ticket.id,
      direction: 'outbound',
      from_email: 'events@pilatesinpinkstudio.com',
      from_name: 'Pilates in Pink ™',
      to_email: ticket.email,
      subject: 'Welcome — Auto-Confirmation',
      body_html: buildWelcomeHtml({
        clientName: ticket.full_name,
        inquiryType: ticket.event_type,
        ticketShortId: ticket.ticket_number || ticket.id.slice(-8),
        ticket,
      }),
      sent_at: ticket.submitted_date || ticket.created_date,
      is_welcome: true,
      send_status: 'sent',
      __synthetic: true,
    };
  }, [hasRealWelcome, ticket]);

  // Final thread = [intake, welcome?, ...real messages]
  const thread = useMemo(() => {
    const list = [intakeBubble];
    if (welcomeBubble) list.push(welcomeBubble);
    return [...list, ...messages];
  }, [intakeBubble, welcomeBubble, messages]);

  // Scroll behavior — reset when ticket changes
  useEffect(() => {
    initialScrolled.current = false;
  }, [ticket.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (initialScrolled.current) return;

    if (highlightMessageId) {
      const el = scrollRef.current.querySelector(`[data-msg-id="${highlightMessageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        initialScrolled.current = true;
        return;
      }
    }
    // Jump to newest
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    initialScrolled.current = true;
  }, [thread.length, highlightMessageId]);

  const handleSent = () => {
    queryClient.invalidateQueries({ queryKey: ['email-messages', ticket.id] });
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(247,177,189,0.3)', background: 'rgba(251,224,226,0.15)' }}>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" style={{ color: '#e86c84' }} />
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#b67651' }}>Email Communications</p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(241,136,155,0.15)', color: '#e86c84' }}>
            {thread.length}
          </span>
        </div>
        <span className="text-xs truncate max-w-[200px]" style={{ color: '#9a7070' }}>{ticket.email}</span>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-0"
        style={{ background: 'linear-gradient(180deg, rgba(254,243,199,0.2), rgba(252,231,235,0.3))', maxHeight: 480 }}
      >
        {thread.map(m => {
          const readBy = Array.isArray(m.read_by) ? m.read_by : [];
          const isUnread = m.direction === 'inbound' && !m.__synthetic && currentUser?.email && !readBy.includes(currentUser.email);
          return (
            <EmailMessageItem
              key={m.id}
              message={m}
              isHighlighted={m.id === highlightMessageId}
              isUnread={isUnread}
              onMarkRead={markAsRead}
            />
          );
        })}
      </div>

      {/* Composer */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0">
        <EmailComposer ticket={ticket} currentUser={currentUser} onSent={handleSent} autoFocus={focusComposer} onDirtyChange={onDraftDirtyChange} saveDraftRef={saveDraftRef} />
      </div>
    </div>
  );
}