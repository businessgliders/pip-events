import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';
import { Search, Plus, ClipboardList, Clock, CheckCircle2, CalendarDays, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import ColumnCustomizer from '../components/dashboard/ColumnCustomizer';

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Completed: 'bg-pink-500 text-white',
  Cancelled: 'bg-gray-100 text-gray-500',
};

const PASSWORD = 'pip6161';
const ROWS_PER_PAGE = 15;

const ALL_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'event_type', label: 'Event Type' },
  { key: 'number_of_guests', label: 'Guests' },
  { key: 'event_date', label: 'Preferred Date' },
  { key: 'submitted_date', label: 'Submitted' },
];

const DEFAULT_COLS = ['status', 'full_name', 'email', 'phone', 'event_type', 'number_of_guests', 'event_date'];

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [sortKey, setSortKey] = useState('submitted_date');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCols, setVisibleCols] = useState(DEFAULT_COLS);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['eventRequests'],
    queryFn: () => base44.entities.EventRequest.list('-created_date', 500),
    enabled: authed,
  });

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(247,177,189,0.35) 0%, transparent 70%)'}} />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(241,136,155,0.25) 0%, transparent 70%)'}} />

        <div className="w-full max-w-sm mx-4">
          <div className="flex justify-center mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink"
              className="w-16 h-16 object-contain drop-shadow-sm"
            />
          </div>

          <div className="rounded-3xl p-10 text-center" style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 16px 56px rgba(241,136,155,0.18)',
          }}>
            <h2 className="text-2xl font-bold mb-1" style={{color: '#b67651'}}>Dashboard Access</h2>
            <p className="text-sm mb-7" style={{color: '#c48a96'}}>Enter the admin password to continue</p>

            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (pwInput === PASSWORD) setAuthed(true);
                  else setPwError(true);
                }
              }}
              placeholder="Password"
              className="w-full rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none bg-white/70 placeholder-gray-400"
              style={{
                border: pwError ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.7)',
                boxShadow: pwError ? '0 0 0 3px rgba(241,136,155,0.15)' : 'none',
              }}
            />
            {pwError && <p className="text-xs mb-3" style={{color: '#f1889b'}}>Incorrect password. Please try again.</p>}

            <button
              onClick={() => { if (pwInput === PASSWORD) setAuthed(true); else setPwError(true); }}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all"
              style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 6px 20px rgba(241,136,155,0.35)'}}
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    confirmed: requests.filter(r => r.status === 'Confirmed').length,
    upcoming: requests.filter(r => {
      if (!r.event_date) return false;
      return new Date(r.event_date + 'T12:00:00') >= new Date();
    }).length,
  };

  const eventTypes = [...new Set(requests.map(r => r.event_type).filter(Boolean))];

  // Filter
  const filtered = requests.filter(r => {
    const matchSearch = !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.event_type?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || r.event_type === filterType;
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortKey] ?? '';
    let bVal = b[sortKey] ?? '';
    if (sortKey === 'number_of_guests') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else if (sortKey === 'submitted_date' || sortKey === 'created_date' || sortKey === 'event_date') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const activeColumns = visibleCols.map(k => ALL_COLUMNS.find(c => c.key === k)).filter(Boolean);

  // Paginate sorted list
  const paginated = sorted.slice(0, page * ROWS_PER_PAGE);
  const hasMore = sorted.length > paginated.length;

  // Group paginated results by event_date
  const groupedByDate = paginated.reduce((acc, r) => {
    const dateKey = r.event_date || 'No Date';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(r);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00');
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20 ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1" style={{color: '#f1889b'}} />
      : <ChevronDown className="w-3 h-3 ml-1" style={{color: '#f1889b'}} />;
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="inline-block rounded-2xl px-6 py-4" style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 4px 20px rgba(241,136,155,0.12)',
          }}>
            <h1 className="text-2xl font-bold" style={{color: '#b67651'}}>Event Requests Dashboard</h1>
            <p className="text-sm mt-0.5" style={{color: '#c48a96'}}>Manage and track all event bookings</p>
          </div>
          <button
            onClick={() => { window.location.href = '/RequestForm'; }}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all self-start"
            style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.35)'}}
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: stats.total, Icon: ClipboardList },
            { label: 'Pending', value: stats.pending, Icon: Clock },
            { label: 'Confirmed', value: stats.confirmed, Icon: CheckCircle2 },
            { label: 'Upcoming', value: stats.upcoming, Icon: CalendarDays },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5" style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 8px 32px rgba(241,136,155,0.1)',
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{color: '#c48a96'}}>{s.label}</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
                  <s.Icon className="w-4 h-4" style={{color: '#e86c84'}} />
                </span>
              </div>
              <p className="text-3xl font-bold" style={{color: '#b67651'}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5 rounded-2xl p-4" style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 16px rgba(241,136,155,0.08)',
        }}>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{color: '#f1889b'}} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or event type..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none bg-white/70 placeholder-gray-400"
              style={{border: '1.5px solid rgba(220,200,205,0.6)'}}
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 focus:outline-none"
            style={{border: '1.5px solid rgba(220,200,205,0.6)', color: '#7a4a3a'}}
          >
            <option value="">All Event Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 focus:outline-none"
            style={{border: '1.5px solid rgba(220,200,205,0.6)', color: '#7a4a3a'}}
          >
            <option value="">All Statuses</option>
            {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ColumnCustomizer
            allColumns={ALL_COLUMNS}
            visibleKeys={visibleCols}
            onSave={setVisibleCols}
          />
        </div>

        {/* List View by Date */}
        <div className="space-y-6">
          {paginated.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(247,177,189,0.45)',
            }}>
              <p style={{color: '#d4b8bb'}}>No requests found</p>
            </div>
          ) : (
            sortedDateKeys.map(dateKey => (
              <div key={dateKey}>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide px-2" style={{color: '#b67651'}}>
                  {dateKey === 'No Date' ? '📋 No Date Set' : format(new Date(dateKey + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-3">
                  {groupedByDate[dateKey].map(r => (
                    <div
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="rounded-2xl p-4 cursor-pointer transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.65)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(247,177,189,0.4)',
                        boxShadow: '0 4px 16px rgba(241,136,155,0.08)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.65)'}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>
                              {r.status}
                            </span>
                            <span className="text-xs" style={{color: '#c48a96'}}>{r.event_type}</span>
                          </div>
                          <h4 className="font-semibold text-base mb-1 truncate" style={{color: '#6b4e4e'}}>{r.full_name}</h4>
                          <p className="text-sm truncate" style={{color: '#a07878'}}>{r.email}</p>
                          {r.phone && <p className="text-sm truncate" style={{color: '#a07878'}}>{r.phone}</p>}
                          <div className="flex gap-2 mt-2 flex-wrap text-xs" style={{color: '#c48a96'}}>
                            {r.number_of_guests && <span>👥 {r.number_of_guests} guests</span>}
                            {r.time_slot && <span>⏰ {r.time_slot === 'Peak Hours (Fri-Sun, 10AM-6PM)' ? 'Peak' : 'Non-Peak'}</span>}
                            {r.duration && <span>⌛ {r.duration}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #f1889b, #e86c84)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(241,136,155,0.3)',
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {selected && (
        <RequestDetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}