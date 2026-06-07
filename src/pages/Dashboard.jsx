import { useState, useMemo, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import MasterKanbanBoard from '../components/master-kanban/MasterKanbanBoard';
import TicketCardContent from '../components/board/TicketCardContent';
import { COLUMN_COLOR_CLASSES, COLUMN_HEADER_CLASSES, DEFAULT_COLOR, DEFAULT_HEADER } from '../components/board/columnTheme';
import HostedSidePanel from '../components/board/HostedSidePanel';
import ArchivedTicketsList from '../components/board/ArchivedTicketsList';
import StatusChangeDialog from '../components/board/StatusChangeDialog';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';
import CalendarView from '../components/dashboard/CalendarView';
import WhatsNewSplash from '../components/dashboard/WhatsNewSplash';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import UserMenu from '../components/dashboard/UserMenu';
import MobileTabBar from '../components/dashboard/MobileTabBar';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Link } from 'react-router-dom';
import { Search, LayoutGrid, Archive, CalendarDays, Plus } from 'lucide-react';

const STATUS_COLUMNS = ['New', 'Quoted', 'Waiting for Payment', 'Confirmed', 'Hosted', 'Ghosted'];
const BOARD_COLUMNS = ['New', 'Quoted', 'Waiting for Payment', 'Confirmed'];
const SIDE_PANEL_COLUMNS = ['Hosted', 'Ghosted'];

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [view, setView] = useState('board'); // 'board' | 'calendar' | 'archive'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [focusComposer, setFocusComposer] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);
  // Local optimistic order overrides for same-column drag reorders.
  // We use plain React state (not queryClient.setQueryData) because flushSync
  // truly forces a synchronous re-render here, eliminating the 1-frame "old
  // order" flash that @hello-pangea/dnd shows after clearing its drop transforms.
  const [orderOverrides, setOrderOverrides] = useState({});
  const { unreadMessages, unreadCountByTicket, totalUnread, markAsRead } = useUnreadMessages(user?.email);

  const handleNotificationSelect = (ticket, messageId) => {
    setSelectedRequest(ticket);
    setHighlightMessageId(messageId);
    markAsRead(messageId);
  };

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
  });

  // Deep-link: ?ticket=<id>&focus=compose → open detail modal + focus composer
  useEffect(() => {
    if (!allTickets.length) return;
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('ticket');
    if (!ticketId) return;
    const ticket = allTickets.find(t => t.id === ticketId);
    if (ticket && !selectedRequest) {
      setSelectedRequest(ticket);
      setFocusComposer(params.get('focus') === 'compose');
      // Clean the URL so reopening the modal manually doesn't auto-focus again
      const url = new URL(window.location.href);
      url.searchParams.delete('ticket');
      url.searchParams.delete('focus');
      window.history.replaceState({}, '', url.toString());
    }
  }, [allTickets, selectedRequest]);

  const isAllowed = user?.email?.endsWith('@pilatesinpinkstudio.com');

  // Normalize legacy statuses → "Quoted"
  const tickets = useMemo(
    () => allTickets.map(t => {
      if (t.status === 'Pending' || t.status === 'In Conversations') {
        return { ...t, status: 'Quoted' };
      }
      return t;
    }),
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

  const matchesSearch = (t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.full_name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.event_type?.toLowerCase().includes(q) ||
      String(t.ticket_number || '').includes(q)
    );
  };

  const archivedTickets = useMemo(
    () => tickets.filter(t => t.archived && t.status !== 'Cancelled' && matchesSearch(t)),
    [tickets, search]
  );

  const cancelledTickets = useMemo(
    () => tickets.filter(t => t.status === 'Cancelled' && matchesSearch(t)),
    [tickets, search]
  );

  const ticketsByColumn = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach(c => (map[c] = []));
    activeTickets.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
    });
    // Sort: manual_order (if set) wins; otherwise fall back to default sort.
    // Default = newest submission first, except "Quoted" = newest update first.
    const defaultCmp = (a, b, key) => {
      const aTime = new Date(a[key] || a.created_date || 0).getTime();
      const bTime = new Date(b[key] || b.created_date || 0).getTime();
      return bTime - aTime;
    };
    Object.keys(map).forEach(k => {
      const sortKey = k === 'Quoted' ? 'updated_date' : 'submitted_date';
      map[k].sort((a, b) => {
        // Local override (set synchronously on drop) wins, then persisted manual_order, then default sort.
        const aMan = orderOverrides[a.id] !== undefined
          ? orderOverrides[a.id]
          : (typeof a.manual_order === 'number' ? a.manual_order : null);
        const bMan = orderOverrides[b.id] !== undefined
          ? orderOverrides[b.id]
          : (typeof b.manual_order === 'number' ? b.manual_order : null);
        if (aMan !== null && bMan !== null) return aMan - bMan;
        if (aMan !== null) return -1; // manually-sorted cards float to top
        if (bMan !== null) return 1;
        return defaultCmp(a, b, sortKey);
      });
    });
    return map;
  }, [activeTickets, orderOverrides]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const ticket = activeTickets.find(t => t.id === draggableId);
    if (!ticket) return;

    const newStatus = destination.droppableId;

    // Same-column reorder → persist manual_order for every card in the column
    if (ticket.status === newStatus) {
      const columnTickets = ticketsByColumn[newStatus] || [];
      const reordered = Array.from(columnTickets);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // flushSync on plain React state guarantees the new order paints in the
      // SAME frame @hello-pangea/dnd clears its drop transforms — no "old order"
      // flash. (react-query setQueryData does NOT flush synchronously because
      // notifyManager batches subscriber notifications.)
      const orderMap = {};
      reordered.forEach((t, i) => { orderMap[t.id] = i; });
      flushSync(() => {
        setOrderOverrides(prev => ({ ...prev, ...orderMap }));
      });

      // Persist in background, then invalidate. Keep the local override in
      // place until refetched data confirms the new order (so there's no flash
      // between override-cleared and cache-updated).
      await Promise.all(
        reordered.map((t, i) => base44.entities.EventRequest.update(t.id, { manual_order: i }))
      );
      await queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
      setOrderOverrides(prev => {
        const next = { ...prev };
        Object.keys(orderMap).forEach(id => { delete next[id]; });
        return next;
      });
      return;
    }

    // Cross-column drag → open status-change dialog (existing flow)
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
      // Clear manual_order — old position is meaningless in the new column
      manual_order: null,
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

  const handleRestore = async (id) => {
    await base44.entities.EventRequest.update(id, { archived: false });
    queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
  };

  if (!isAllowed) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: 'rgba(248, 210, 220, 0.9)' }}>
        <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-md text-center shadow-xl">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#b67651' }}>Access Restricted</h2>
          <p className="text-sm mb-6" style={{ color: '#7a5555' }}>
            The dashboard is only available to Pilates in Pink Studio staff.
          </p>
          <button
            onClick={() => base44.auth.logout('/login')}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 6px 20px rgba(241,136,155,0.35)' }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #b67651, #f6eee7)' }}>
      {/* Tiled slanted "EVENTS" watermark — masked to edges only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        style={{
          zIndex: 1,
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,1) 85%, rgba(0,0,0,1) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 110px, rgba(0,0,0,1) 160px, rgba(0,0,0,1) 100%)',
          WebkitMaskComposite: 'source-in',
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,1) 85%, rgba(0,0,0,1) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 110px, rgba(0,0,0,1) 160px, rgba(0,0,0,1) 100%)',
          maskComposite: 'intersect',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            transform: 'rotate(-30deg)',
            transformOrigin: 'center',
            fontFamily: 'Georgia, serif',
            fontWeight: 900,
            fontSize: '7rem',
            letterSpacing: '0.25em',
            color: 'rgba(255, 255, 255, 0.16)',
            lineHeight: '210px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              {'EVENTS \u00A0\u00A0 '.repeat(3)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-0" style={{ zIndex: 2 }}>

        {/* Sticky redesigned header */}
        <div className="sticky top-0 z-30 px-4 md:px-8 pb-3 pt-[calc(env(safe-area-inset-top,0px)+1rem)] md:pt-[calc(env(safe-area-inset-top,0px)+2rem)]">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3 md:gap-4 px-2">
            {/* Left — logo + counts */}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-3 min-w-0 flex-shrink-0 cursor-pointer"
              title="Reload board"
            >
              <img
                src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/e21e4f4e1_pip-events.png"
                alt="PIP Events"
                className="w-11 h-11 rounded-xl object-cover shadow-sm flex-shrink-0"
              />
              <div className="hidden lg:block text-sm font-medium leading-tight truncate text-left" style={{ color: '#5a3535' }}>
                <span className="font-semibold">{activeTickets.length}</span> active request{activeTickets.length === 1 ? '' : 's'}
                <span className="mx-1.5 opacity-50">•</span>
                <span className="font-semibold">{(ticketsByColumn['New'] || []).length}</span> in New
              </div>
            </button>

            {/* Right — actions */}
            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <div className="order-last lg:order-none">
                <NotificationCenter
                  unreadMessages={unreadMessages}
                  totalUnread={totalUnread}
                  tickets={tickets}
                  onSelect={handleNotificationSelect}
                  onMarkRead={markAsRead}
                />
              </div>

              <a
                href="/RequestForm"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center transition-colors shadow-sm text-white hover:opacity-90"
                style={{ background: '#f1889b' }}
                title="New request (opens in new tab)"
              >
                <Plus className="w-4 h-4" />
              </a>

              <div className="relative flex-1 min-w-0 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a07878' }} />
                <input
                  ref={searchInputRef}
                  placeholder="Search tickets..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-9 pr-3 py-2 rounded-full text-sm bg-white/80 focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder:text-gray-400 transition-shadow"
                  style={{ color: '#5a3535' }}
                />
              </div>

              <div className="hidden lg:inline-flex rounded-full overflow-hidden bg-white/70 shadow-sm">
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
                className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center transition-colors shadow-sm"
                style={{
                  background: view === 'archive' ? '#a855f7' : 'rgba(255,255,255,0.7)',
                }}
                title={view === 'archive' ? 'Back to Board' : 'Archive'}
              >
                <Archive className="w-4 h-4" style={{ color: view === 'archive' ? 'white' : '#5a3535' }} />
              </button>

              <div className="hidden lg:block">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-2">
          {view !== 'archive' && search && (archivedTickets.length + cancelledTickets.length) > 0 && (
            <button
              onClick={() => setView('archive')}
              className="mb-3 text-xs px-3 py-1.5 rounded-full bg-white/70 hover:bg-white shadow-sm transition-colors inline-flex items-center gap-1.5"
              style={{ color: '#5a3535' }}
            >
              <Archive className="w-3 h-3" />
              {archivedTickets.length + cancelledTickets.length} match{archivedTickets.length + cancelledTickets.length === 1 ? '' : 'es'} in Archive — view
            </button>
          )}
          {view === 'archive' ? (
            <ArchivedTicketsList
              tickets={archivedTickets}
              cancelledTickets={cancelledTickets}
              onView={setSelectedRequest}
              onRestore={handleRestore}
            />
          ) : view === 'calendar' ? (
            <CalendarView requests={activeTickets} onSelect={setSelectedRequest} />
          ) : (
            <>
              <div className="board-height-wrap">
              <MasterKanbanBoard
                className="h-full"
                columns={BOARD_COLUMNS.map(col => ({
                  status: col,
                  tickets: ticketsByColumn[col] || [],
                  colorClasses: COLUMN_COLOR_CLASSES[col] || DEFAULT_COLOR,
                  headerClasses: COLUMN_HEADER_CLASSES[col] || DEFAULT_HEADER,
                  emptyLabel: 'No inquiries',
                }))}
                onDragEnd={handleDragEnd}
                isLoading={isLoading}
                highlightedTicketId={highlightedTicketId}
                unreadByTicket={unreadCountByTicket}
                onTicketClick={(t) => { setHighlightMessageId(null); setSelectedRequest(t); }}
                renderCardContent={(ticket) => (
                  <TicketCardContent
                    ticket={ticket}
                    viewMode="status"
                    unreadCount={unreadCountByTicket[ticket.id] || 0}
                  />
                )}
              />
              </div>
              <style>{`
                /* ===== Bounded board height so columns scroll internally ===== */
                .board-height-wrap { height: calc(100vh - 140px); overflow: hidden; }
                @media (max-width: 1023px) {
                  .board-height-wrap { height: calc(100vh - 120px - 56px - env(safe-area-inset-bottom, 0px)); }
                }
                .board-height-wrap > div { height: 100%; }
                .board-height-wrap > div > div[class*="overflow-x-auto"] { height: 100%; padding-bottom: 0; }

                /* ===== Pre-port column chrome ===== */
                .board-height-wrap [data-kanban-column] {
                  height: 100%;
                  max-height: 100%;
                  /* Responsive width: w-72 on small, w-80 on md+ (override Master's w-80) */
                  width: 18rem !important;
                  backdrop-filter: blur(24px);
                  -webkit-backdrop-filter: blur(24px);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
                  overflow: hidden;
                  animation: column-fade-in 0.4s ease-out;
                }
                /* Dimmed columns (e.g. Closed) return to full opacity on hover.
                   Master ships transition-opacity on the shell, so this is smooth. */
                .board-height-wrap [data-kanban-column].opacity-60:hover {
                  opacity: 1;
                }
                @media (min-width: 768px) {
                  .board-height-wrap [data-kanban-column] { width: 20rem !important; }
                }

                /* ===== Empty-state text — light over column tint ===== */
                .board-height-wrap [data-kanban-column] > div:last-child > div.text-center {
                  color: rgba(255,255,255,0.85) !important;
                  font-weight: 500;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                @keyframes column-fade-in {
                  from { opacity: 0; transform: translateY(8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }

                /* ===== Header — white text on saturated tint ===== */
                .board-height-wrap [data-kanban-column] > div:first-child {
                  backdrop-filter: blur(8px);
                  -webkit-backdrop-filter: blur(8px);
                }
                .board-height-wrap [data-kanban-column] > div:first-child h3 {
                  color: white !important;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
                  font-weight: 600;
                  font-size: 0.875rem;
                  letter-spacing: 0.01em;
                }
                .board-height-wrap [data-kanban-column] > div:first-child h3 + span {
                  background: rgba(255,255,255,0.4) !important;
                  color: white !important;
                  font-weight: 700;
                  backdrop-filter: blur(4px);
                }

                /* ===== Translucent glassy cards (Master ships opaque bg-white) ===== */
                /* IMPORTANT: do NOT transition transform / position properties — */
                /* @hello-pangea/dnd manipulates transform during drag + drop, and */
                /* a CSS transition on transform causes a visible "slide-back" flicker */
                /* after onDragEnd fires. Keep transitions to colors + shadow only. */
                .board-height-wrap .bg-white {
                  background: rgba(255,255,255,0.55) !important;
                  backdrop-filter: blur(12px);
                  -webkit-backdrop-filter: blur(12px);
                  border-color: rgba(255,255,255,0.5) !important;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                  transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                }
                .board-height-wrap .bg-white:hover {
                  background: rgba(255,255,255,0.75) !important;
                  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }

                /* ===== Custom scrollbar inside columns ===== */
                .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar { width: 6px; }
                .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
                .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-thumb {
                  background: rgba(255,255,255,0.4); border-radius: 8px;
                }
                .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.6); }
              `}</style>
              <HostedSidePanel
                groups={SIDE_PANEL_COLUMNS.map(status => ({
                  status,
                  tickets: ticketsByColumn[status] || [],
                  headerClasses: COLUMN_HEADER_CLASSES[status] || DEFAULT_HEADER,
                }))}
                onTicketClick={(t) => { setHighlightMessageId(null); setSelectedRequest(t); }}
                highlightedTicketId={highlightedTicketId}
                unreadCountByTicket={unreadCountByTicket}
              />
            </>
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
          focusComposer={focusComposer}
          onClose={() => { setSelectedRequest(null); setHighlightMessageId(null); setFocusComposer(false); }}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
            setSelectedRequest(null);
            setHighlightMessageId(null);
            setFocusComposer(false);
          }}
        />
      )}

      <StatusChangeDialog
        data={pendingStatusChange}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />

      {isAllowed && <WhatsNewSplash />}

      <MobileTabBar
        activeView={view}
        searchActive={searchFocused || !!search}
        onHome={() => {
          setView('board');
          setSearch('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onFocusSearch={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => searchInputRef.current?.focus(), 250);
        }}
        onArchive={() => setView(view === 'archive' ? 'board' : 'archive')}
      />

    </div>
  );
}