import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mail, Phone, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import EmailCommsPanel from './EmailCommsPanel';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

export default function RequestDetailModal({ request, onClose, onUpdate }) {
  const [status, setStatus] = useState(request.status || 'Pending');
  const [saving, setSaving] = useState(false);
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
            background: 'linear-gradient(135deg, rgba(251,224,226,0.4), rgba(255,255,255,0.9))',
          }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#6b4e4e' }}>{request.full_name}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#c48a96' }}>
              {request.event_type} · {request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 transition-colors">
            <X className="w-5 h-5" style={{ color: '#c48a96' }} />
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* LEFT — Details */}
          <div className="flex flex-col overflow-y-auto px-6 py-5" style={{ width: '42%', borderRight: '1px solid rgba(247,177,189,0.25)', flexShrink: 0 }}>
            {/* Status */}
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: '#c48a96' }}>Update Status</label>
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
                  className="text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)' }}
                >
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Contact */}
            <Section title="Contact">
              <InfoRow icon={<Mail className="w-3.5 h-3.5 text-gray-400" />} value={request.email} />
              {request.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} value={request.phone} />}
            </Section>

            {/* Event Details */}
            <div className="mt-4">
              <Section title="Event Details">
                <DetailRow label="Event Date" value={request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '—'} />
                {request.preferred_times && <DetailRow label="Preferred Time(s)" value={request.preferred_times} />}
                <DetailRow label="Number of Guests" value={request.number_of_guests ? `${request.number_of_guests} guests` : '—'} />
                {request.time_slot && <DetailRow label="Time Slot" value={request.time_slot} />}
                {request.duration && <DetailRow label="Duration" value={request.duration} />}
              </Section>
            </div>

            {/* Classes */}
            {request.selected_classes?.length > 0 && (
              <div className="mt-4">
                <Section title="Selected Classes">
                  <ul className="space-y-1">
                    {request.selected_classes.map(c => <li key={c} className="text-sm text-gray-700">• {c}</li>)}
                  </ul>
                </Section>
              </div>
            )}

            {/* Add-Ons */}
            <div className="mt-4">
              <Section title="Add-Ons">
                {request.add_ons?.length > 0 ? (
                  <ul className="space-y-1">
                    {request.add_ons.map(a => <li key={a} className="text-sm text-gray-700">• {a}</li>)}
                  </ul>
                ) : <p className="text-sm text-gray-300 italic">None selected</p>}
              </Section>
            </div>

            {/* Budget & Notes */}
            <div className="mt-4">
              <Section title="Budget & Notes">
                {request.budget && <DetailRow label="Budget" value={request.budget} />}
                {request.notes && <p className="text-sm text-gray-600 mt-1">{request.notes}</p>}
                <p className="text-xs text-gray-300 mt-3">
                  Submitted{' '}
                  {request.submitted_date
                    ? format(new Date(request.submitted_date), "MMM d, yyyy 'at' h:mm a")
                    : request.created_date
                      ? format(new Date(request.created_date), "MMM d, yyyy 'at' h:mm a")
                      : '—'}
                </p>
              </Section>
            </div>

            {/* Footer actions */}
            <div className="mt-auto pt-5 flex gap-2">
              {request.phone && (
                <button
                  onClick={() => window.open(`tel:${request.phone}`)}
                  className="flex-1 flex items-center justify-center gap-2 border py-2 rounded-xl text-sm font-medium transition-colors text-gray-600 hover:text-blue-500 hover:border-blue-200"
                  style={{ borderColor: 'rgba(220,200,205,0.7)' }}
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-1 border border-red-100 text-red-400 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT — Email comms */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <EmailCommsPanel request={request} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: '#c48a96' }}>
        <span className="w-3 h-0.5 bg-pink-200 rounded-full inline-block"></span>
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