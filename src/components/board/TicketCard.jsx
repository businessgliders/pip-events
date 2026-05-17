import { Users, Calendar, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EVENT_TYPE_EMOJI = {
  'Birthday': '🎂',
  'Bridal Shower': '💐',
  'Bachelorette Party': '🥂',
  'Corporate Wellness Event': '💼',
  'Private Class': '🧘‍♀️',
  'Other': '✨',
};

const STATUS_OPTIONS = ['New', 'In Conversations', 'Waiting for Payment', 'Confirmed', 'Hosted', 'No Response'];

// Days-until-event → label + color
function daysUntilInfo(eventDateStr) {
  if (!eventDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDateStr + 'T12:00:00');
  eventDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDay - today) / (1000 * 60 * 60 * 24));
  let label, color;
  if (diffDays < 0) { label = `${Math.abs(diffDays)}d past`; color = '#ef4444'; }
  else if (diffDays === 0) { label = 'Today'; color = '#ef4444'; }
  else if (diffDays === 1) { label = 'Tomorrow'; color = '#f97316'; }
  else if (diffDays < 14) { label = `${diffDays}d left`; color = '#f97316'; }
  else if (diffDays <= 30) { label = `${diffDays}d left`; color = '#eab308'; }
  else { label = `${diffDays}d left`; color = '#10b981'; }
  return { label, color, diffDays };
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  let iso = dateString;
  if (!/Z|[+-]\d{2}:?\d{2}$/.test(iso)) iso += 'Z';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initialsColor(email = '') {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

function formatEventDate(eventDate) {
  if (!eventDate) return '—';
  const d = new Date(eventDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCalendarParts(eventDate) {
  if (!eventDate) return null;
  const d = new Date(eventDate + 'T12:00:00');
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  };
}

function CalendarDateBlock({ eventDate, size = 'md' }) {
  const parts = getCalendarParts(eventDate);
  if (!parts) return null;
  const isSm = size === 'sm';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md overflow-hidden bg-white shadow-sm border border-pink-200 flex-shrink-0 ${
        isSm ? 'w-8' : 'w-11'
      }`}
    >
      <div
        className={`w-full text-center font-bold text-white leading-none ${isSm ? 'text-[7px] py-0.5' : 'text-[9px] py-0.5'}`}
        style={{ background: '#e86c84' }}
      >
        {parts.month}
      </div>
      <div
        className={`w-full text-center font-bold leading-none ${isSm ? 'text-xs py-0.5' : 'text-base py-1'}`}
        style={{ color: '#5a3535' }}
      >
        {parts.day}
      </div>
    </div>
  );
}

export default function TicketCard({ ticket, onStatusChange, onClick, isDragging, isHighlighted, viewMode, unreadCount = 0 }) {
  const emoji = EVENT_TYPE_EMOJI[ticket.event_type] || '✨';
  const ticketTag = ticket.ticket_number ? `#${ticket.ticket_number}` : `#${ticket.id?.slice(-6)}`;
  const daysInfo = daysUntilInfo(ticket.event_date);
  const hasUnread = unreadCount > 0;

  return (
    <div
      onClick={() => onClick && onClick(ticket)}
      className={`relative overflow-hidden backdrop-blur-md bg-white/40 border border-white/40 rounded-xl p-2 md:p-4 group ${
        isDragging
          ? 'shadow-2xl bg-white/90 cursor-grabbing ring-4 ring-white/60'
          : isHighlighted
          ? 'shadow-2xl bg-white/70 ring-4 ring-yellow-400/50 animate-shake cursor-grab transition-all'
          : 'hover:bg-white/50 shadow-lg hover:shadow-xl cursor-grab transition-all'
      }`}
    >
      {/* Watermark — status in category view */}
      {viewMode === 'category' && (
        <span className="pointer-events-none absolute top-1 right-2 text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-900/10">
          {ticket.status}
        </span>
      )}

      {/* Unread email badge — moved to top-left to avoid the calendar date block */}
      {hasUnread && (
        <span
          className="absolute top-2 left-2 inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-bold text-white shadow-md z-10 animate-pulse-soft"
          style={{ background: '#e86c84', border: '1px solid rgba(255,255,255,0.6)' }}
          title={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
        >
          <Mail className="w-2.5 h-2.5" />
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Calendar date block — absolute top-right */}
      <div className="absolute top-2 right-2 z-10">
        <CalendarDateBlock eventDate={ticket.event_date} size="sm" />
      </div>

      {/* Mobile compact */}
      <div className="md:hidden">
        <span className="text-[10px] text-gray-400 font-bold block">{ticketTag}</span>
        <div className="flex items-start gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-base flex-shrink-0">{emoji}</span>
            <p className="text-xs font-semibold whitespace-nowrap" style={{ color: '#5a3535' }}>
              {ticket.full_name}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <span className="text-[10px] text-gray-400 font-bold block mb-1">{ticketTag}</span>
        <div className="flex items-start gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold whitespace-nowrap leading-tight" style={{ color: '#5a3535' }}>
                {ticket.full_name}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
          {ticket.number_of_guests ? (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ticket.number_of_guests}</span>
          ) : null}
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-[11px] text-gray-500">{formatRelativeTime(ticket.submitted_date || ticket.created_date)}</span>
        </div>

        {/* Stacked pills bottom-right: category above days-left */}
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-white/60 border-pink-200 text-pink-700">
            {ticket.event_type}
          </Badge>
          {daysInfo && (
            <span
              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-semibold flex-shrink-0 text-white shadow-sm"
              style={{ background: daysInfo.color }}
              title={`Event ${daysInfo.diffDays < 0 ? 'was' : 'is'} ${formatEventDate(ticket.event_date)}`}
            >
              <Clock className="w-2.5 h-2.5" />
              {daysInfo.label}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out 3; }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232,108,132,0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(232,108,132,0); }
        }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}