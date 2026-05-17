import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mail, Phone, Trash2, User, Calendar, Tag, Sparkles, StickyNote, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import EmailThreadPanel from '@/components/email/EmailThreadPanel';
import { findAddon, EXTRA_ADDON_SECTIONS } from '@/components/requestForm/addonsConfig';
import UnsavedDraftDialog from '@/components/email/UnsavedDraftDialog';

const STATUS_OPTIONS = ['New', 'In Conversations', 'Waiting for Payment', 'Confirmed', 'No Response', 'Hosted', 'Completed', 'Cancelled'];

const STATUS_STYLES = {
  'New':                 { bg: 'rgba(254,243,226,0.9)', text: '#9a3412', border: 'rgba(251,146,60,0.5)' },
  'In Conversations':    { bg: 'rgba(254,249,195,0.9)', text: '#854d0e', border: 'rgba(253,224,71,0.6)' },
  'Waiting for Payment': { bg: 'rgba(255,237,213,0.9)', text: '#9a3412', border: 'rgba(251,146,60,0.5)' },
  'Confirmed':           { bg: 'rgba(219,234,254,0.9)', text: '#1e40af', border: 'rgba(147,197,253,0.6)' },
  'No Response':         { bg: 'rgba(243,244,246,0.9)', text: '#6b7280', border: 'rgba(209,213,219,0.6)' },
  'Hosted':              { bg: 'rgba(237,233,254,0.9)', text: '#5b21b6', border: 'rgba(196,181,253,0.6)' },
  'Completed':           { bg: 'rgba(220,252,231,0.9)', text: '#166534', border: 'rgba(134,239,172,0.6)' },
  'Cancelled':           { bg: 'rgba(243,244,246,0.9)', text: '#6b7280', border: 'rgba(209,213,219,0.6)' },
};

export default function RequestDetailModal({ request: initialRequest, onClose, onUpdate, highlightMessageId, focusComposer }) {
  const [request, setRequest] = useState(initialRequest);
  // Map legacy "Pending" → "In Conversations"
  const initStatus = initialRequest.status === 'Pending' ? 'In Conversations' : (initialRequest.status || 'New');
  const [status, setStatus] = useState(initStatus);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const saveDraftRef = useRef(null);

  const handleClose = () => {
    if (draftDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    onClose();
  };

  const handleSaveAndClose = () => {
    saveDraftRef.current?.save?.();
    setShowUnsavedDialog(false);
    onClose();
  };

  const handleDiscardAndClose = () => {
    saveDraftRef.current?.discard?.();
    setShowUnsavedDialog(false);
    onClose();
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // Subscribe to live updates for this specific record
  useEffect(() => {
    const unsubscribe = base44.entities.EventRequest.subscribe((event) => {
      if (event.id === initialRequest.id && event.data) {
        setRequest(event.data);
      }
    });
    return unsubscribe;
  }, [initialRequest.id]);

  // Lock background scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);
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

  const sc = STATUS_STYLES[status] || STATUS_STYLES['New'];
  const submittedAt = request.submitted_date || request.created_date;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={handleClose}>
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold leading-tight" style={{ color: '#6b4e4e' }}>{request.full_name}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(241,136,155,0.12)', color: '#e86c84', border: '1px solid rgba(241,136,155,0.3)' }}>
                  {request.ticket_number ? `#${request.ticket_number}` : `#${request.id?.slice(-6)}`}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#c48a96' }}>
                {request.event_type} · {request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
              {status}
            </span>
            <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-pink-50 transition-colors ml-1">
              <X className="w-5 h-5" style={{ color: '#c48a96' }} />
            </button>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* LEFT — Email comms */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0" style={{ borderRight: '1px solid rgba(247,177,189,0.25)' }}>
            <EmailThreadPanel ticket={request} currentUser={currentUser} highlightMessageId={highlightMessageId} focusComposer={focusComposer} onDraftDirtyChange={setDraftDirty} saveDraftRef={saveDraftRef} />
          </div>

          {/* RIGHT — Details */}
          <div
            className="flex flex-col overflow-y-auto"
            style={{ width: '42%', flexShrink: 0 }}
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
                    {request.add_ons.map(a => {
                      const info = findAddon(a);
                      const isDecorOption = a.toLowerCase().includes('decor option');
                      const hideQuoted = info.price && info.price.toLowerCase().includes('quoted on confirmation');
                      const decorItem = isDecorOption
                        ? EXTRA_ADDON_SECTIONS.flatMap(s => s.items).find(i => i.name === a)
                        : null;
                      return (
                        <span
                          key={a}
                          title={decorItem?.desc || undefined}
                          className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 relative group"
                          style={{
                            background: isDecorOption ? 'rgba(241,136,155,0.2)' : info.included ? 'rgba(22,163,74,0.08)' : 'rgba(182,118,81,0.08)',
                            color: isDecorOption ? '#e86c84' : info.included ? '#16a34a' : '#b67651',
                            border: `1px solid ${isDecorOption ? 'rgba(241,136,155,0.5)' : info.included ? 'rgba(22,163,74,0.25)' : 'rgba(182,118,81,0.2)'}`,
                            fontWeight: isDecorOption ? '600' : '500',
                            cursor: decorItem ? 'help' : 'default',
                          }}
                        >
                          {a}
                          {info.price && !hideQuoted && (
                            <span className="text-[10px] font-bold opacity-80">{info.price}</span>
                          )}
                          {info.included && !isDecorOption && (
                            <span className="text-[9px] uppercase font-bold opacity-70">incl</span>
                          )}
                          {decorItem && (
                            <span
                              className="absolute left-0 top-full mt-1.5 z-50 hidden group-hover:block w-72 p-3 rounded-lg shadow-xl text-[11px] leading-relaxed font-normal pointer-events-none"
                              style={{
                                background: 'white',
                                color: '#6b4e4e',
                                border: '1px solid rgba(241,136,155,0.4)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                              }}
                            >
                              {decorItem.image && (
                                <img
                                  src={decorItem.image}
                                  alt={decorItem.displayName || decorItem.name}
                                  className="w-full h-32 object-cover rounded-md mb-2"
                                />
                              )}
                              <p className="font-bold mb-1" style={{ color: '#e86c84' }}>
                                {decorItem.displayName || decorItem.name}
                              </p>
                              <p>{decorItem.desc}</p>
                            </span>
                          )}
                        </span>
                      );
                    })}
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

        </div>
      </div>

      <UnsavedDraftDialog
        open={showUnsavedDialog}
        onSaveAndClose={handleSaveAndClose}
        onDiscard={handleDiscardAndClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />
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