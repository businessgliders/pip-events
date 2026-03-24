import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay
} from 'date-fns';
import Navbar from '../components/layout/Navbar';
import DayModal from '../components/calendar/DayModal';
import { ChevronLeft, ChevronRight, Cake, Flower2, Wine, Briefcase, PersonStanding, Sparkles } from 'lucide-react';

const EVENT_TYPE_ICONS = {
  'Birthday': Cake,
  'Bridal Shower': Flower2,
  'Bachelorette Party': Wine,
  'Corporate Wellness Event': Briefcase,
  'Private Class': PersonStanding,
  'Other': Sparkles,
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const glassCard = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 8px 32px rgba(241,136,155,0.1)',
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['eventRequests'],
    queryFn: () => base44.entities.EventRequest.list('-event_date', 500),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day) =>
    requests.filter(r => r.event_date && isSameDay(new Date(r.event_date + 'T12:00:00'), day));

  const today = new Date();

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="text-center mb-7">
          <h1 className="text-3xl font-bold" style={{color: '#b67651'}}>Event Calendar</h1>
          <p className="mt-1.5 text-sm" style={{color: '#f1889b'}}>Pick a date and request your event</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-5 rounded-2xl px-5 py-3" style={glassCard}>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full transition-colors hover:bg-pink-100/50"
          >
            <ChevronLeft className="w-5 h-5" style={{color: '#b67651'}} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs rounded-full px-3.5 py-1 font-medium transition-all"
              style={{color: '#f1889b', border: '1px solid #f7b1bd', background: 'rgba(251,224,226,0.4)'}}
            >
              Today
            </button>
            <h2 className="text-lg font-semibold w-44 text-center" style={{color: '#7a4a3a'}}>
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full transition-colors hover:bg-pink-100/50"
          >
            <ChevronRight className="w-5 h-5" style={{color: '#b67651'}} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 48px rgba(241,136,155,0.12)',
        }}>
          {/* Day Headers */}
          <div className="grid grid-cols-7" style={{borderBottom: '1px solid rgba(247,177,189,0.25)', background: 'rgba(251,224,226,0.2)'}}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-xs font-semibold py-3.5 uppercase tracking-widest" style={{color: '#c48a96'}}>
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const isPast = isBefore(startOfDay(day), startOfDay(today));
              const isDisabled = !isCurrentMonth || isPast;
              const eventCount = dayEvents.length;

              return (
                <div
                  key={idx}
                  onClick={() => !isDisabled && setSelectedDay(day)}
                  className="min-h-[90px] md:min-h-[110px] flex flex-col items-center pt-3 pb-2 transition-all"
                  style={{
                    borderRight: '1px solid rgba(247,177,189,0.12)',
                    borderBottom: '1px solid rgba(247,177,189,0.12)',
                    cursor: isDisabled ? 'default' : 'pointer',
                    backgroundColor: isPast && isCurrentMonth ? 'rgba(245,240,242,0.5)' : !isCurrentMonth ? 'rgba(249,240,242,0.3)' : 'transparent',
                    opacity: isDisabled ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.backgroundColor = 'rgba(251,224,226,0.28)'; }}
                  onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
                    style={
                      isToday
                        ? {backgroundColor: '#f1889b', color: 'white', boxShadow: '0 2px 8px rgba(241,136,155,0.4)'}
                        : {color: isCurrentMonth ? '#6b4e4e' : '#d4b8bb'}
                    }
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Pink dot indicators */}
                  {eventCount > 0 && (
                    <div className="flex gap-1 mt-2 justify-center">
                      {eventCount === 1 && (
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b', boxShadow: '0 1px 4px rgba(241,136,155,0.4)'}} />
                      )}
                      {eventCount === 2 && (
                        <>
                          <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b'}} />
                          <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b'}} />
                        </>
                      )}
                      {eventCount >= 3 && (
                        <>
                          <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b'}} />
                          <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b'}} />
                          <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#e86c84'}} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{color: '#c4909a'}}>
          Click any date to see availability and request your event
        </p>
      </div>

      {selectedDay && (
        <DayModal
          day={selectedDay}
          events={getEventsForDay(selectedDay)}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}