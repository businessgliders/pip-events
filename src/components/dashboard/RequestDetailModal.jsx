import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mail, Phone, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import EmailModal from './EmailModal';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

export default function RequestDetailModal({ request, onClose, onUpdate }) {
  const [status, setStatus] = useState(request.status || 'Pending');
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">{request.full_name}</h2>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X className="w-5 h-5" /></button>
            </div>

            {/* Status Update */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Update Status</label>
              <div className="flex gap-2">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 bg-white">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleSave} disabled={saving}
                  className="bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <Section title="Contact Information">
              <InfoRow icon={<Mail className="w-3.5 h-3.5 text-gray-400" />} value={request.email} />
              {request.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} value={request.phone} />}
            </Section>

            {/* Event Details */}
            <Section title="Event Details">
              <DetailRow label="Event Date" value={request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '—'} />
              {request.preferred_times && <DetailRow label="Preferred Time(s)" value={request.preferred_times} />}
              <DetailRow label="Number of Guests" value={request.number_of_guests ? `${request.number_of_guests} (1 session)` : '—'} />
              {request.time_slot && <DetailRow label="Time Slot" value={request.time_slot} />}
              {request.duration && <DetailRow label="Duration" value={request.duration} />}
            </Section>

            {/* Classes */}
            {request.selected_classes?.length > 0 && (
              <Section title="Selected Classes">
                <ul className="space-y-1">
                  {request.selected_classes.map(c => <li key={c} className="text-sm text-gray-700 flex items-center gap-1.5">• {c}</li>)}
                </ul>
              </Section>
            )}

            {/* Add-ons */}
            <Section title="Add-Ons">
              {request.add_ons?.length > 0 ? (
                <ul className="space-y-1">
                  {request.add_ons.map(a => <li key={a} className="text-sm text-gray-700 flex items-center gap-1.5">• {a}</li>)}
                </ul>
              ) : <p className="text-sm text-gray-300 italic">None selected</p>}
            </Section>

            {/* Budget & Notes */}
            <Section title="Budget & Notes">
              {request.budget && <DetailRow label="Budget" value={request.budget} />}
              {request.notes && <p className="text-sm text-gray-600 mt-1">{request.notes}</p>}
              <p className="text-xs text-gray-300 mt-3">
                Submitted {request.created_date ? format(new Date(request.created_date), 'MMMM d, yyyy \'at\' h:mm a') : '—'}
              </p>
              {request.updated_date && (
                <p className="text-xs text-gray-300">
                  Last updated {format(new Date(request.updated_date), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              )}
            </Section>

            {/* Email log */}
            {request.email_log?.length > 0 && (
              <Section title="Email History">
                <ul className="space-y-1">
                  {request.email_log.map((log, i) => (
                    <li key={i} className="text-xs text-gray-500 flex gap-2">
                      <span className="text-gray-300">{log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : ''}</span>
                      <span>{log.template_name}: {log.subject}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 px-6 py-4 flex gap-2">
            <button onClick={() => setShowEmail(true)}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-pink-200 text-gray-600 hover:text-pink-500 py-2 rounded-xl text-sm font-medium transition-colors">
              <Mail className="w-4 h-4" /> Email Client
            </button>
            <button onClick={() => { if (request.phone) window.open(`tel:${request.phone}`); }}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-200 text-gray-600 hover:text-blue-500 py-2 rounded-xl text-sm font-medium transition-colors">
              <Phone className="w-4 h-4" /> Call Client
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center justify-center gap-1 border border-red-100 text-red-400 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showEmail && (
        <EmailModal
          request={request}
          onClose={() => setShowEmail(false)}
          onSent={() => { setShowEmail(false); onUpdate(); }}
        />
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
        <span className="w-3 h-0.5 bg-pink-200 rounded-full"></span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col mb-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value}</span>
    </div>
  );
}

function InfoRow({ icon, value }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
      {icon}
      <span>{value}</span>
    </div>
  );
}