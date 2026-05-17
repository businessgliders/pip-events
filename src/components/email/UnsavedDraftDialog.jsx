import { FileEdit, X } from 'lucide-react';

export default function UnsavedDraftDialog({ open, onSaveAndClose, onDiscard, onCancel }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(91, 33, 50, 0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-pop"
        style={{ background: 'linear-gradient(180deg, #fff 0%, #fdf2f4 100%)', border: '1px solid rgba(247,177,189,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex items-start gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(251,224,226,0.6), rgba(255,255,255,0.95))', borderBottom: '1px solid rgba(247,177,189,0.25)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)' }}
          >
            <FileEdit className="w-5 h-5" style={{ color: '#e86c84' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold leading-tight" style={{ color: '#6b4e4e' }}>
              Unsaved draft
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#9a7070' }}>
              You have unsaved changes in your reply. Would you like to save it as a draft before closing?
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-pink-50 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" style={{ color: '#c48a96' }} />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: '#9a3030', background: 'transparent', border: '1px solid rgba(220,200,205,0.7)' }}
          >
            Discard draft
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: '#6b4e4e', background: 'rgba(220,200,205,0.25)', border: '1px solid rgba(220,200,205,0.6)' }}
          >
            Keep editing
          </button>
          <button
            onClick={onSaveAndClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.3)' }}
          >
            Save draft & close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pop {
          0% { opacity: 0; transform: scale(0.95) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-pop { animation: pop 0.2s ease-out; }
      `}</style>
    </div>
  );
}