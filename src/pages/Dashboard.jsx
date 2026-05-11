import { useState, useMemo, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import KanbanColumn from '../components/board/KanbanColumn';
import ArchivedTicketsList from '../components/board/ArchivedTicketsList';
import StatusChangeDialog from '../components/board/StatusChangeDialog';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';
import CalendarView from '../components/dashboard/CalendarView';
import AddonLegend from '../components/board/AddonLegend';
import WhatsNewSplash from '../components/dashboard/WhatsNewSplash';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, Archive, CalendarDays } from 'lucide-react';

const STATUS_COLUMNS = ['New', 'In Conversations', 'Confirmed', 'Completed'];

export default function Dashboard() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('board'); // 'board' | 'calendar' | 'archive'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);

  const { unreadMessages, unreadCountByTicket, totalUnread, markAsRead } = useUnreadMessages(user?.email);

  const handleNotificationSelect = (ticket, messageId) => {
    setSelectedRequest(ticket);
    setHighlightMessageId(messageId);
    markAsRead(messageId);
  };

  // Auth gate — restrict to studio domain
  useEffect(() => {
    if (!isAuthenticated) navigateToLogin();
  }, [isAuthenticated, navigateToLogin]);

  // Document title
  useEffect(() => {
    const prev = document.title;
    document.title = 'Request Board | PiP Events';
    return () => { document.title = prev; };
  }, []);

  const { data: allTickets = [], isLoading } = useQuery({
    queryKey: ['eventRequests'],
    queryFn: () => base44.entities.EventRequest.list('-created_date', 500),
    refetchInterval: 5000,
    enabled: isAuthenticated,
  });

  const isAllowed = user?.email?.endsWith('@pilatesinpinkstudio.com');

  // Normalize legacy "Pending" → "In Conversations"
  const tickets = useMemo(
    () => allTickets.map(t => (t.status === 'Pending' ? { ...t, status: 'In Conversations' } : t)),
    [allTickets]
  );

  const activeTickets = useMemo(() => {
    return tickets.filter(t => {
      if (t.archived) return false;
      if (t.status === 'Cancelled') return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.full_name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.event_type?.toLowerCase().includes(q) ||
        String(t.ticket_number || '').includes(q)
      );
    });
  }, [tickets, search]);

  const archivedTickets = useMemo(
    () => tickets.filter(t => t.archived),
    [tickets]
  );

  const ticketsByColumn = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach(c => (map[c] = []));
    activeTickets.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
    });
    // Sort each column by most recent submission first
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => {
        const aTime = new Date(a.submitted_date || a.created_date || 0).getTime();
        const bTime = new Date(b.submitted_date || b.created_date || 0).getTime();
        return bTime - aTime;
      });
    });
    // "In Conversations" sorted by event date, soonest at the top
    if (map['In Conversations']) {
      map['In Conversations'].sort((a, b) => {
        const aTime = a.event_date ? new Date(a.event_date + 'T12:00:00').getTime() : Infinity;
        const bTime = b.event_date ? new Date(b.event_date + 'T12:00:00').getTime() : Infinity;
        return aTime - bTime;
      });
    }
    return map;
  }, [activeTickets]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const ticket = activeTickets.find(t => t.id === draggableId);
    if (!ticket) return;

    // status view — open dialog to capture note
    const newStatus = destination.droppableId;
    if (ticket.status === newStatus) return;
    setPendingStatusChange({
      ticketId: ticket.id,
      client_name: ticket.full_name,
      oldStatus: ticket.status,
      newStatus,
    });
  };

  const handleStatusChangeFromMenu = (ticketId, newStatus) => {
    const ticket = activeTickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;
    setPendingStatusChange({
      ticketId,
      client_name: ticket.full_name,
      oldStatus: ticket.status,
      newStatus,
    });
  };

  const confirmStatusChange = async ({ name, note }) => {
    const { ticketId, newStatus } = pendingStatusChange;
    const ticket = tickets.find(t => t.id === ticketId);
    const history = ticket?.status_history || [];
    await base44.entities.EventRequest.update(ticketId, {
      status: newStatus,
      status_history: [
        ...history,
        { status: newStatus, note, name, timestamp: new Date().toISOString() },
      ],
    });
    setPendingStatusChange(null);
    setHighlightedTicketId(ticketId);
    setTimeout(() => setHighlightedTicketId(null), 2000);
    queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
  };

  const handleArchiveAll = async () => {
    const completed = ticketsByColumn['Completed'] || [];
    if (!completed.length) return;
    if (!confirm(`Archive ${completed.length} completed ticket${completed.length === 1 ? '' : 's'}?`)) return;
    await Promise.all(completed.map(t => base44.entities.EventRequest.update(t.id, { archived: true })));
    queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
  };

  const handleRestore = async (id) => {
    await base44.entities.EventRequest.update(id, { archived: false });
    queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
  };

  if (!isAuthenticated) return null;

  if (!isAllowed) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: 'rgba(248, 210, 220, 0.9)' }}>
        <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-md text-center shadow-xl">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#b67651' }}>Access Restricted</h2>
          <p className="text-sm" style={{ color: '#7a5555' }}>
            The dashboard is only available to Pilates in Pink Studio staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(to bottom, #b67651, #f6eee7)' }}>
      <div className="relative" style={{ zIndex: 2 }}>

        {/* Sticky redesigned header */}
        <div className="sticky top-0 z-30 px-4 md:px-8 pt-4 md:pt-8 pb-3" style={{ background: '#b67651' }}>
          <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-4 px-2">
            {/* Left — logo + counts */}
            <Link to="/" className="flex items-center gap-3 min-w-0 flex-shrink-0">
              <img
                src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/719e48f6d_1e65b0238_PiPEvents.png"
                alt="PIP Events"
                className="w-11 h-11 rounded-xl object-cover shadow-sm flex-shrink-0"
              />
              <div className="hidden sm:block text-sm font-medium leading-tight truncate" style={{ color: '#5a3535' }}>
                <span className="font-semibold">{activeTickets.length}</span> active ticket{activeTickets.length === 1 ? '' : 's'}
                <span className="mx-1.5 opacity-50">•</span>
                <span className="font-semibold">{(ticketsByColumn['New'] || []).length}</span> in New
              </div>
            </Link>

            {/* Right — actions */}
            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <NotificationCenter
                unreadMessages={unreadMessages}
                totalUnread={totalUnread}
                tickets={tickets}
                onSelect={handleNotificationSelect}
                onMarkRead={markAsRead}
              />

              <div className="relative flex-1 min-w-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a07878' }} />
                <input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full text-sm bg-white/80 focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/60 placeholder:text-gray-400"
                  style={{ color: '#5a3535' }}
                />
              </div>

              <div className="hidden md:inline-flex rounded-full overflow-hidden bg-white/70 shadow-sm">
                <button
                  onClick={() => setView('board')}
                  className="px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  style={{
                    background: view === 'board' ? '#3a1f1f' : 'transparent',
                    color: view === 'board' ? 'white' : '#5a3535',
                  }}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Board
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className="px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  style={{
                    background: view === 'calendar' ? '#3a1f1f' : 'transparent',
                    color: view === 'calendar' ? 'white' : '#5a3535',
                  }}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Calendar
                </button>
              </div>

              <button
                onClick={() => setView(view === 'archive' ? 'board' : 'archive')}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 hover:bg-white transition-colors shadow-sm relative"
                title={view === 'archive' ? 'Back to Board' : `Archive (${archivedTickets.length})`}
              >
                {view === 'archive' ? (
                  <LayoutGrid className="w-4 h-4" style={{ color: '#5a3535' }} />
                ) : (
                  <Archive className="w-4 h-4" style={{ color: '#5a3535' }} />
                )}
                {view !== 'archive' && archivedTickets.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: '#e86c84' }}
                  >
                    {archivedTickets.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-2">
          {view === 'archive' ? (
            <ArchivedTicketsList
              tickets={archivedTickets}
              onView={setSelectedRequest}
              onRestore={handleRestore}
            />
          ) : view === 'calendar' ? (
            <CalendarView requests={activeTickets} onSelect={setSelectedRequest} />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {STATUS_COLUMNS.map(col => (
                  <KanbanColumn
                    key={col}
                    status={col}
                    tickets={ticketsByColumn[col] || []}
                    onStatusChange={handleStatusChangeFromMenu}
                    onTicketClick={(t) => { setHighlightMessageId(null); setSelectedRequest(t); }}
                    isLoading={isLoading}
                    highlightedTicketId={highlightedTicketId}
                    viewMode="status"
                    onArchiveAll={col === 'Completed' ? handleArchiveAll : undefined}
                    unreadCountByTicket={unreadCountByTicket}
                  />
                ))}
              </div>
              <AddonLegend />
            </DragDropContext>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 mb-0 pb-2 flex items-center justify-center gap-2 flex-shrink-0">
          <img
            src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/2e08be1fc_image.png"
            alt=""
            className="w-4 h-4 object-contain opacity-70"
          />
          <span className="text-xs" style={{ color: '#7a5555' }}>
            © {new Date().getFullYear()} Pilates in Pink™ Studio
          </span>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          highlightMessageId={highlightMessageId}
          onClose={() => { setSelectedRequest(null); setHighlightMessageId(null); }}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
            setSelectedRequest(null);
            setHighlightMessageId(null);
          }}
        />
      )}

      <StatusChangeDialog
        data={pendingStatusChange}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />

      {isAllowed && <WhatsNewSplash />}
    </div>
  );
}