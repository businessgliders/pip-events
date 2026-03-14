import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import Navbar from '../components/layout/Navbar';
import DayModal from '../components/calendar/DayModal';
import { EVENT_ICONS } from '../components/calendar/DayModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    <div className="min-h-screen" style={{backgroundColor: '#f6eee7'}}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Event Calendar</h1>
          <p className="text-gray-400 mt-2 text-sm">Pick a date and request your event</p>
        </div>

        {/* Month Nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full text-gray-500 transition-colors hover:opacity-80"
            style={{backgroundColor: 'transparent'}}
          >
            <ChevronLeft className="w-5 h-5" style={{color: '#b67651'}} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(new Date())} className="text-xs rounded-full px-3 py-1 transition-colors" style={{color: '#f1889b', border: '1px solid #f7b1bd', backgroundColor: 'transparent'}}>
              Now
            </button>
            <h2 className="text-lg font-semibold text-gray-700 w-40 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full text-gray-500 transition-colors hover:opacity-80"
          >
            <ChevronRight className="w-5 h-5" style={{color: '#b67651'}} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const uniqueTypes = [...new Set(dayEvents.map(e => e.event_type))];

              return (
                <div
                  key={idx}
                  onClick={() => isCurrentMonth && setSelectedDay(day)}
                  className={`min-h-[80px] p-2 border-r border-b border-gray-50 transition-colors ${
                    isCurrentMonth
                      ? 'cursor-pointer hover:bg-pink-50/60'
                      : 'bg-gray-50/30 cursor-default'
                  }`}
                  style={isCurrentMonth ? {} : {}}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'text-white' : isCurrentMonth ? 'text-gray-600' : 'text-gray-300'
                  }`} style={isToday ? {backgroundColor: '#f1889b'} : {}}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {uniqueTypes.slice(0, 3).map(type => (
                      <span key={type} title={type} className="text-base leading-none">
                        {EVENT_ICONS[type] || '✨'}
                      </span>
                    ))}
                    {uniqueTypes.length > 3 && (
                      <span className="text-xs text-pink-400 font-medium">+{uniqueTypes.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
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