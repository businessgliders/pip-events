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

const PASSWORD = 'pip2024';

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
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-10 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Dashboard Access</h2>
          <p className="text-sm text-gray-400 mb-6">Enter the admin password to continue</p>
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
            className={`w-full border rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-pink-200 ${pwError ? 'border-red-300' : 'border-gray-200'}`}
          />
          {pwError && <p className="text-xs text-red-400 mb-3">Incorrect password</p>}
          <button
            onClick={() => { if (pwInput === PASSWORD) setAuthed(true); else setPwError(true); }}
            className="w-full bg-pink-400 hover:bg-pink-500 text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            Enter Dashboard
          </button>
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
    <div className="min-h-screen bg-white">
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
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
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
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
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