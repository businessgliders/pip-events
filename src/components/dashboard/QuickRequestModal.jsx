import { useEffect } from 'react';
import { X } from 'lucide-react';
import RequestForm from '../../pages/RequestForm';

export default function QuickRequestModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
      style={{ background: 'rgba(58, 31, 31, 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-2xl overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '1px solid rgba(247,177,189,0.55)',
          boxShadow: '0 30px 80px -10px rgba(58,31,31,0.55), 0 10px 30px rgba(241,136,155,0.35), 0 0 0 8px rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 hover:bg-white shadow-md transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" style={{ color: '#5a3535' }} />
        </button>
        <div className="w-full h-full overflow-y-auto">
          <RequestForm />
        </div>
      </div>
    </div>
  );
}