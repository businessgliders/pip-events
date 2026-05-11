import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function EventTypeMultiSelect({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(s => s !== val));
    else onChange([...selected, val]);
  };

  const label = selected.length === 0
    ? 'All Event Types'
    : selected.length === 1
    ? selected[0]
    : `${selected.length} types selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm bg-white/70 focus:outline-none"
        style={{ border: '1.5px solid rgba(220,200,205,0.6)', color: '#7a4a3a', minWidth: 180 }}
      >
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="p-0.5 rounded-full hover:bg-pink-100"
              role="button"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" style={{ color: '#c48a96' }} />
            </span>
          )}
          <ChevronDown className="w-4 h-4" style={{ color: '#c48a96' }} />
        </div>
      </button>

      {open && (
        <div
          className="absolute mt-1 left-0 right-0 rounded-xl py-1.5 max-h-72 overflow-y-auto"
          style={{
            zIndex: 100,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(220,200,205,0.6)',
            boxShadow: '0 12px 32px rgba(241,136,155,0.2)',
          }}
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: '#c48a96' }}>No event types</div>
          )}
          {options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-pink-50 transition-colors"
                style={{ color: '#7a4a3a' }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: checked ? '#f1889b' : 'white',
                    border: checked ? 'none' : '1.5px solid #d4b8bb',
                  }}
                >
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}