import { format } from 'date-fns';
import { ChevronUp, ChevronDown } from 'lucide-react';

const STATUS_COLORS = {
  Pending: { bg: 'rgba(254,249,195,0.8)', text: '#854d0e', border: 'rgba(253,224,71,0.5)' },
  Confirmed: { bg: 'rgba(219,234,254,0.8)', text: '#1e40af', border: 'rgba(147,197,253,0.5)' },
  Completed: { bg: 'rgba(220,252,231,0.8)', text: '#166534', border: 'rgba(134,239,172,0.5)' },
  Cancelled: { bg: 'rgba(243,244,246,0.8)', text: '#6b7280', border: 'rgba(209,213,219,0.5)' },
};

const ALL_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'event_type', label: 'Event Type' },
  { key: 'number_of_guests', label: 'Guests' },
  { key: 'event_date', label: 'Preferred Date' },
  { key: 'submitted_date', label: 'Submitted' },
];

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 ml-1 inline" style={{color: '#f1889b'}} />
    : <ChevronDown className="w-3 h-3 ml-1 inline" style={{color: '#f1889b'}} />;
}

function formatCell(key, value) {
  if (!value && value !== 0) return '—';
  if (key === 'event_date') {
    try { return format(new Date(value + 'T12:00:00'), 'MMM d, yyyy'); } catch { return value; }
  }
  if (key === 'submitted_date') {
    try { return format(new Date(value), 'MMM d, yyyy'); } catch { return value; }
  }
  return String(value);
}

export default function TableView({ rows, visibleCols, sortKey, sortDir, onSort, onSelect, hasMore, onLoadMore }) {
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));

  if (rows.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl" style={{background: 'rgba(255,255,255,0.5)'}}>
        <p className="text-sm" style={{color: '#c48a96'}}>No requests found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 4px 20px rgba(241,136,155,0.1)',
      }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom: '1.5px solid rgba(247,177,189,0.3)', background: 'rgba(251,224,226,0.2)'}}>
                {cols.map(col => (
                  <th
                    key={col.key}
                    onClick={() => onSort(col.key)}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                    style={{color: sortKey === col.key ? '#f1889b' : '#c48a96'}}
                  >
                    {col.label}
                    <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const sc = STATUS_COLORS[r.status] || STATUS_COLORS.Pending;
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: i < rows.length - 1 ? '1px solid rgba(247,177,189,0.2)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,224,226,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {cols.map(col => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap" style={{color: '#6b4e4e'}}>
                        {col.key === 'status' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`}}>
                            {r.status}
                          </span>
                        ) : (
                          <span className="text-xs">{formatCell(col.key, r[col.key])}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="text-center pt-4">
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