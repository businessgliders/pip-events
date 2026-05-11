import { useState, useRef, useEffect } from 'react';
import { Bell, Mail, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function snippet(html, text) {
  const raw = text || html || '';
  return raw
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/On .+ wrote:/i)[0]
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export default function NotificationCenter({ unreadMessages, totalUnread, tickets, onSelect, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Most recent unread first
  const sorted = [...unreadMessages].sort((a, b) =>
    new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime()
  );

  const ticketsById = tickets.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 hover:bg-white transition-colors shadow-sm relative"
        title={totalUnread > 0 ? `${totalUnread} unread` : 'Notifications'}
      >
        <Bell className="w-4 h-4" style={{ color: '#5a3535' }} />
        {totalUnread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: '#e86c84' }}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-[360px] max-h-[480px] bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(247,177,189,0.4)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(251,224,226,0.5), white)', borderBottom: '1px solid rgba(247,177,189,0.3)' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: '#e86c84' }} />
              <span className="text-sm font-bold" style={{ color: '#6b4e4e' }}>Notifications</span>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#e86c84' }}>
                  {totalUnread}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-pink-50">
              <X className="w-4 h-4" style={{ color: '#c48a96' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: '#c48a96' }} />
                <p className="text-sm" style={{ color: '#9a7070' }}>You're all caught up</p>
              </div>
            ) : (
              <ul>
                {sorted.map(msg => {
                  const ticket = ticketsById[msg.ticket_id];
                  const tag = ticket?.ticket_number ? `#${ticket.ticket_number}` : msg.ticket_id?.slice(-6);
                  const sender = msg.from_name || msg.from_email || 'Client';
                  const when = msg.sent_at ? formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true }) : '';
                  return (
                    <li
                      key={msg.id}
                      className="px-4 py-3 hover:bg-pink-50 cursor-pointer transition-colors border-b last:border-0 flex gap-3"
                      style={{ borderColor: 'rgba(247,177,189,0.2)' }}
                      onClick={() => {
                        setOpen(false);
                        if (ticket) onSelect(ticket, msg.id);
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: '#e86c84' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(241,136,155,0.15)', color: '#e86c84' }}>
                            {tag}
                          </span>
                          <p className="text-xs font-semibold truncate" style={{ color: '#5a3535' }}>{sender}</p>
                        </div>
                        <p className="text-xs line-clamp-2 leading-snug" style={{ color: '#7a5555' }}>
                          {snippet(msg.body_html, msg.body_text) || msg.subject || '(no content)'}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: '#c48a96' }}>{when}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(msg.id);
                        }}
                        title="Mark as read"
                        className="self-start text-[10px] font-semibold px-2 py-1 rounded-full hover:bg-white"
                        style={{ color: '#9a7070', border: '1px solid rgba(247,177,189,0.4)' }}
                      >
                        ✓
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}