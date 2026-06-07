import ReactDOM from 'react-dom';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import TicketCardContent from './TicketCardContent';

/**
 * Stacked right-edge side panel for "back-office" swimlanes (e.g. Hosted, Ghosted).
 * Each group renders its own header + droppable.
 *
 * Props:
 *   groups: [{ status: string, tickets: Ticket[], headerClasses?: string, shellClasses?: string }]
 *   onTicketClick(ticket)
 *   highlightedTicketId
 *   unreadCountByTicket
 *   onDragEnd  — optional; not currently wired from Dashboard (status changes happen via modal)
 */
export default function HostedSidePanel({
  groups = [],
  onTicketClick,
  highlightedTicketId,
  unreadCountByTicket = {},
  onDragEnd,
}) {
  const [open, setOpen] = useState(false);
  const totalCount = groups.reduce((sum, g) => sum + (g.tickets?.length || 0), 0);
  const handleLabel = groups.map(g => g.status.toUpperCase()).join(' / ');

  return (
    <>
      {/* Backdrop blur overlay */}
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      <div
        className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 items-center"
        style={{ pointerEvents: 'none' }}
      >
        {/* Toggle handle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex flex-col items-center justify-center rounded-l-2xl shadow-lg transition-all gap-1"
          style={{
            pointerEvents: 'auto',
            width: 32,
            height: 140,
            background: 'linear-gradient(135deg,#a855f7,#9333ea)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRight: 'none',
          }}
          title={open ? `Hide ${handleLabel}` : `Show ${handleLabel}`}
        >
          <span
            className="text-[9px] font-bold text-center leading-tight"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {handleLabel}
          </span>
          {open ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Panel */}
        <div
          className={`backdrop-blur-xl bg-gradient-to-b from-violet-400/20 to-purple-300/20 border border-purple-300/40 rounded-l-2xl overflow-hidden shadow-xl flex flex-col transition-all ${
            !open ? 'w-0 opacity-0' : 'w-80 opacity-100'
          }`}
          style={{
            pointerEvents: 'auto',
            maxHeight: '75vh',
            height: 'calc(100vh - 250px)',
          }}
        >
          {open && (
            <DragDropContext onDragEnd={onDragEnd || (() => {})}>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {groups.map((group, gi) => (
                  <div key={group.status} className={gi > 0 ? 'border-t border-white/30' : ''}>
                    <div className={`backdrop-blur-md ${group.headerClasses || 'bg-purple-500/30 border-purple-400/40'} border-b px-3 md:px-4 py-2.5 md:py-3 flex-shrink-0 sticky top-0 z-10`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-white font-semibold text-sm md:text-base truncate drop-shadow">
                          {group.status}
                        </h3>
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-white/40 text-white text-xs font-bold backdrop-blur">
                          {group.tickets?.length || 0}
                        </span>
                      </div>
                    </div>

                    <Droppable droppableId={group.status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 md:p-3 space-y-2 md:space-y-3 transition-colors min-h-[60px] ${
                            snapshot.isDraggingOver ? 'bg-white/10' : ''
                          }`}
                        >
                          {(group.tickets?.length || 0) === 0 ? (
                            <div className="text-center text-white/60 text-sm py-6">No inquiries</div>
                          ) : (
                            group.tickets.map((ticket, index) => (
                              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                {(prov, snap) => {
                                  const card = (
                                    <div
                                      ref={prov.innerRef}
                                      {...prov.draggableProps}
                                      {...prov.dragHandleProps}
                                      style={prov.draggableProps.style}
                                    >
                                      <div
                                        onClick={() => onTicketClick && onTicketClick(ticket)}
                                        className={`relative backdrop-blur-md border rounded-xl p-3 group transition-all ${
                                          snap.isDragging
                                            ? 'shadow-2xl bg-white/90 border-white/60 cursor-grabbing ring-4 ring-white/60'
                                            : highlightedTicketId === ticket.id
                                            ? 'shadow-2xl bg-white/70 border-white/50 ring-4 ring-yellow-400/50 cursor-grab'
                                            : 'bg-white/55 border-white/50 hover:bg-white/70 shadow-lg hover:shadow-xl cursor-grab'
                                        }`}
                                      >
                                        <TicketCardContent
                                          ticket={ticket}
                                          viewMode="status"
                                          unreadCount={unreadCountByTicket[ticket.id] || 0}
                                        />
                                      </div>
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
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 8px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
          `}</style>
        </div>
      </div>
    </>
  );
}