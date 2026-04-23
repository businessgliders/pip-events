import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, ChevronDown, Eye, X, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function EmailPreviewModal({ log, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'}}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{background: 'white', boxShadow: '0 24px 80px rgba(0,0,0,0.25)'}}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{borderBottom: '1px solid rgba(247,177,189,0.4)', background: 'rgba(251,224,226,0.2)'}}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{color: '#b67651'}}>Email Preview</p>
            <p className="text-sm font-semibold mt-0.5" style={{color: '#6b4e4e'}}>{log.subject}</p>
            <p className="text-xs mt-0.5" style={{color: '#c48a96'}}>
              {log.direction === 'inbound' ? `From: ${log.from || 'Client'}` : `To: client`}
              {log.sent_at ? ` · ${format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-pink-50 transition-colors" style={{color: '#c48a96'}}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Email body */}
        <div className="flex-1 overflow-y-auto p-5">
          {log.body_html ? (
            <div
              className="prose prose-sm max-w-none"
              style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '14px', lineHeight: '1.6', color: '#333'}}
              dangerouslySetInnerHTML={{ __html: log.body_html }}
            />
          ) : (
            <p className="text-sm" style={{color: '#9a7070'}}>No email body available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

const interpolate = (text, request) => (text || '')
  .replace(/\{\{name\}\}/g, request.full_name || '')
  .replace(/\{\{email\}\}/g, request.email || '')
  .replace(/\{\{event_type\}\}/g, request.event_type || '')
  .replace(/\{\{event_date\}\}/g, request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '')
  .replace(/\{\{status\}\}/g, request.status || '');

export default function EmailCommsPanel({ request, onUpdate }) {
  const defaultSubject = `🎉 New Event Request: ${request.event_type || 'Event'} — ${request.full_name || ''}${request.event_date ? ` (${request.event_date})` : ''}`;
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewLog, setPreviewLog] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 50),
  });

  const { data: settingsRows = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const signature = settingsRows.find(s => s.key === 'signature')?.value || '';

  // Always use the latest email_log from the request prop (kept live via subscription in parent)
  const rawLog = request.email_log || [];

  // If there's no "initial" confirmation entry logged (e.g. older/imported records),
  // synthesize a placeholder so admins always see it was sent on submission.
  const hasInitial = rawLog.some(e => e.direction === 'initial');
  const emailLog = hasInitial ? rawLog : [
    {
      sent_at: request.submitted_date || request.created_date,
      direction: 'initial',
      template_name: 'Auto-Confirmation',
      subject: `Thank You, ${request.full_name || ''}! Your Event Request Has Been Received 💕`,
      body_html: `<p>Auto-confirmation email was sent to <strong>${request.email}</strong> on submission.</p><p style="color:#9a7070;font-size:13px;">(Full content not stored for this request.)</p>`,
      _synthetic: true,
    },
    ...rawLog,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [emailLog.length]);

  const getSignatureHtml = () => {
    if (!signature) {
      return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f7b1bd;">
        <img src="${LOGO_URL}" width="40" style="display:block;margin-bottom:6px;" />
        <span style="font-size:13px;font-weight:600;color:#b67651;">Pilates in Pink™ Studio</span>
      </div>`;
    }
    return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f7b1bd;">${signature}</div>`;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Data = ev.target.result.split(',')[1];
        setAttachments(prev => [...prev, {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data,
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLoadTemplate = (t) => {
    setSelectedTemplate(t);
    setSubject(interpolate(t.subject, request));
    setBody(interpolate(t.body, request));
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);

    const fullHtml = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        ${body}
        ${getSignatureHtml()}
      </div>
    `;

    await base44.functions.invoke('sendDashboardEmail', {
      to: request.email,
      subject,
      html: fullHtml,
      requestId: request.id,
      attachments: attachments.map(a => ({ filename: a.filename, mimeType: a.mimeType, base64Data: a.base64Data })),
      logEntry: {
        sent_at: new Date().toISOString(),
        direction: 'outbound',
        template_name: selectedTemplate?.name || 'Custom',
        subject,
        body_html: fullHtml,
        attachments: attachments.map(a => ({ filename: a.filename, size: a.size })),
      },
    });

    setSubject(defaultSubject);
    setBody('');
    setSelectedTemplate(null);
    setAttachments([]);
    setSending(false);
    onUpdate();
  };

  return (
    <div className="flex flex-col h-full">
      {previewLog && <EmailPreviewModal log={previewLog} onClose={() => setPreviewLog(null)} />}
      {/* Header */}
      <div className="px-5 py-3 flex-shrink-0" style={{borderBottom: '1px solid rgba(247,177,189,0.3)', background: 'rgba(251,224,226,0.15)'}}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{color: '#b67651'}}>Email Communications</p>
        <p className="text-xs mt-0.5" style={{color: '#c48a96'}}>{request.email}</p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {emailLog.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{color: '#d4b8bc'}}>No emails sent yet.</p>
            <p className="text-xs mt-1" style={{color: '#e0c4c8'}}>The initial confirmation email was sent automatically on submission.</p>
          </div>
        ) : (
          emailLog.map((log, i) => {
            const isInitial = log.direction === 'initial';
            const isInbound = log.direction === 'inbound';
            return (
            <div key={i} className={`flex ${isInitial || isInbound ? 'justify-start' : 'justify-end'}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3 group relative cursor-pointer"
                onClick={() => setPreviewLog(log)}
                style={isInbound ? {
                  background: 'rgba(122,107,143,0.08)',
                  border: '1px solid rgba(122,107,143,0.2)',
                } : isInitial ? {
                  background: 'rgba(241,136,155,0.08)',
                  border: '1px solid rgba(241,136,155,0.2)',
                } : {
                  background: 'linear-gradient(135deg, rgba(241,136,155,0.15), rgba(232,108,132,0.1))',
                  border: '1px solid rgba(241,136,155,0.3)',
                }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{color: isInitial ? '#c48a96' : log.direction === 'inbound' ? '#7a6b8f' : '#e86c84'}}>
                      {isInitial ? '📬 Auto-Confirmation' : log.direction === 'inbound' ? '↩️ Client Reply' : '✉️ You'}
                    </span>
                    <span className="text-xs" style={{color: '#d4b8bc'}}>
                      {log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : ''}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold mb-1" style={{color: '#7a4a3a'}}>{log.subject}</p>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{background: 'rgba(241,136,155,0.12)', color: '#e86c84', border: '1px solid rgba(241,136,155,0.25)'}}>
                      <Eye className="w-3 h-3" /> View
                    </span>
                  </div>
                  {log.body_html ? (
                    <div
                      className="text-xs leading-relaxed email-preview"
                      style={{color: '#9a7070', maxHeight: '60px', overflow: 'hidden'}}
                      dangerouslySetInnerHTML={{ __html: log.body_html.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...' }}
                    />
                  ) : (
                    <p className="text-xs" style={{color: '#9a7070'}}>
                      {log.template_name ? `Template: ${log.template_name}` : 'Email sent'}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t" style={{borderColor: 'rgba(247,177,189,0.3)'}}>
        {/* Template quick-pick bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{background: 'rgba(241,136,155,0.1)', color: '#e86c84', border: '1px solid rgba(241,136,155,0.25)'}}
            >
              ⚡ Templates <ChevronDown className="w-3 h-3" />
            </button>

            {showTemplates && templates.length > 0 && (
              <div
                className="absolute bottom-9 left-0 w-72 rounded-2xl shadow-xl z-10 py-2"
                style={{background: 'white', border: '1.5px solid rgba(247,177,189,0.4)', boxShadow: '0 8px 32px rgba(241,136,155,0.15)'}}
              >
                <p className="text-xs font-bold uppercase tracking-wide px-3 pb-2 pt-1" style={{color: '#c48a96', borderBottom: '1px solid rgba(247,177,189,0.2)'}}>
                  Saved Templates
                </p>
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleLoadTemplate(t)}
                    className="w-full text-left px-3 py-2 hover:bg-pink-50 transition-colors"
                  >
                    <p className="text-sm font-medium" style={{color: '#6b4e4e'}}>{t.name}</p>
                    <p className="text-xs truncate" style={{color: '#c48a96'}}>{t.subject}</p>
                  </button>
                ))}
                {templates.length === 0 && (
                  <p className="text-xs text-center py-3" style={{color: '#d4b8bc'}}>No templates saved yet.</p>
                )}
              </div>
            )}

            {showTemplates && templates.length === 0 && (
              <div
                className="absolute bottom-9 left-0 w-64 rounded-2xl shadow-xl z-10 py-3 px-4 text-center"
                style={{background: 'white', border: '1.5px solid rgba(247,177,189,0.4)'}}
              >
                <p className="text-xs" style={{color: '#d4b8bc'}}>No templates yet. Create them in Settings.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 pt-2 space-y-2">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject..."
            className="w-full text-sm px-3 py-2 rounded-xl focus:outline-none"
            style={{background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(220,200,205,0.6)', color: '#6b4e4e'}}
          />

          {/* Rich text editor */}
          <div className="rounded-xl overflow-hidden" style={{border: '1.5px solid rgba(220,200,205,0.6)'}}>
            <ReactQuill
              value={body}
              onChange={setBody}
              placeholder="Write your message..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link'],
                  ['clean'],
                ],
              }}
              style={{fontSize: '13px'}}
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{background: 'rgba(241,136,155,0.1)', border: '1px solid rgba(241,136,155,0.3)', color: '#e86c84'}}>
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">{att.filename}</span>
                  <span style={{color: '#c4b0b5'}}>({(att.size / 1024).toFixed(0)}KB)</span>
                  <button onClick={() => removeAttachment(idx)} className="ml-0.5 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{color: '#d4b8bc'}}>Signature auto-appended</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-all"
                style={{background: 'rgba(220,200,205,0.2)', border: '1px solid rgba(220,200,205,0.5)', color: '#c48a96'}}
              >
                <Paperclip className="w-3 h-3" /> Attach
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.replace(/<[^>]*>/g, '').trim()}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.3)'}}
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}