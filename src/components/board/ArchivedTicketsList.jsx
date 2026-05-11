import { useState, useMemo } from 'react';
import { Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function getClosedTimestamp(ticket) {
  const hist = ticket.status_history || [];
  const closedEntry = [...hist].reverse().find(e => e.status === 'Completed' || e.status === 'Closed');
  if (closedEntry?.timestamp) return closedEntry.timestamp;
  if (hist.length > 0) return hist[hist.length - 1].timestamp;
  return ticket.created_date;
}

export default function ArchivedTicketsList({ tickets, onView, onRestore }) {
  // Group by year → month
  const grouped = useMemo(() => {
    const byYear = {};
    tickets.forEach(t => {
      const ts = getClosedTimestamp(t);
      if (!ts) return;
      const d = new Date(ts);
      const year = d.getFullYear();
      const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!byYear[year]) byYear[year] = { total: 0, months: {} };
      if (!byYear[year].months[monthKey]) byYear[year].months[monthKey] = { label: monthLabel, tickets: [] };
      byYear[year].months[monthKey].tickets.push(t);
      byYear[year].total++;
    });
    return byYear;
  }, [tickets]);

  const years = Object.keys(grouped).sort((a, b) => b - a);
  const firstYear = years[0];
  const firstMonth = firstYear ? Object.keys(grouped[firstYear].months).sort().reverse()[0] : null;
  const [openYears, setOpenYears] = useState(firstYear ? { [firstYear]: true } : {});
  const [selectedMonth, setSelectedMonth] = useState(firstMonth);

  const currentMonthData = useMemo(() => {
    for (const y of years) {
      if (grouped[y].months[selectedMonth]) return grouped[y].months[selectedMonth];
    }
    return null;
  }, [grouped, years, selectedMonth]);

  if (tickets.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-12 shadow-xl flex-1 flex flex-col items-center justify-center text-white/70">
        <Archive className="w-12 h-12 mb-3" />
        <p className="text-lg font-medium">No archived inquiries</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-xl flex-1 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 h-full max-h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <aside className="md:w-60 flex-shrink-0 overflow-y-auto custom-scrollbar">
          <h2 className="text-white font-bold text-lg mb-3 px-2">Archive</h2>
          {years.map(year => (
            <div key={year} className="mb-1">
              <button
                onClick={() => setOpenYears(o => ({ ...o, [year]: !o[year] }))}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/20 text-white text-sm"
              >
                {openYears[year] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-semibold flex-1 text-left">{year}</span>
                <Badge className="bg-white/30 text-white border-0">{grouped[year].total}</Badge>
              </button>
              {openYears[year] && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {Object.keys(grouped[year].months).sort().reverse().map(mk => {
                    const m = grouped[year].months[mk];
                    const isSelected = selectedMonth === mk;
                    return (
                      <button
                        key={mk}
                        onClick={() => setSelectedMonth(mk)}
                        className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs transition-colors ${
                          isSelected ? 'text-white' : 'text-white/80 hover:bg-white/10'
                        }`}
                        style={isSelected ? { background: '#b67651' } : undefined}
                      >
                        <span className="truncate">{m.label.replace(` ${year}`, '')}</span>
                        <span className="text-[10px] opacity-80">{m.tickets.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {currentMonthData ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-white text-xl font-bold drop-shadow">{currentMonthData.label}</h2>
                <Badge className="bg-white/30 text-white border-0">{currentMonthData.tickets.length}</Badge>
              </div>
              <div className="space-y-2">
                {currentMonthData.tickets.map(t => (
                  <div
                    key={t.id}
                    className="backdrop-blur-md bg-white/40 border border-white/40 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate" style={{ color: '#5a3535' }}>{t.full_name}</p>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-white/60">{t.event_type}</Badge>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-white/60">{t.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{t.email}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Closed {new Date(getClosedTimestamp(t)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-8 bg-white/70" onClick={() => onView(t)}>View</Button>
                      <Button size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => onRestore(t.id)}>Restore</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-white/70 text-center py-12">Select a month</div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
      `}</style>
    </div>
  );
}