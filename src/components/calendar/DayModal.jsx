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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-pink-400 text-lg">📅</span>
              <h3 className="text-xl font-bold text-gray-800">{format(day, 'MMMM d, yyyy')}</h3>
            </div>
            <p className="text-sm text-gray-400 mt-0.5 ml-7">{format(day, 'EEEE')}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {uniqueEventTypes.length > 0 && (
          <div className="mb-5 space-y-2">
            {uniqueEventTypes.map(type => (
              <div key={type} className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl border border-pink-100">
                <span className="text-xl mt-0.5">{EVENT_ICONS[type] || '✨'}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{type} Event</p>
                  <p className="text-xs text-pink-400 mt-0.5">This date may still be available. Request booking below!</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Event Type</label>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <input
              type="text"
              placeholder="Select event type"
              value={selectedType}
              readOnly
              className="w-full px-3 py-2.5 text-sm text-gray-500 border-b border-gray-100 focus:outline-none cursor-default"
            />
            <div className="divide-y divide-gray-50">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setSelectedType(t.label)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    selectedType === t.label ? 'bg-pink-400 text-white' : 'text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleProceed}
          disabled={!selectedType}
          className="mt-5 w-full bg-pink-400 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Request Booking →
        </button>
      </div>
    </div>
  );
}