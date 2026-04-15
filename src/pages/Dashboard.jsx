import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';
import { Search, Plus, ClipboardList, Clock, CheckCircle2, CalendarDays, LayoutList, Table2 } from 'lucide-react';
import { format } from 'date-fns';
import ColumnCustomizer from '../components/dashboard/ColumnCustomizer';
import ListView from '../components/dashboard/ListView.jsx';
import TableView from '../components/dashboard/TableView.jsx';

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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'table'
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

  // Paginate sorted list
  const paginated = sorted.slice(0, page * ROWS_PER_PAGE);
  const hasMore = sorted.length > paginated.length;

  // Group paginated results — by submitted_date when sorting by submission, otherwise by event_date
  const groupBySubmitted = sortKey === 'submitted_date';

  const groupedByDate = paginated.reduce((acc, r) => {
    let dateKey;
    if (groupBySubmitted) {
      dateKey = r.submitted_date ? r.submitted_date.substring(0, 10) : 'No Date';
    } else {
      dateKey = r.event_date || 'No Date';
    }
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(r);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return sortDir === 'asc'
      ? new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')
      : new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00');
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
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
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{border: '1.5px solid rgba(220,200,205,0.6)'}}>
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: viewMode === 'list' ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'rgba(255,255,255,0.7)',
                color: viewMode === 'list' ? 'white' : '#b67651',
              }}
            >
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: viewMode === 'table' ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'rgba(255,255,255,0.7)',
                color: viewMode === 'table' ? 'white' : '#b67651',
                borderLeft: '1px solid rgba(220,200,205,0.6)',
              }}
            >
              <Table2 className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>

        {/* Views */}
        {viewMode === 'list' ? (
          <ListView
            sortedDateKeys={sortedDateKeys}
            groupedByDate={groupedByDate}
            groupBySubmitted={groupBySubmitted}
            onSelect={setSelected}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
          />
        ) : (
          <TableView
            rows={paginated}
            visibleCols={visibleCols}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onSelect={setSelected}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
          />
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