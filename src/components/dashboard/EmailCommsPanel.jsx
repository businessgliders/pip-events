import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, ChevronDown, Paperclip, Bold, Italic, List, Smile } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

const interpolate = (text, request) => (text || '')
  .replace(/\{\{name\}\}/g, request.full_name || '')
  .replace(/\{\{email\}\}/g, request.email || '')
  .replace(/\{\{event_type\}\}/g, request.event_type || '')
  .replace(/\{\{event_date\}\}/g, request.event_date ? format(new Date(request.event_date + 'T12:00:00'), 'MMMM d, yyyy') : '')
  .replace(/\{\{status\}\}/g, request.status || '');

export default function EmailCommsPanel({ request, onUpdate }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
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

  // Build the email log (include initial submission email as first entry)
  const emailLog = request.email_log || [];

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

    await base44.integrations.Core.SendEmail({
      to: request.email,
      subject,
      body: fullHtml,
      from_name: 'Pilates in Pink™ Studio',
    });

    const log = request.email_log || [];
    await base44.entities.EventRequest.update(request.id, {
      email_log: [...log, {
        sent_at: new Date().toISOString(),
        direction: 'outbound',
        template_name: selectedTemplate?.name || 'Custom',
        subject,
        body_html: fullHtml,
      }]
    });

    setSubject('');
    setBody('');
    setSelectedTemplate(null);
    setSending(false);
    onUpdate();
  };

  return (
    <div className="flex flex-col h-full">
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
            return (
              <div key={i} className={`flex ${isInitial ? 'justify-start' : 'justify-end'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3"
                  style={isInitial ? {
                    background: 'rgba(241,136,155,0.08)',
                    border: '1px solid rgba(241,136,155,0.2)',
                  } : {
                    background: 'linear-gradient(135deg, rgba(241,136,155,0.15), rgba(232,108,132,0.1))',
                    border: '1px solid rgba(241,136,155,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{color: isInitial ? '#c48a96' : '#e86c84'}}>
                      {isInitial ? '📬 Auto-Confirmation' : '✉️ You'}
                    </span>
                    <span className="text-xs" style={{color: '#d4b8bc'}}>
                      {log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : ''}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{color: '#7a4a3a'}}>{log.subject}</p>
                  {log.body_html ? (
                    <div
                      className="text-xs leading-relaxed email-preview"
                      style={{color: '#9a7070', maxHeight: '120px', overflow: 'hidden', position: 'relative'}}
                      dangerouslySetInnerHTML={{ __html: log.body_html.replace(/<[^>]*>/g, ' ').substring(0, 200) + '...' }}
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

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{color: '#d4b8bc'}}>Signature will be appended automatically</p>
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