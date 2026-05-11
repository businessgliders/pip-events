import ReactDOM from 'react-dom';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, Archive } from 'lucide-react';
import TicketCard from './TicketCard';

const columnColors = {
  // Status columns
  'New':              'from-pink-400/20 to-pink-300/20 border-pink-300/40',
  'In Conversations': 'from-yellow-400/20 to-amber-300/20 border-amber-300/40',
  'Confirmed':        'from-blue-400/20 to-sky-300/20 border-sky-300/40',
  'Completed':        'from-emerald-400/20 to-green-300/20 border-green-300/40',
  // Category columns
  'Birthday':                 'from-pink-400/20 to-rose-300/20 border-rose-300/40',
  'Bridal Shower':            'from-fuchsia-400/20 to-pink-300/20 border-pink-300/40',
  'Bachelorette Party':       'from-purple-400/20 to-fuchsia-300/20 border-fuchsia-300/40',
  'Corporate Wellness Event': 'from-indigo-400/20 to-blue-300/20 border-blue-300/40',
  'Private Class':            'from-teal-400/20 to-cyan-300/20 border-cyan-300/40',
  'Other':                    'from-slate-400/20 to-gray-300/20 border-gray-300/40',
};

const headerColors = {
  'New':              'bg-pink-500/30 border-pink-400/40',
  'In Conversations': 'bg-amber-500/30 border-amber-400/40',
  'Confirmed':        'bg-sky-500/30 border-sky-400/40',
  'Completed':        'bg-emerald-500/30 border-emerald-400/40',
  'Birthday':                 'bg-rose-500/30 border-rose-400/40',
  'Bridal Shower':            'bg-pink-500/30 border-pink-400/40',
  'Bachelorette Party':       'bg-fuchsia-500/30 border-fuchsia-400/40',
  'Corporate Wellness Event': 'bg-blue-500/30 border-blue-400/40',
  'Private Class':            'bg-teal-500/30 border-teal-400/40',
  'Other':                    'bg-gray-500/30 border-gray-400/40',
};

export default function KanbanColumn({
  status,
  tickets,
  onStatusChange,
  onTicketClick,
  isLoading,
  highlightedTicketId,
  onArchiveAll,
  onTidyUp,
  viewMode,
  unreadCountByTicket = {},
}) {
  const isDimmed = status === 'Completed';
  const colorCls = columnColors[status] || 'from-white/20 to-white/10 border-white/30';
  const headerCls = headerColors[status] || 'bg-white/30 border-white/40';

  return (
    <div
      data-swimlane
      className={`backdrop-blur-xl bg-gradient-to-b ${colorCls} border rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[70vh] lg:max-h-none lg:h-[calc(100vh-300px)] ${
        isDimmed ? 'opacity-70 hover:opacity-100 transition-opacity' : ''
      }`}
    >
      <div className={`backdrop-blur-md ${headerCls} border-b px-3 md:px-4 py-3 md:py-4 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-semibold text-sm md:text-base truncate drop-shadow">{status}</h3>
          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-white/40 text-white text-xs font-bold backdrop-blur">
            {tickets.length}
          </span>
        </div>
        {status === 'Completed' && tickets.length > 0 && (
          <div className="flex gap-2 mt-2">
            {onTidyUp && (
              <Button size="sm" variant="secondary" className="h-7 px-2 bg-white/70 hover:bg-white/90 text-xs" onClick={onTidyUp}>
                <Sparkles className="w-3 h-3 mr-1" /> Tidy Up
              </Button>
            )}
            {onArchiveAll && (
              <Button size="sm" variant="secondary" className="h-7 px-2 bg-white/70 hover:bg-white/90 text-xs" onClick={onArchiveAll}>
                <Archive className="w-3 h-3 mr-1" /> Archive All
              </Button>
            )}
          </div>
        )}
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 custom-scrollbar transition-colors ${
              snapshot.isDraggingOver ? 'bg-white/10' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Skeleton className="h-24 md:h-32 rounded-xl bg-white/20" />
                <Skeleton className="h-24 md:h-32 rounded-xl bg-white/20" />
                <Skeleton className="h-24 md:h-32 rounded-xl bg-white/20" />
              </>
            ) : tickets.length === 0 ? (
              <div className="text-center text-white/60 text-sm py-12">No inquiries</div>
            ) : (
              tickets.map((ticket, index) => (
                <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                  {(prov, snap) => {
                    const card = (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        style={prov.draggableProps.style}
                      >
                        <TicketCard
                          ticket={ticket}
                          onStatusChange={onStatusChange}
                          onClick={onTicketClick}
                          isDragging={snap.isDragging}
                          isHighlighted={highlightedTicketId === ticket.id}
                          viewMode={viewMode}
                          unreadCount={unreadCountByTicket[ticket.id] || 0}
                        />
                      </div>
                    );
                    return snap.isDragging ? ReactDOM.createPortal(card, document.body) : card;
                  }}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
}