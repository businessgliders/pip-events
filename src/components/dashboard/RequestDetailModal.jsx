import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mail, Phone, Trash2, User, Calendar, Tag, Sparkles, StickyNote, DollarSign, Lock, ExternalLink, Send } from 'lucide-react';
import { format } from 'date-fns';
import EmailCommsPanel from './EmailCommsPanel';

const EMAIL_BETA_PASSWORD = 'admin123';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const STATUS_STYLES = {
  Pending:   { bg: 'rgba(254,249,195,0.9)', text: '#854d0e', border: 'rgba(253,224,71,0.6)' },
  Confirmed: { bg: 'rgba(219,234,254,0.9)', text: '#1e40af', border: 'rgba(147,197,253,0.6)' },
  Completed: { bg: 'rgba(220,252,231,0.9)', text: '#166534', border: 'rgba(134,239,172,0.6)' },
  Cancelled: { bg: 'rgba(243,244,246,0.9)', text: '#6b7280', border: 'rgba(209,213,219,0.6)' },
};

export default function RequestDetailModal({ request: initialRequest, onClose, onUpdate }) {
  const [request, setRequest] = useState(initialRequest);
  const [status, setStatus] = useState(initialRequest.status || 'Pending');

  // Subscribe to live updates for this specific record
  useEffect(() => {
    const unsubscribe = base44.entities.EventRequest.subscribe((event) => {
      if (event.id === initialRequest.id && event.data) {
        setRequest(event.data);
      }
    });
    return unsubscribe;
  }, [initialRequest.id]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [betaPw, setBetaPw] = useState('');
  const [betaPwError, setBetaPwError] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);

  const buildReplySubject = () => {
    const eventDate = request.event_date
      ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy')
      : 'TBD';
    return `Re: ${request.event_type || 'Event'} on ${eventDate} — ${request.full_name || ''}`;
  };

  const handleGmailReply = async () => {
    if (!replyBody.trim()) return;
    setReplySending(true);
    await base44.functions.invoke('gmailReply', {
      to: request.email,
      subject: buildReplySubject(),
      body: replyBody,
      requestId: request.id,
    });
    setReplySending(false);
    setReplySent(true);
    setReplyBody('');
    onUpdate();
    setTimeout(() => setReplySent(false), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.EventRequest.update(request.id, { status });
    setSaving(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this request permanently?')) return;
    setDeleting(true);
    await base44.entities.EventRequest.delete(request.id);
    setDeleting(false);
    onUpdate();
  };

  const sc = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  const submittedAt = request.submitted_date || request.created_date;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top bar ── */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(247,177,189,0.3)',
            background: 'linear-gradient(135deg, rgba(251,224,226,0.5), rgba(255,255,255,0.95))',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)' }}>
              <User className="w-5 h-5" style={{ color: '#e86c84' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: '#6b4e4e' }}>{request.full_name}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#c48a96' }}>
                {request.event_type} · {request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
              {status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 transition-colors ml-1">
              <X className="w-5 h-5" style={{ color: '#c48a96' }} />
            </button>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* LEFT — Details */}
          <div
            className="flex flex-col overflow-y-auto"
            style={{ width: '42%', borderRight: '1px solid rgba(247,177,189,0.25)', flexShrink: 0 }}
          >
            {/* Status update */}
            <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(247,177,189,0.2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#c48a96' }}>Update Status</p>
              <div className="flex gap-2">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 bg-white"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)' }}
                >
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-5 flex-1">

              {/* Contact */}
              <InfoBlock icon={<User className="w-3.5 h-3.5" />} title="Contact">
                <div className="grid grid-cols-1 gap-2">
                  <ContactChip icon={<Mail className="w-3 h-3" />} value={request.email} href={`mailto:${request.email}`} />
                  {request.phone && <ContactChip icon={<Phone className="w-3 h-3" />} value={request.phone} href={`tel:${request.phone}`} />}
                </div>
              </InfoBlock>

              {/* Event details — 2-col grid */}
              <InfoBlock icon={<Calendar className="w-3.5 h-3.5" />} title="Event Details">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <Field label="Event Date" value={request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMM d, yyyy') : '—'} />
                  <Field label="Guests" value={request.number_of_guests ? `${request.number_of_guests} guests` : '—'} />
                  {request.time_slot && <Field label="Time Slot" value={request.time_slot} span />}
                  {request.duration && <Field label="Duration" value={request.duration} />}
                  {request.preferred_times && <Field label="Pref. Times" value={request.preferred_times} />}
                </div>
              </InfoBlock>

              {/* Classes */}
              {request.selected_classes?.length > 0 && (
                <InfoBlock icon={<Sparkles className="w-3.5 h-3.5" />} title="Classes">
                  <div className="flex flex-wrap gap-1.5">
                    {request.selected_classes.map(c => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(241,136,155,0.1)', color: '#e86c84', border: '1px solid rgba(241,136,155,0.25)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </InfoBlock>
              )}

              {/* Add-ons */}
              <InfoBlock icon={<Tag className="w-3.5 h-3.5" />} title="Add-Ons">
                {request.add_ons?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {request.add_ons.map(a => (
                      <span key={a} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(182,118,81,0.08)', color: '#b67651', border: '1px solid rgba(182,118,81,0.2)' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-xs italic" style={{ color: '#d4b8bc' }}>None selected</p>}
              </InfoBlock>

              {/* Budget & Notes */}
              {(request.budget || request.notes) && (
                <InfoBlock icon={<StickyNote className="w-3.5 h-3.5" />} title="Budget & Notes">
                  {request.budget && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <DollarSign className="w-3 h-3" style={{ color: '#c48a96' }} />
                      <span className="text-sm font-medium" style={{ color: '#6b4e4e' }}>{request.budget}</span>
                    </div>
                  )}
                  {request.notes && (
                    <p className="text-sm leading-relaxed" style={{ color: '#7a5555' }}>{request.notes}</p>
                  )}
                </InfoBlock>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid rgba(247,177,189,0.2)' }}>
              {request.phone && (
                <button
                  onClick={() => window.open(`tel:${request.phone}`)}
                  className="flex-1 flex items-center justify-center gap-2 border py-2 rounded-xl text-sm font-medium transition-colors text-gray-600 hover:text-blue-500 hover:border-blue-200"
                  style={{ borderColor: 'rgba(220,200,205,0.7)' }}
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
              )}
              {submittedAt && (
                <p className="flex-1 text-xs self-center text-center" style={{ color: '#d4b8bc' }}>
                  Submitted {format(new Date(submittedAt), "MMM d, yyyy")}
                </p>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-1 border border-red-100 text-red-400 hover:bg-red-50 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT — Email comms */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
            <EmailCommsPanel request={request} onUpdate={onUpdate} />

            {/* Beta lock overlay */}
            {!emailUnlocked && (
              <div
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{
                  background: 'rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 10,
                }}
              >
                <div
                  className="w-full max-w-sm rounded-2xl p-6 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    border: '1.5px solid rgba(247,177,189,0.5)',
                    boxShadow: '0 16px 48px rgba(241,136,155,0.25)',
                  }}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)' }}>
                    <Lock className="w-5 h-5" style={{ color: '#e86c84' }} />
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: '#b67651' }}>Email back and forth coming soon.</h3>
                  <p className="text-xs mb-4" style={{ color: '#c48a96' }}>
                    In-app email communications are in beta. Enter the password to preview, or reply via Gmail meanwhile.
                  </p>

                  <input
                    type="password"
                    value={betaPw}
                    onChange={e => { setBetaPw(e.target.value); setBetaPwError(false); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (betaPw === EMAIL_BETA_PASSWORD) setEmailUnlocked(true);
                        else setBetaPwError(true);
                      }
                    }}
                    placeholder="Beta password"
                    className="w-full rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none bg-white/80 placeholder-gray-400"
                    style={{
                      border: betaPwError ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.7)',
                    }}
                  />
                  {betaPwError && <p className="text-xs mb-2" style={{ color: '#f1889b' }}>Incorrect password.</p>}

                  <button
                    onClick={() => {
                      if (betaPw === EMAIL_BETA_PASSWORD) setEmailUnlocked(true);
                      else setBetaPwError(true);
                    }}
                    className="w-full text-white py-2.5 rounded-xl font-semibold text-sm transition-all mb-3"
                    style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.3)' }}
                  >
                    Unlock Beta
                  </button>

                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(247,177,189,0.35)' }} />
                    <span className="text-xs" style={{ color: '#d4b8bc' }}>reply now via Gmail</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(247,177,189,0.35)' }} />
                  </div>

                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    placeholder={`Reply to ${request.full_name}…`}
                    rows={3}
                    className="w-full rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none resize-none bg-white/80 placeholder-gray-400"
                    style={{ border: '1.5px solid rgba(220,200,205,0.7)', color: '#6b4e4e' }}
                  />

                  <button
                    onClick={handleGmailReply}
                    disabled={replySending || !replyBody.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    style={{
                      background: replySent ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.9)',
                      border: replySent ? '1.5px solid rgba(134,239,172,0.6)' : '1.5px solid rgba(220,200,205,0.7)',
                      color: replySent ? '#166534' : '#b67651',
                    }}
                  >
                    {replySent ? '✓ Sent!' : replySending ? 'Sending…' : <><Mail className="w-4 h-4" /> Send via Gmail</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#f1889b' }}>{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#c48a96' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, span }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-xs mb-0.5" style={{ color: '#c48a96' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: '#6b4e4e' }}>{value}</p>
    </div>
  );
}

function ContactChip({ icon, value, href }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
      style={{ background: 'rgba(251,224,226,0.3)', border: '1px solid rgba(247,177,189,0.3)', color: '#7a4a3a' }}
      onClick={e => e.stopPropagation()}
    >
      <span style={{ color: '#f1889b' }}>{icon}</span>
      <span className="truncate">{value}</span>
    </a>
  );
}