import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// Strip HTML tags + Gmail quoted-reply chains so previews are clean
function cleanPreview(html, text) {
  const raw = text || html || '';
  // Strip HTML tags
  let plain = raw.replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  // Strip quoted reply chain ("On <date> ... wrote:")
  plain = plain.split(/On .+ wrote:/i)[0];
  // Strip leading "> " markers
  plain = plain.split('\n').filter(l => !l.trim().startsWith('>')).join('\n');
  return plain.replace(/\s+/g, ' ').trim();
}

export default function EmailMessageItem({ message, isHighlighted }) {
  const [open, setOpen] = useState(false);
  const isInbound = message.direction === 'inbound';
  const isFailed = message.send_status === 'failed';
  const isWelcome = message.is_welcome;

  const STUDIO_EMAIL = 'events@pilatesinpinkstudio.com';
  const senderName = isInbound
    ? (message.from_name || message.from_email || 'Client')
    : (isWelcome ? `Auto-Confirmation · ${STUDIO_EMAIL}` : `${message.sent_by || 'Staff'} · ${STUDIO_EMAIL}`);

  const preview = cleanPreview(message.body_html, message.body_text);
  const time = message.sent_at ? format(new Date(message.sent_at), 'MMM d, h:mm a') : '';

  // Welcome bubble — compact special style
  if (isWelcome) {
    return (
      <div className="flex justify-end" data-msg-id={message.id}>
        <div
          onClick={() => setOpen(true)}
          className={`max-w-[80%] cursor-pointer rounded-2xl rounded-br-sm px-4 py-2.5 transition-all ${
            isHighlighted ? 'ring-4 ring-yellow-300 ring-offset-2' : ''
          }`}
          style={{ background: 'linear-gradient(135deg,#fce7eb,#f9d4dc)', border: '1px solid #f7b1bd' }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#e86c84' }} />
            <span className="text-xs font-semibold" style={{ color: '#e86c84' }}>Auto-Confirmation Sent</span>
          </div>
          <p className="text-xs line-clamp-1" style={{ color: '#9a5a6a' }}>{preview.slice(0, 80) || 'Welcome email sent on inquiry submission'}</p>
          <p className="text-[10px] mt-1" style={{ color: '#c48a96' }}>{time}</p>
        </div>
        <FullModal open={open} setOpen={setOpen} message={message} />
      </div>
    );
  }

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`} data-msg-id={message.id}>
      <div
        onClick={() => setOpen(true)}
        className={`max-w-[80%] cursor-pointer rounded-2xl px-4 py-3 transition-all ${
          isInbound ? 'rounded-bl-sm' : 'rounded-br-sm'
        } ${isHighlighted ? 'ring-4 ring-yellow-300 ring-offset-2' : ''}`}
        style={
          isFailed
            ? { background: '#fee2e2', border: '1px solid #fca5a5' }
            : isInbound
            ? { background: 'white', border: '1px solid #e5e7eb' }
            : { background: '#fce7eb', border: '1px solid #f7b1bd' }
        }
      >
        {isFailed && (
          <div className="flex items-center gap-1 mb-1 text-xs font-bold" style={{ color: '#dc2626' }}>
            <AlertTriangle className="w-3 h-3" /> FAILED TO SEND
          </div>
        )}
        <p className="text-xs font-semibold mb-1" style={{ color: isInbound ? '#7a6b8f' : '#e86c84' }}>
          {senderName}
        </p>
        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: '#4a3838' }}>
          {preview || '(no content)'}
        </p>
        {preview.length > 140 && (
          <p className="text-[10px] mt-1 italic" style={{ color: '#9a7070' }}>Tap to view full message</p>
        )}
        <p className="text-[10px] mt-1" style={{ color: '#9a7070' }}>{time}</p>
      </div>
      <FullModal open={open} setOpen={setOpen} message={message} />
    </div>
  );
}

function FullModal({ open, setOpen, message }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base" style={{ color: '#6b4e4e' }}>{message.subject || '(no subject)'}</DialogTitle>
        </DialogHeader>
        <div className="text-xs space-y-0.5 pb-3 border-b" style={{ color: '#9a7070', borderColor: '#f7b1bd' }}>
          <p><strong>From:</strong> {message.from_name ? `${message.from_name} <${message.from_email}>` : message.from_email}</p>
          <p><strong>To:</strong> {message.to_email}</p>
          <p><strong>Date:</strong> {message.sent_at ? format(new Date(message.sent_at), 'PPpp') : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto pt-3">
          {message.body_html ? (
            <div
              className="prose prose-sm max-w-none"
              style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", fontSize: '14px', lineHeight: '1.6', color: '#333' }}
              dangerouslySetInnerHTML={{ __html: message.body_html }}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#4a3838' }}>{message.body_text || '(no content)'}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}