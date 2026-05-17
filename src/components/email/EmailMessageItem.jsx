import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, AlertTriangle, Check, Paperclip, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { format } from 'date-fns';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentChips({ attachments, compact }) {
  if (!attachments?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
      {attachments.map((a, i) => {
        const isImage = (a.content_type || '').startsWith('image/');
        const Icon = isImage ? ImageIcon : FileText;
        return (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`${a.filename}${a.size ? ` · ${formatBytes(a.size)}` : ''}`}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-pink-100"
            style={{ background: 'rgba(247,177,189,0.18)', border: '1px solid rgba(247,177,189,0.5)', color: '#6b4e4e' }}
          >
            <Icon className="w-3 h-3" style={{ color: '#e86c84' }} />
            <span className="max-w-[140px] truncate font-medium">{a.filename}</span>
            {a.size ? <span className="text-[9px]" style={{ color: '#9a7070' }}>{formatBytes(a.size)}</span> : null}
            {!compact && <Download className="w-2.5 h-2.5 ml-0.5" style={{ color: '#9a7070' }} />}
          </a>
        );
      })}
    </div>
  );
}

// Strip HTML tags + Gmail quoted-reply chains + signatures so previews are clean
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
  // Strip signature (anything after "Pilates in Pink" or similar signature markers)
  plain = plain.split(/Pilates in Pink|--+/i)[0];
  return plain.replace(/\s+/g, ' ').trim();
}

export default function EmailMessageItem({ message, isHighlighted, isUnread, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const isInbound = message.direction === 'inbound';
  const isFailed = message.send_status === 'failed';
  const isWelcome = message.is_welcome;
  const showUnread = isUnread && isInbound && !message.__synthetic;

  const STUDIO_EMAIL = 'events@pilatesinpinkstudio.com';
  const senderName = isInbound
    ? (message.from_name || message.from_email || 'Client')
    : (isWelcome ? `Auto-Confirmation · ${STUDIO_EMAIL}` : STUDIO_EMAIL);

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

  const handleOpen = () => {
    setOpen(true);
    if (showUnread && onMarkRead) onMarkRead(message.id);
  };

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} relative`} data-msg-id={message.id}>
      <div
        onClick={handleOpen}
        className={`max-w-[80%] cursor-pointer rounded-2xl px-4 py-3 transition-all relative ${
          isInbound ? 'rounded-bl-sm' : 'rounded-br-sm'
        } ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 animate-bubble-pulse' : ''} ${showUnread ? 'shadow-md' : ''}`}
        style={
          isFailed
            ? { background: '#fee2e2', border: '1px solid #fca5a5' }
            : isInbound
            ? { background: showUnread ? '#fffbeb' : 'white', border: showUnread ? '1px solid #fcd34d' : '1px solid #e5e7eb' }
            : { background: '#fce7eb', border: '1px solid #f7b1bd' }
        }
      >
        {isFailed && (
          <div className="flex items-center gap-1 mb-1 text-xs font-bold" style={{ color: '#dc2626' }}>
            <AlertTriangle className="w-3 h-3" /> FAILED TO SEND
          </div>
        )}
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-semibold" style={{ color: isInbound ? '#7a6b8f' : '#e86c84' }}>
            {senderName}
          </p>
          {showUnread && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: '#f59e0b' }}>
              NEW
            </span>
          )}
        </div>
        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: '#4a3838' }}>
          {preview || '(no content)'}
        </p>
        {message.attachments?.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold" style={{ color: '#e86c84' }}>
            <Paperclip className="w-2.5 h-2.5" />
            {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
          </div>
        )}
        <AttachmentChips attachments={message.attachments} compact />
        {preview.length > 140 && (
          <p className="text-[10px] mt-1 italic" style={{ color: '#9a7070' }}>Tap to view full message</p>
        )}
        <div className="flex items-center justify-between mt-1 gap-2">
          <p className="text-[10px]" style={{ color: '#9a7070' }}>{time}</p>
          {showUnread && onMarkRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkRead(message.id); }}
              title="Mark as read"
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full hover:bg-white transition-colors"
              style={{ color: '#92400e', background: 'rgba(252,211,77,0.3)', border: '1px solid #fcd34d' }}
            >
              <Check className="w-2.5 h-2.5" /> Mark read
            </button>
          )}
        </div>
      </div>
      <FullModal open={open} setOpen={setOpen} message={message} />
      <style>{`
        @keyframes bubble-pulse {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.03); }
          50% { transform: scale(1); }
          75% { transform: scale(1.03); }
        }
        .animate-bubble-pulse { animation: bubble-pulse 1.2s ease-in-out 2; }
      `}</style>
    </div>
  );
}

function FullModal({ open, setOpen, message }) {
  const [lightboxAttachment, setLightboxAttachment] = useState(null);

  const handleAttachmentClick = (e, attachment) => {
    e.preventDefault();
    e.stopPropagation();
    const isImage = (attachment.content_type || '').startsWith('image/');
    if (isImage) {
      setLightboxAttachment(attachment);
    } else {
      // For non-images, download directly
      window.open(attachment.url, '_blank');
    }
  };

  return (
    <>
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
            {message.attachments?.length > 0 && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: '#f7b1bd' }}>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: '#e86c84' }}>
                  <Paperclip className="w-3 h-3" />
                  {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((a, i) => {
                    const isImage = (a.content_type || '').startsWith('image/');
                    if (isImage) {
                      return (
                        <button
                          key={i}
                          onClick={(e) => handleAttachmentClick(e, a)}
                          title={`${a.filename}${a.size ? ` · ${formatBytes(a.size)}` : ''}`}
                          className="group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-pink-400 transition-all"
                          style={{ border: '1px solid rgba(247,177,189,0.5)', background: 'white' }}
                        >
                          <img
                            src={a.url}
                            alt={a.filename}
                            className="block object-cover"
                            style={{ width: 96, height: 96 }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[9px] truncate text-white text-left" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                            {a.filename}
                          </div>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={i}
                        onClick={(e) => handleAttachmentClick(e, a)}
                        title={`${a.filename}${a.size ? ` · ${formatBytes(a.size)}` : ''}`}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-pink-100 self-start"
                        style={{ background: 'rgba(247,177,189,0.18)', border: '1px solid rgba(247,177,189,0.5)', color: '#6b4e4e' }}
                      >
                        <FileText className="w-3 h-3" style={{ color: '#e86c84' }} />
                        <span className="max-w-[140px] truncate font-medium">{a.filename}</span>
                        {a.size ? <span className="text-[9px]" style={{ color: '#9a7070' }}>{formatBytes(a.size)}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for image attachments — rendered via portal to sit above Radix Dialog */}
      {lightboxAttachment && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur"
          style={{ zIndex: 9999 }}
          onClick={() => setLightboxAttachment(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxAttachment.url}
              alt={lightboxAttachment.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-sm mt-3 text-center">{lightboxAttachment.filename}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxAttachment(null); }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-black hover:bg-gray-200 flex items-center justify-center text-xl font-bold shadow-lg"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}