import { useState } from 'react';
import { Settings2, GripVertical, Check, Save, X } from 'lucide-react';

export default function ColumnCustomizer({ allColumns, visibleKeys, onSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(visibleKeys);

  const toggleCol = (key) => {
    setDraft(d =>
      d.includes(key) ? d.filter(k => k !== key) : [...d, key]
    );
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setDraft(d => {
      const next = [...d];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    setDraft(d => {
      if (idx === d.length - 1) return d;
      const next = [...d];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    onSave(draft);
    setOpen(false);
  };

  const handleOpen = () => {
    setDraft(visibleKeys);
    setOpen(true);
  };

  // Ordered visible + hidden cols for display
  const orderedVisible = draft;
  const hidden = allColumns.filter(c => !draft.includes(c.key));

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        title="Customize columns"
        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
        style={{
          background: open ? 'rgba(241,136,155,0.12)' : 'rgba(255,255,255,0.7)',
          border: '1.5px solid rgba(220,200,205,0.6)',
          color: '#f1889b',
        }}
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0" style={{zIndex: 99998, backgroundColor: 'transparent'}} onClick={() => setOpen(false)} />

          {/* Panel */}
          <div
            className="fixed right-4 top-1/2 -translate-y-1/2 w-64 rounded-2xl shadow-xl"
            style={{
              zIndex: 99999,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(247,177,189,0.5)',
              boxShadow: '0 16px 48px rgba(241,136,155,0.2)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{borderBottom: '1px solid rgba(247,177,189,0.25)'}}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{color: '#b67651'}}>Columns</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSave}
                  title="Save"
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                  style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', color: 'white'}}
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-pink-50"
                  style={{color: '#c4909a'}}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-3 py-3 space-y-1 max-h-80 overflow-y-auto">
              {/* Visible columns (ordered, draggable via up/down) */}
              {orderedVisible.map((key, idx) => {
                const col = allColumns.find(c => c.key === key);
                if (!col) return null;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-2 py-2 rounded-xl"
                    style={{background: 'rgba(241,136,155,0.06)', border: '1px solid rgba(241,136,155,0.15)'}}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-4 h-3 flex items-center justify-center disabled:opacity-20"
                        style={{color: '#f1889b'}}
                      >
                        <svg viewBox="0 0 8 5" className="w-2.5 h-2" fill="currentColor"><path d="M4 0L8 5H0z"/></svg>
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === orderedVisible.length - 1}
                        className="w-4 h-3 flex items-center justify-center disabled:opacity-20"
                        style={{color: '#f1889b'}}
                      >
                        <svg viewBox="0 0 8 5" className="w-2.5 h-2" fill="currentColor"><path d="M4 5L0 0H8z"/></svg>
                      </button>
                    </div>
                    <GripVertical className="w-3 h-3 flex-shrink-0" style={{color: '#dbb8bc'}} />
                    <span className="flex-1 text-xs font-medium" style={{color: '#6b4e4e'}}>{col.label}</span>
                    <button
                      onClick={() => toggleCol(key)}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{background: '#f1889b'}}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                  </div>
                );
              })}

              {/* Hidden columns */}
              {hidden.map(col => (
                <div
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-2 rounded-xl"
                  style={{border: '1px solid rgba(220,200,205,0.4)'}}
                >
                  <div className="w-4" />
                  <GripVertical className="w-3 h-3 flex-shrink-0 opacity-20" style={{color: '#dbb8bc'}} />
                  <span className="flex-1 text-xs font-medium" style={{color: '#b09098'}}>{col.label}</span>
                  <button
                    onClick={() => toggleCol(col.key)}
                    className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                    style={{borderColor: 'rgba(220,200,205,0.7)', background: 'white'}}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}