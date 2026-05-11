import { useState, useMemo, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/layout/Navbar';
import HlsVideo from '../components/HlsVideo';
import KanbanColumn from '../components/board/KanbanColumn';
import ArchivedTicketsList from '../components/board/ArchivedTicketsList';
import StatusChangeDialog from '../components/board/StatusChangeDialog';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LayoutGrid, Archive, Tag } from 'lucide-react';

const STATUS_COLUMNS = ['New', 'In Conversations', 'Confirmed', 'Completed'];
const CATEGORY_COLUMNS = [
  'Birthday',
  'Bridal Shower',
  'Bachelorette Party',
  'Corporate Wellness Event',
  'Private Class',
  'Other',
];

export default function Dashboard() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('board'); // 'board' | 'archive'
  const [viewMode, setViewMode] = useState('status'); // 'status' | 'category'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);

  // Auth gate — restrict to studio domain
  useEffect(() => {
    if (!isAuthenticated) navigateToLogin();
  }, [isAuthenticated, navigateToLogin]);

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

  const columns = viewMode === 'status' ? STATUS_COLUMNS : CATEGORY_COLUMNS;

  const ticketsByColumn = useMemo(() => {
    const map = {};
    columns.forEach(c => (map[c] = []));
    activeTickets.forEach(t => {
      const key = viewMode === 'status' ? t.status : t.event_type;
      if (map[key]) map[key].push(t);
    });
    return map;
  }, [activeTickets, columns, viewMode]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const ticket = activeTickets.find(t => t.id === draggableId);
    if (!ticket) return;

    if (viewMode === 'category') {
      // Direct update — change event_type
      const newType = destination.droppableId;
      if (ticket.event_type === newType) return;
      await base44.entities.EventRequest.update(ticket.id, { event_type: newType });
      queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
      return;
    }

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
      <div className="min-h-screen relative flex items-center justify-center">
        <HlsVideo
          src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
          className="fixed inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        <div className="fixed inset-0" style={{ zIndex: 1, background: 'rgba(248, 210, 220, 0.9)' }} />
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
    <div className="min-h-screen relative">
      <HlsVideo
        src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
        className="fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      <div className="fixed inset-0" style={{ zIndex: 1, background: 'rgba(248, 210, 220, 0.85)' }} />

      <div className="relative" style={{ zIndex: 2 }}>
        <Navbar />

        {/* Sticky header */}
        <div className="sticky top-12 z-30 backdrop-blur-xl bg-white/30 border-b border-white/40 px-3 md:px-6 py-3">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by name, email, type, ticket #"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white/70 border-white/40"
              />
            </div>

            {view === 'board' && (
              <div className="inline-flex rounded-xl overflow-hidden border border-white/40 bg-white/30">
                <button
                  onClick={() => setViewMode('status')}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'status' ? 'bg-white text-pink-600' : 'text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Status
                </button>
                <button
                  onClick={() => setViewMode('category')}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'category' ? 'bg-white text-pink-600' : 'text-white'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Category
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === 'board' ? 'archive' : 'board')}
              className="bg-white/70 border-white/40"
            >
              {view === 'board' ? (
                <><Archive className="w-4 h-4 mr-1" /> Archive ({archivedTickets.length})</>
              ) : (
                <><LayoutGrid className="w-4 h-4 mr-1" /> Board</>
              )}
            </Button>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4">
          {view === 'archive' ? (
            <ArchivedTicketsList
              tickets={archivedTickets}
              onView={setSelectedRequest}
              onRestore={handleRestore}
            />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div
                className={`grid gap-3 md:gap-4 ${
                  viewMode === 'status'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
                }`}
              >
                {columns.map(col => (
                  <KanbanColumn
                    key={col}
                    status={col}
                    tickets={ticketsByColumn[col] || []}
                    onStatusChange={handleStatusChangeFromMenu}
                    onTicketClick={setSelectedRequest}
                    isLoading={isLoading}
                    highlightedTicketId={highlightedTicketId}
                    viewMode={viewMode}
                    onArchiveAll={col === 'Completed' && viewMode === 'status' ? handleArchiveAll : undefined}
                  />
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
            setSelectedRequest(null);
          }}
        />
      )}

      <StatusChangeDialog
        data={pendingStatusChange}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  );
}