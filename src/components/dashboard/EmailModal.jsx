import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Save, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function EmailModal({ request, onClose, onSent }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { data: templates = [], refetch } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 50),
  });

  const interpolate = (text) => text
    .replace(/\{\{name\}\}/g, request.full_name || '')
    .replace(/\{\{email\}\}/g, request.email || '')
    .replace(/\{\{event_type\}\}/g, request.event_type || '')
    .replace(/\{\{event_date\}\}/g, request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '')
    .replace(/\{\{status\}\}/g, request.status || '');

  const loadTemplate = (id) => {
    setSelectedTemplate(id);
    const t = templates.find(t => t.id === id);
    if (t) { setSubject(t.subject); setBody(t.body); }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !subject || !body) return;
    setSaving(true);
    await base44.entities.EmailTemplate.create({ name: templateName, subject, body });
    await refetch();
    setTemplateName('');
    setSaving(false);
  };

  const handleSend = async () => {
    if (!subject || !body) return;
    setSending(true);
    const finalSubject = interpolate(subject);
    const finalBody = interpolate(body);

    await base44.integrations.Core.SendEmail({
      to: request.email,
      subject: finalSubject,
      body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">${finalBody.replace(/\n/g, '<br/>')}</div>`,
      from_name: 'Pilates in Pink™ Studio',
    });

    // Log the email
    const log = request.email_log || [];
    await base44.entities.EventRequest.update(request.id, {
      email_log: [...log, {
        sent_at: new Date().toISOString(),
        template_name: selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.name || 'Custom' : 'Custom',
        subject: finalSubject,
      }]
    });

    setSending(false);
    onSent();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800">Email {request.full_name}</h2>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X className="w-5 h-5" /></button>
          </div>

          {/* Template selector */}
          {templates.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 block mb-1">Load Template</label>
              <select value={selectedTemplate} onChange={e => loadTemplate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200">
                <option value="">— Select a template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-4 bg-gray-50 rounded-lg px-3 py-2">
            Use <code className="bg-white px-1 rounded border text-pink-400">{"{{name}}"}</code>, <code className="bg-white px-1 rounded border text-pink-400">{"{{event_type}}"}</code>, <code className="bg-white px-1 rounded border text-pink-400">{"{{event_date}}"}</code>, <code className="bg-white px-1 rounded border text-pink-400">{"{{status}}"}</code> as placeholders.
          </p>

          <div className="mb-3">
            <label className="text-sm font-medium text-gray-600 block mb-1">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" placeholder="Email subject..." />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 block mb-1">Message</label>
            <textarea rows={8} value={body} onChange={e => setBody(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" placeholder="Your message..." />
          </div>

          {/* Save as template */}
          <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <label className="text-xs font-medium text-gray-500 block mb-2">Save as Template</label>
            <div className="flex gap-2">
              <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <button onClick={handleSaveTemplate} disabled={saving || !templateName || !subject || !body}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <Save className="w-3.5 h-3.5" />
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending || !subject || !body}
              className="flex-1 flex items-center justify-center gap-2 bg-pink-400 hover:bg-pink-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}