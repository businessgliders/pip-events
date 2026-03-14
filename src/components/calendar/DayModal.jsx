import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { X } from 'lucide-react';

const EVENT_TYPES = [
  { label: 'Birthday', icon: '🎂' },
  { label: 'Bridal Shower', icon: '💐' },
  { label: 'Bachelorette Party', icon: '🥂' },
  { label: 'Corporate Wellness Event', icon: '💼' },
  { label: 'Private Class', icon: '🧘' },
  { label: 'Other', icon: '✨' },
];

export const EVENT_ICONS = {
  'Birthday': '🎂',
  'Bridal Shower': '💐',
  'Bachelorette Party': '🥂',
  'Corporate Wellness Event': '💼',
  'Private Class': '🧘',
  'Other': '✨',
};

export default function DayModal({ day, events, onClose }) {
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  const uniqueEventTypes = [...new Set(events.map(e => e.event_type))];

  const handleProceed = () => {
    if (!selectedType) return;
    navigate(`/RequestForm?date=${format(day, 'yyyy-MM-dd')}&eventType=${encodeURIComponent(selectedType)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{background: 'rgba(180,100,120,0.25)', backdropFilter: 'blur(6px)'}} onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 20px 60px rgba(241,136,155,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>📅</span>
              <h3 className="text-xl font-bold" style={{color: '#7a4a3a'}}>{format(day, 'MMMM d, yyyy')}</h3>
            </div>
            <p className="text-sm mt-0.5 ml-8" style={{color: '#c48a96'}}>{format(day, 'EEEE')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 transition-colors" style={{color: '#c4909a'}}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {uniqueEventTypes.length > 0 && (
          <div className="mb-5 space-y-2">
            {uniqueEventTypes.map(type => (
              <div key={type} className="flex items-start gap-3 p-3 rounded-xl" style={{background: 'rgba(251,224,226,0.5)', border: '1px solid rgba(247,177,189,0.4)'}}>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 text-base" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
                  {EVENT_ICONS[type] || '✨'}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{color: '#7a4a3a'}}>{type} Event</p>
                  <p className="text-xs mt-0.5" style={{color: '#f1889b'}}>This date may still be available. Request booking below!</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-sm font-semibold block mb-2.5" style={{color: '#7a4a3a'}}>Select Event Type</label>
          <div className="rounded-xl overflow-hidden" style={{border: '1px solid rgba(220,200,205,0.5)'}}>
            {EVENT_TYPES.map(t => {
              const selected = selectedType === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setSelectedType(t.label)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-all"
                  style={{
                    background: selected ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'transparent',
                    color: selected ? 'white' : '#7a4a3a',
                    borderBottom: '1px solid rgba(220,200,205,0.25)',
                  }}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm flex-shrink-0" style={{background: selected ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
                    {t.icon}
                  </span>
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleProceed}
          disabled={!selectedType}
          className="mt-5 w-full text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #f1889b, #e86c84)',
            boxShadow: selectedType ? '0 6px 20px rgba(241,136,155,0.35)' : 'none',
          }}
        >
          Request Booking →
        </button>
      </div>
    </div>
  );
}