import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Lightbulb, Bold, Italic, List, Link as LinkIcon, Send, Trash2, Wand2, X, Loader2, Paperclip, Plus, FileText } from 'lucide-react';
import TemplatePicker from './TemplatePicker';
import AiAssistBar from './AiAssistBar';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isEditorEmpty(html) {
  return !(html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
}

export default function EmailComposer({ ticket, currentUser, onSent, onCancel, autoFocus }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [showDescribe, setShowDescribe] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [attachments, setAttachments] = useState([]); // { name, size, type, url, uploading }
  const [uploadingCount, setUploadingCount] = useState(0);

  // Auto-focus editor when deep-linked from owner email button
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.focus();
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [autoFocus]);

  const setEditorHtml = (html) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      setEmpty(isEditorEmpty(html));
    }
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || '';

  const handleInput = () => setEmpty(isEditorEmpty(getEditorHtml()));

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
  };

  const handleSend = async () => {
    const html = getEditorHtml();
    if (isEditorEmpty(html)) return;
    setSending(true);
    const readyAttachments = attachments
      .filter(a => a.url && !a.uploading)
      .map(a => ({ url: a.url, filename: a.name, contentType: a.type }));
    const res = await base44.functions.invoke('sendTicketEmail', {
      ticket_id: ticket.id,
      body_html: html,
      attachments: readyAttachments,
    });
    setSending(false);
    if (res?.data?.success) {
      setEditorHtml('');
      setAttachments([]);
      setShowDescribe(false);
      setShowSuggest(false);
      onSent?.();
    } else {
      alert('Failed to send: ' + (res?.data?.error || 'unknown error'));
    }
  };

  const handleFilesPicked = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // reset so same file can be re-picked later
    if (files.length === 0) return;

    // Optimistic placeholders
    const placeholders = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      url: null,
      uploading: true,
      tmpId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }));
    setAttachments(prev => [...prev, ...placeholders]);
    setUploadingCount(c => c + files.length);

    await Promise.all(files.map(async (file, idx) => {
      const tmpId = placeholders[idx].tmpId;
      try {
        const { data } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => prev.map(a =>
          a.tmpId === tmpId ? { ...a, url: data?.file_url || data?.url, uploading: false } : a
        ));
      } catch (err) {
        setAttachments(prev => prev.filter(a => a.tmpId !== tmpId));
        alert(`Failed to upload ${file.name}`);
      } finally {
        setUploadingCount(c => c - 1);
      }
    }));
  };

  const removeAttachment = (tmpId) => {
    setAttachments(prev => prev.filter(a => a.tmpId !== tmpId));
  };

  const handlePolish = async () => {
    const draft = getEditorHtml();
    if (isEditorEmpty(draft)) return;
    setPolishing(true);
    const res = await base44.functions.invoke('aiEmailAssist', { mode: 'polish', ticket_id: ticket.id, draft });
    setPolishing(false);
    if (res?.data?.body_html) setEditorHtml(res.data.body_html);
  };

  const handleClear = () => {
    if (!isEditorEmpty(getEditorHtml()) && !window.confirm('Clear the draft?')) return;
    setEditorHtml('');
  };

  const handleTemplate = ({ body_html }) => setEditorHtml(body_html);

  return (
    <div className="rounded-xl p-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(247,177,189,0.4)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs" style={{ color: '#9a7070' }}>
          To: <span className="font-semibold" style={{ color: '#6b4e4e' }}>{ticket.email}</span>
        </p>
        {onCancel && (
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-pink-50">
            <X className="w-3.5 h-3.5" style={{ color: '#9a7070' }} />
          </button>
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          onClick={() => { setShowDescribe(v => !v); setShowSuggest(false); }}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{ background: showDescribe ? '#7c3aed' : '#f5f3ff', color: showDescribe ? 'white' : '#7c3aed', border: '1px solid #e9d5ff' }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Describe in simple words
        </button>
        <button
          onClick={() => { setShowSuggest(v => !v); setShowDescribe(false); }}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{ background: showSuggest ? '#7c3aed' : '#f5f3ff', color: showSuggest ? 'white' : '#7c3aed', border: '1px solid #e9d5ff' }}
        >
          <Lightbulb className="w-3.5 h-3.5" /> Suggest replies
        </button>
        <TemplatePicker ticket={ticket} currentUser={currentUser} onSelect={handleTemplate} />
      </div>

      {/* AI panels */}
      <AiAssistBar
        ticketId={ticket.id}
        showDescribe={showDescribe}
        showSuggest={showSuggest}
        onApply={(html) => setEditorHtml(html)}
      />

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 mt-3 pb-2 mb-2 border-b" style={{ borderColor: 'rgba(247,177,189,0.3)' }}>
        <button onClick={() => exec('bold')} className="p-1.5 rounded hover:bg-pink-50" title="Bold"><Bold className="w-3.5 h-3.5" style={{ color: '#6b4e4e' }} /></button>
        <button onClick={() => exec('italic')} className="p-1.5 rounded hover:bg-pink-50" title="Italic"><Italic className="w-3.5 h-3.5" style={{ color: '#6b4e4e' }} /></button>
        <button onClick={() => exec('insertUnorderedList')} className="p-1.5 rounded hover:bg-pink-50" title="Bullet list"><List className="w-3.5 h-3.5" style={{ color: '#6b4e4e' }} /></button>
        <button onClick={handleLink} className="p-1.5 rounded hover:bg-pink-50" title="Insert link"><LinkIcon className="w-3.5 h-3.5" style={{ color: '#6b4e4e' }} /></button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Write your reply…"
        className="prose prose-sm max-w-none focus:outline-none px-2 py-2 rounded-lg empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight: 80, maxHeight: 240, overflowY: 'auto', background: 'white', border: '1px solid #e5e7eb', fontSize: '14px', color: '#333' }}
      />

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {attachments.map(a => (
            <div
              key={a.tmpId}
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
              style={{ background: 'rgba(247,177,189,0.18)', border: '1px solid rgba(247,177,189,0.5)', color: '#6b4e4e' }}
            >
              {a.uploading
                ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#e86c84' }} />
                : <FileText className="w-3 h-3" style={{ color: '#e86c84' }} />
              }
              <span className="max-w-[180px] truncate font-medium">{a.name}</span>
              {a.size ? <span className="text-[10px]" style={{ color: '#9a7070' }}>{formatBytes(a.size)}</span> : null}
              <button
                onClick={() => removeAttachment(a.tmpId)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-pink-100"
                title="Remove"
              >
                <X className="w-3 h-3" style={{ color: '#9a7070' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesPicked}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all"
            style={{ background: '#fdf2f4', color: '#e86c84', border: '1px solid #f7b1bd' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePolish}
            disabled={polishing || empty}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
            style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
          >
            {polishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {polishing ? 'Polishing…' : 'Polish'}
          </button>
          <button
            onClick={handleClear}
            disabled={empty}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
            style={{ background: 'rgba(220,200,205,0.2)', color: '#9a7070', border: '1px solid rgba(220,200,205,0.5)' }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={sending || empty || uploadingCount > 0}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#f1889b,#e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.3)' }}
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? 'Sending…' : uploadingCount > 0 ? 'Uploading…' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}