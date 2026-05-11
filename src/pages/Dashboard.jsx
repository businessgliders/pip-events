import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import RequestDetailModal from '../components/dashboard/RequestDetailModal.jsx';
import { Search, Plus, ClipboardList, Clock, CheckCircle2, CalendarDays, LayoutList, Table2, Calendar, Settings, LogOut, Sparkles, MessageCircle, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import ColumnCustomizer from '../components/dashboard/ColumnCustomizer';
import ListView from '../components/dashboard/ListView.jsx';
import TableView from '../components/dashboard/TableView.jsx';
import CalendarView from '../components/dashboard/CalendarView.jsx';
import SettingsPanel from '../components/dashboard/SettingsPanel.jsx';

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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dashTab, setDashTab] = useState('requests'); // 'requests' | 'settings'

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });
  }, []);
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
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
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
            <p className="text-sm mb-7" style={{color: '#c48a96'}}>Sign in with Google to continue</p>

            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 6px 20px rgba(241,136,155,0.35)'}}
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Derive effective status: past/today event_date → Completed (unless Confirmed/Cancelled).
  // For future events, preserve the saved status (New, In Conversations, Confirmed, Cancelled).
  // Legacy "Pending" records are surfaced as "In Conversations".
  const enriched = requests.map(r => {
    let status = r.status || 'New';
    if (status === 'Pending') status = 'In Conversations';
    if (!r.event_date) return { ...r, status };
    const eventDay = new Date(r.event_date + 'T12:00:00');
    eventDay.setHours(0, 0, 0, 0);
    if (status === 'Confirmed' || status === 'Cancelled') return { ...r, status };
    if (eventDay > today) return { ...r, status };
    return { ...r, status: 'Completed' };
  });

  const stats = {
    total: enriched.length,
    new: enriched.filter(r => r.status === 'New').length,
    inConversations: enriched.filter(r => r.status === 'In Conversations').length,
    confirmed: enriched.filter(r => r.status === 'Confirmed').length,
    completed: enriched.filter(r => r.status === 'Completed').length,
  };

  const eventTypes = [...new Set(enriched.map(r => r.event_type).filter(Boolean))];

  const handleTileClick = (tileKey) => {
    setPage(1);
    if (tileKey === 'total') { setFilterStatus(''); }
    else if (tileKey === 'new') { setFilterStatus(filterStatus === 'New' ? '' : 'New'); }
    else if (tileKey === 'inConversations') { setFilterStatus(filterStatus === 'In Conversations' ? '' : 'In Conversations'); }
    else if (tileKey === 'confirmed') { setFilterStatus(filterStatus === 'Confirmed' ? '' : 'Confirmed'); }
    else if (tileKey === 'completed') { setFilterStatus(filterStatus === 'Completed' ? '' : 'Completed'); }
  };

  // Filter
  const filtered = enriched.filter(r => {
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
    <div className="min-h-screen" style={{background: 'linear-gradient(to bottom, #fce4ec 0%, #e8a4b5 100%)'}}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 gap-2">
            <div className="flex items-center gap-3 flex-1 sm:flex-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 20px rgba(241,136,155,0.12)',
            }}>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold leading-tight" style={{color: '#b67651'}}>Events Dashboard</h1>
                <p className="text-xs sm:text-sm mt-0.5" style={{color: '#c48a96'}}>Manage bookings</p>
              </div>
              <div className="flex items-center gap-1.5 sm:hidden flex-shrink-0">
                {dashTab === 'requests' && (
                  <button
                    onClick={() => { window.location.href = '/RequestForm'; }}
                    className="p-2 text-white rounded-lg transition-all"
                    style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)'}}
                    title="New Request"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setDashTab(dashTab === 'requests' ? 'settings' : 'requests')}
                  className="p-2 text-white rounded-lg transition-all"
                  style={{background: 'linear-gradient(135deg, #7a6b8f, #6b5b80)'}}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => base44.auth.logout(window.location.origin)}
                  className="p-2 rounded-lg transition-all hover:bg-red-50"
                  style={{border: '1px solid rgba(220,200,205,0.5)', color: '#c48a96'}}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 self-start">
              {dashTab === 'requests' && (
                <button
                  onClick={() => { window.location.href = '/RequestForm'; }}
                  className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.35)'}}
                  title="New Request"
                >
                  <Plus className="w-4 h-4" /> New Request
                </button>
              )}
              <button
                onClick={() => setDashTab(dashTab === 'requests' ? 'settings' : 'requests')}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{background: 'linear-gradient(135deg, #7a6b8f, #6b5b80)', boxShadow: '0 4px 16px rgba(122,107,143,0.35)'}}
                title="Settings"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              {/* Profile (icon only) + Logout */}
              <div className="flex items-center gap-2 pl-1">
                <div
                  title={user?.full_name || user?.email}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 2px 8px rgba(241,136,155,0.3)'}}
                >
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <button
                  onClick={() => base44.auth.logout(window.location.origin)}
                  title="Logout"
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:bg-red-50"
                  style={{border: '1px solid rgba(220,200,205,0.5)', color: '#c48a96'}}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings tab */}
        {dashTab === 'settings' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => { window.location.href = '/RequestForm'; }}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.35)'}}
              >
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
            <SettingsPanel />
          </>
        )}

        {/* Requests tab content */}
        {dashTab === 'requests' && <>

        {/* Stats */}
        <div className="hidden sm:grid grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'All', value: stats.total, Icon: LayoutGrid, key: 'total' },
            { label: 'New', value: stats.new, Icon: Sparkles, key: 'new' },
            { label: 'In Conversations', value: stats.inConversations, Icon: MessageCircle, key: 'inConversations' },
            { label: 'Confirmed', value: stats.confirmed, Icon: CheckCircle2, key: 'confirmed' },
            { label: 'Completed', value: stats.completed, Icon: CalendarDays, key: 'completed' },
          ].map(s => {
            const isActive =
              (s.key === 'total' && filterStatus === '') ||
              (s.key === 'new' && filterStatus === 'New') ||
              (s.key === 'inConversations' && filterStatus === 'In Conversations') ||
              (s.key === 'confirmed' && filterStatus === 'Confirmed') ||
              (s.key === 'completed' && filterStatus === 'Completed');
            return (
              <button
                key={s.label}
                onClick={() => handleTileClick(s.key)}
                className="rounded-xl sm:rounded-2xl p-2.5 sm:p-5 text-left transition-all"
                style={{
                  background: isActive ? 'linear-gradient(135deg, rgba(241,136,155,0.35), rgba(232,108,132,0.28))' : 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.75))',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: isActive ? '1.5px solid rgba(241,136,155,0.8)' : '1.5px solid rgba(255,255,255,0.8)',
                  boxShadow: isActive ? '0 12px 40px rgba(241,136,155,0.35)' : '0 12px 40px rgba(180,80,100,0.18)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest hidden sm:block" style={{color: isActive ? '#e86c84' : '#c48a96', fontSize: '10px'}}>{s.label}</p>
                  <span className="inline-flex items-center justify-center w-5 sm:w-8 h-5 sm:h-8 rounded-full flex-shrink-0 sm:ml-auto" style={{background: isActive ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
                    <s.Icon className="w-3 sm:w-4 h-3 sm:h-4" style={{color: isActive ? 'white' : '#e86c84'}} />
                  </span>
                </div>
                <p className="text-xl sm:text-3xl font-bold" style={{color: isActive ? '#e86c84' : '#b67651'}}>{s.value}</p>
              </button>
            );
          })}
        </div>

        {/* Filters - Mobile optimized */}
        <div className="rounded-2xl p-4 mb-5" style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 16px rgba(241,136,155,0.08)',
        }}>
          {/* Search bar - full width */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{color: '#f1889b'}} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none bg-white/70 placeholder-gray-400"
              style={{border: '1.5px solid rgba(220,200,205,0.6)'}}
            />
          </div>

          {/* Desktop filters */}
          <div className="hidden sm:flex gap-3 items-center">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="rounded-xl px-2.5 py-2.5 text-sm bg-white/70 focus:outline-none flex-1 min-w-[140px]"
              style={{border: '1.5px solid rgba(220,200,205,0.6)', color: '#7a4a3a'}}
            >
              <option value="">All Event Types</option>
              {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="rounded-xl px-2.5 py-2.5 text-sm bg-white/70 focus:outline-none flex-1 min-w-[120px]"
              style={{border: '1.5px solid rgba(220,200,205,0.6)', color: '#7a4a3a'}}
            >
              <option value="">All Statuses</option>
              {['New', 'In Conversations', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ColumnCustomizer
              allColumns={ALL_COLUMNS}
              visibleKeys={visibleCols}
              onSave={setVisibleCols}
            />
            {/* Desktop view toggle */}
            <div className="hidden sm:flex rounded-xl overflow-hidden ml-auto" style={{border: '1.5px solid rgba(220,200,205,0.6)'}}>
              {[
                { mode: 'list', Icon: LayoutList, title: 'List' },
                { mode: 'table', Icon: Table2, title: 'Table' },
                { mode: 'calendar', Icon: Calendar, title: 'Calendar' },
              ].map(({ mode, Icon, title }, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={title}
                  className="flex items-center justify-center w-9 h-9 transition-all"
                  style={{
                    background: viewMode === mode ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'rgba(255,255,255,0.7)',
                    color: viewMode === mode ? 'white' : '#b67651',
                    borderLeft: i > 0 ? '1px solid rgba(220,200,205,0.6)' : 'none',
                  }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Mobile filters - compact */}
          <div className="sm:hidden space-y-3">
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="flex-1 rounded-lg px-2 py-2 text-xs bg-white/70 focus:outline-none"
                style={{border: '1px solid rgba(220,200,205,0.6)', color: '#7a4a3a'}}
              >
                <option value="">All Types</option>
                {eventTypes.map(t => <option key={t} value={t}>{t.substring(0, 12)}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="flex-1 rounded-lg px-2 py-2 text-xs bg-white/70 focus:outline-none"
                style={{border: '1px solid rgba(220,200,205,0.6)', color: '#7a4a3a'}}
              >
                <option value="">All Status</option>
                {['New', 'In Conversations', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
  
          </div>
        </div>

        {/* Views */}
        {viewMode === 'list' && (
          <ListView
            sortedDateKeys={sortedDateKeys}
            groupedByDate={groupedByDate}
            groupBySubmitted={groupBySubmitted}
            onSelect={setSelected}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
          />
        )}
        {viewMode === 'table' && (
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
        {viewMode === 'calendar' && (
          <CalendarView
            requests={filtered}
            onSelect={setSelected}
          />
        )}

        </>}
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