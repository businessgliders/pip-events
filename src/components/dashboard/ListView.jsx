import { format, differenceInCalendarDays, startOfWeek, endOfWeek, startOfDay } from 'date-fns';
import { Cake, Flower2, Wine, Briefcase, PersonStanding, Sparkles, ChevronDown, Mail, Phone, Users, Clock } from 'lucide-react';

const EVENT_TYPE_ICONS = {
  'Birthday': Cake,
  'Bridal Shower': Flower2,
  'Bachelorette Party': Wine,
  'Corporate Wellness Event': Briefcase,
  'Private Class': PersonStanding,
  'Other': Sparkles,
};

const STATUS_COLORS = {
  Pending: { bg: 'rgba(254,249,195,0.8)', text: '#854d0e', border: 'rgba(253,224,71,0.5)' },
  Confirmed: { bg: 'rgba(219,234,254,0.8)', text: '#1e40af', border: 'rgba(147,197,253,0.5)' },
  Completed: { bg: 'rgba(220,252,231,0.8)', text: '#166534', border: 'rgba(134,239,172,0.5)' },
  Cancelled: { bg: 'rgba(243,244,246,0.8)', text: '#6b7280', border: 'rgba(209,213,219,0.5)' },
};

function relativeLabel(dateKey) {
  const today = startOfDay(new Date());
  const d = startOfDay(new Date(dateKey + 'T12:00:00'));
  const diff = differenceInCalendarDays(d, today);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  if (d >= thisWeekStart && d <= thisWeekEnd) return 'This week · ' + format(d, 'EEEE, MMM d');
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekEnd); lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  if (d >= lastWeekStart && d <= lastWeekEnd) return 'Last week · ' + format(d, 'EEEE, MMM d');
  const nextWeekStart = new Date(thisWeekStart); nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekEnd = new Date(thisWeekEnd); nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  if (d >= nextWeekStart && d <= nextWeekEnd) return 'Next week · ' + format(d, 'EEEE, MMM d');
  return format(d, 'EEEE, MMMM d, yyyy');
}

export default function ListView({ sortedDateKeys, groupedByDate, groupBySubmitted, onSelect, hasMore, onLoadMore }) {
  if (sortedDateKeys.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl" style={{background: 'rgba(255,255,255,0.5)'}}>
        <p className="text-sm" style={{color: '#c48a96'}}>No requests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDateKeys.map(dateKey => {
        const items = groupedByDate[dateKey];
        let dateLabel = dateKey;
        if (dateKey !== 'No Date') {
          try {
            dateLabel = groupBySubmitted ? relativeLabel(dateKey) : format(new Date(dateKey + 'T12:00:00'), 'EEEE, MMMM d, yyyy');
          } catch {}
        }

        return (
          <div key={dateKey}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)', color: '#b67651'}}>
                {groupBySubmitted ? 'Submitted' : 'Event Date'}: {dateLabel}
              </div>
              <div className="flex-1 h-px" style={{background: 'rgba(247,177,189,0.4)'}} />
              <span className="text-xs font-medium" style={{color: '#c48a96'}}>{items.length} request{items.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {items.map(r => {
                const Icon = EVENT_TYPE_ICONS[r.event_type] || Sparkles;
                const sc = STATUS_COLORS[r.status] || STATUS_COLORS.Pending;
                return (
                  <div
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="px-5 py-4 rounded-2xl cursor-pointer transition-all hover:shadow-md"
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.65)',
                      boxShadow: '0 2px 12px rgba(180,80,100,0.1)',
                    }}
                  >
                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                        style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
                        <Icon className="w-4 h-4" style={{color: '#e86c84'}} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{color: '#6b4e4e'}}>{r.full_name}</p>
                        <p className="text-xs truncate" style={{color: '#c48a96'}}>{r.event_type}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
                        style={{background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`}}>
                        {r.status}
                      </span>
                    </div>

                    {/* Detail chips - simplified for mobile */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pl-11 text-xs" style={{color: '#9a7878'}}>
                      {r.email && <span className="truncate">{r.email}</span>}
                      {r.event_date && (
                        <span className="font-medium" style={{color: '#b67651'}}>
                          {format(new Date(r.event_date + 'T12:00:00'), 'MMM d')}
                        </span>
                      )}
                      {r.number_of_guests && <span>{r.number_of_guests} guests</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={onLoadMore}
            className="flex items-center gap-2 mx-auto text-sm font-medium px-6 py-2.5 rounded-xl transition-all"
            style={{background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(247,177,189,0.5)', color: '#b67651'}}
          >
            <ChevronDown className="w-4 h-4" /> Load more
          </button>
        </div>
      )}
    </div>
  );
}