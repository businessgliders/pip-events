import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { X, CalendarDays, ChevronDown } from 'lucide-react';

const EVENT_TYPES = [
  'Birthday',
  'Bridal Shower',
  'Bachelorette Party',
  'Corporate Wellness Event',
  'Private Class',
  'Other',
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

  const hasEvents = events.length > 0;
  const multipleEvents = events.length > 1;
  const singleEventType = !multipleEvents && events.length === 1 ? events[0].event_type : null;

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
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 20px 60px rgba(241,136,155,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" style={{color: '#f1889b'}} />
              <h3 className="text-xl font-bold" style={{color: '#7a4a3a'}}>{format(day, 'MMMM d, yyyy')}</h3>
            </div>
            <p className="text-sm mt-0.5 ml-7" style={{color: '#c48a96'}}>{format(day, 'EEEE')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 transition-colors" style={{color: '#c4909a'}}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing events banner */}
        {hasEvents && (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{background: 'rgba(251,224,226,0.5)', border: '1px solid rgba(247,177,189,0.4)'}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #f7b1bd, #f1889b)'}}>
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{color: '#7a4a3a'}}>
                {multipleEvents ? 'Multiple Events' : `${singleEventType} Event`}
              </p>
              <p className="text-xs mt-0.5" style={{color: '#f1889b'}}>This date may still be available. Request booking below!</p>
            </div>
          </div>
        )}

        {/* Event type dropdown — prominent CTA */}
        <div className="mb-4">
          <p className="text-sm font-bold mb-2" style={{color: '#7a4a3a'}}>What's your event? <span style={{color: '#f1889b'}}>*</span></p>
          <div className="relative">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full appearance-none rounded-xl px-4 py-3.5 pr-10 text-sm font-medium focus:outline-none transition-all"
              style={{
                border: selectedType ? '2px solid #f1889b' : '2px solid rgba(220,200,205,0.7)',
                background: selectedType ? 'rgba(241,136,155,0.06)' : 'white',
                color: selectedType ? '#7a4a3a' : '#b09098',
                boxShadow: selectedType ? '0 0 0 4px rgba(241,136,155,0.12)' : 'none',
              }}
            >
              <option value="" disabled>Select your event type...</option>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{color: '#f1889b'}} />
          </div>
        </div>

        <button
          onClick={handleProceed}
          disabled={!selectedType}
          className="w-full text-white py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: selectedType ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'linear-gradient(135deg, #f7b1bd, #f1889b)',
            boxShadow: selectedType ? '0 8px 24px rgba(241,136,155,0.4)' : 'none',
            transform: selectedType ? 'translateY(0)' : 'none',
          }}
        >
          {selectedType ? `Request Booking →` : 'Select an event type to continue'}
        </button>
      </div>
    </div>
  );
}