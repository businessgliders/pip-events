import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Lightbulb, Bold, Italic, List, Link as LinkIcon, Send, Trash2, Wand2, X, Loader2, Paperclip, Plus, FileText, CheckCircle2 } from 'lucide-react';
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

const DRAFT_KEY = (ticketId) => `email_draft_${ticketId}`;
const AUTOSAVE_INTERVAL_MS = 30 * 1000; // 30 seconds

export default function EmailComposer({ ticket, currentUser, onSent, onCancel, autoFocus, onDirtyChange, saveDraftRef }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [showDescribe, setShowDescribe] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [attachments, setAttachments] = useState([]); // { name, size, type, url, uploading }
  const [uploadingCount, setUploadingCount] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const isDirtyRef = useRef(false);

  const setDirty = (val) => {
    if (isDirtyRef.current !== val) {
      isDirtyRef.current = val;
      onDirtyChange?.(val);
    }
  };

  // Restore draft on mount (per ticket)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(ticket.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.html && editorRef.current) {
          editorRef.current.innerHTML = parsed.html;
          setEmpty(isEditorEmpty(parsed.html));
        }
        if (Array.isArray(parsed.attachments)) {
          setAttachments(parsed.attachments.map(a => ({
            ...a,
            uploading: false,
            previewUrl: null,
            tmpId: a.tmpId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          })));
        }
        if (parsed.savedAt) setDraftSavedAt(parsed.savedAt);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  // Auto-focus editor when deep-linked from owner email button
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.focus();
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [autoFocus]);

  const saveDraft = useCallback(() => {
    const html = editorRef.current?.innerHTML || '';
    const persistableAttachments = attachments
      .filter(a => a.url && !a.uploading)
      .map(({ name, size, type, url, tmpId }) => ({ name, size, type, url, tmpId }));
    const hasContent = !isEditorEmpty(html) || persistableAttachments.length > 0;
    if (!hasContent) {
      localStorage.removeItem(DRAFT_KEY(ticket.id));
      setDraftSavedAt(null);
      setDirty(false);
      return;
    }
    const now = Date.now();
    localStorage.setItem(DRAFT_KEY(ticket.id), JSON.stringify({
      html,
      attachments: persistableAttachments,
      savedAt: now,
    }));
    setDraftSavedAt(now);
    setDirty(false);
  }, [attachments, ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic auto-save
  useEffect(() => {
    const id = setInterval(() => {
      if (isDirtyRef.current) saveDraft();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [saveDraft]);

  // Expose imperative save + discard to parent
  useEffect(() => {
    if (saveDraftRef) {
      saveDraftRef.current = {
        save: () => saveDraft(),
        discard: () => {
          if (editorRef.current) editorRef.current.innerHTML = '';
          setEmpty(true);
          setAttachments([]);
          localStorage.removeItem(DRAFT_KEY(ticket.id));
          setDraftSavedAt(null);
          isDirtyRef.current = false;
          onDirtyChange?.(false);
        },
      };
    }
  }, [saveDraft, ticket.id, saveDraftRef, onDirtyChange]);

  // Warn on browser navigation/refresh while dirty
  useEffect(() => {
    const handler = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const clearDraftStorage = () => {
    localStorage.removeItem(DRAFT_KEY(ticket.id));
    setDraftSavedAt(null);
    setDirty(false);
  };

  const setEditorHtml = (html) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      setEmpty(isEditorEmpty(html));
      setDirty(true);
    }
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || '';

  const handleInput = () => {
    setEmpty(isEditorEmpty(getEditorHtml()));
    setDirty(true);
  };

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
      .map(a => ({ url: a.url, filename: a.name, contentType: a.type, size: a.size }));
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
      clearDraftStorage();
      onSent?.();
    } else {
      alert('Failed to send: ' + (res?.data?.error || 'unknown error'));
    }
  };

  const handleFilesPicked = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // reset so same file can be re-picked later
    if (files.length === 0) return;

    // Optimistic placeholders — generate local preview URL for images
    const placeholders = files.map(f => {
      const type = f.type || 'application/octet-stream';
      const isImage = type.startsWith('image/');
      return {
        name: f.name,
        size: f.size,
        type,
        url: null,
        previewUrl: isImage ? URL.createObjectURL(f) : null,
        uploading: true,
        tmpId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
    });
    setAttachments(prev => [...prev, ...placeholders]);
    setUploadingCount(c => c + files.length);
    setDirty(true);

    await Promise.all(files.map(async (file, idx) => {
      const tmpId = placeholders[idx].tmpId;
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        // SDK returns { file_url } directly (not wrapped in { data })
        const uploadedUrl = res?.file_url || res?.url || res?.data?.file_url || res?.data?.url;
        if (!uploadedUrl) throw new Error('No file_url returned');
        setAttachments(prev => prev.map(a =>
          a.tmpId === tmpId ? { ...a, url: uploadedUrl, uploading: false } : a
        ));
      } catch (err) {
        setAttachments(prev => prev.filter(a => a.tmpId !== tmpId));
        alert(`Failed to upload ${file.name}: ${err.message || ''}`);
      } finally {
        setUploadingCount(c => c - 1);
      }
    }));
  };

  const removeAttachment = (tmpId) => {
    setAttachments(prev => {
      const target = prev.find(a => a.tmpId === tmpId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(a => a.tmpId !== tmpId);
    });
    setDirty(true);
  };

  // Cleanup any blob URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(a => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setAttachments([]);
    clearDraftStorage();
  };

  const formatSavedTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map(a => {
            const isImage = a.type?.startsWith('image/');
            if (isImage && a.previewUrl) {
              return (
                <div
                  key={a.tmpId}
                  className="relative group rounded-md overflow-hidden"
                  style={{ border: '1px solid rgba(247,177,189,0.5)', background: 'white' }}
                  title={`${a.name}${a.size ? ` · ${formatBytes(a.size)}` : ''}`}
                >
                  <img
                    src={a.previewUrl}
                    alt={a.name}
                    className="block object-cover"
                    style={{ width: 64, height: 64 }}
                  />
                  {a.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(a.tmpId)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/90 hover:bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="w-3 h-3" style={{ color: '#6b4e4e' }} />
                  </button>
                </div>
              );
            }
            return (
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
            );
          })}
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
            disabled={empty && attachments.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
            style={{ background: 'rgba(220,200,205,0.2)', color: '#9a7070', border: '1px solid rgba(220,200,205,0.5)' }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
          {draftSavedAt && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: '#10b981' }} title={`Draft auto-saved at ${new Date(draftSavedAt).toLocaleString()}`}>
              <CheckCircle2 className="w-3 h-3" />
              Draft saved {formatSavedTime(draftSavedAt)}
            </span>
          )}
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