import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';
import { Search, Calendar, Grid3X3, List, Plus } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Completed: 'bg-pink-500 text-white',
  Cancelled: 'bg-gray-100 text-gray-500',
};

const PASSWORD = 'pip6161';

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['eventRequests'],
    queryFn: () => base44.entities.EventRequest.list('-created_date', 500),
    enabled: authed,
  });

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(247,177,189,0.35) 0%, transparent 70%)'}} />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(241,136,155,0.25) 0%, transparent 70%)'}} />

        <div className="w-full max-w-sm mx-4">
          {/* Logo */}
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
              <span className="text-xl">🔒</span>
            </div>
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

  const filtered = requests.filter(r => {
    const matchSearch = !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.event_type?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || r.event_type === filterType;
    return matchSearch && matchType;
  });

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

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Event Requests Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and track all event bookings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { window.location.href = '/RequestForm'; }}
              className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{backgroundColor: '#f1889b'}}
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: stats.total, icon: '📋' },
            { label: 'Pending', value: stats.pending, icon: '⏳' },
            { label: 'Confirmed', value: stats.confirmed, icon: '✅' },
            { label: 'Upcoming', value: stats.upcoming, icon: '📅' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5" style={{background:'rgba(255,255,255,0.6)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.55)',boxShadow:'0 8px 32px rgba(241,136,155,0.1)'}}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5 rounded-2xl p-4" style={{background:'rgba(255,255,255,0.5)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.5)'}}>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or event type..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 bg-white"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">All Event Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.6)',boxShadow:'0 8px 32px rgba(241,136,155,0.1)'}}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  {['Status', 'Full Name', 'Email', 'Phone Number', 'Event Type', 'Number of Guests', 'Preferred Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-300 text-sm">No requests found</td></tr>
                ) : filtered.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="hover:bg-pink-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.email}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.event_type}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.number_of_guests ? `${r.number_of_guests} (1 session)` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {r.event_date ? format(new Date(r.event_date + 'T12:00:00'), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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