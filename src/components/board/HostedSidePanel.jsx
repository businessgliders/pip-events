import ReactDOM from 'react-dom';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import TicketCardContent from './TicketCardContent';
import DragLiftWrapper from '../master-kanban/DragLiftWrapper';

/**
 * Right-edge side panel for a single back-office swimlane (e.g. Hosted, Ghosted).
 * Multiple instances can be stacked on the right edge using `verticalAlign`.
 *
 * Props:
 *   status: string              — column name (e.g. "Hosted")
 *   tickets: Ticket[]
 *   headerClasses?: string      — Tailwind classes for the header bar tint
 *   shellClasses?: string       — Tailwind classes for the panel shell gradient/border
 *   handleGradient?: string     — CSS background for the toggle handle
 *   verticalAlign?: 'top'|'middle'|'bottom'  — handle position on the right edge
 *   onTicketClick(ticket)
 *   highlightedTicketId
 *   unreadCountByTicket
 *   onDragEnd                   — optional
 */
export default function HostedSidePanel({
  status,
  tickets = [],
  headerClasses = 'bg-purple-500/30 border-purple-400/40',
  shellClasses = 'from-violet-400/20 to-purple-300/20 border-purple-300/40',
  handleGradient = 'linear-gradient(135deg,#a855f7,#9333ea)',
  verticalAlign = 'middle',
  onTicketClick,
  highlightedTicketId,
  unreadCountByTicket = {},
  onDragEnd,
}) {
  const [open, setOpen] = useState(false);
  const count = tickets.length;
  const handleLabel = status.toUpperCase();

  // md+ (tablet & desktop): anchored on the right edge, vertically positioned.
  // Mobile (<md): anchored bottom-right, just above the mobile tab bar.
  const desktopPosClass =
    verticalAlign === 'top'
      ? 'md:top-[22%] md:-translate-y-1/2'
      : verticalAlign === 'bottom'
      ? 'md:top-[78%] md:-translate-y-1/2'
      : 'md:top-1/2 md:-translate-y-1/2';

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
        className={`flex fixed right-0 z-20 items-center bottom-20 md:bottom-auto ${desktopPosClass}`}
        style={{ pointerEvents: 'none' }}
      >
        {/* Toggle handle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex flex-col items-center justify-center rounded-l-2xl shadow-lg transition-all gap-1"
          style={{
            pointerEvents: 'auto',
            width: 32,
            height: 120,
            background: handleGradient,
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
          className={`backdrop-blur-xl bg-gradient-to-b ${shellClasses} border rounded-l-2xl overflow-hidden shadow-xl flex flex-col transition-all ${
            !open ? 'w-0 opacity-0' : 'w-80 opacity-100'
          }`}
          style={{
            pointerEvents: 'auto',
            maxHeight: '70vh',
            height: 'calc(100vh - 300px)',
          }}
        >
          {open && (
            <>
              <div className={`backdrop-blur-md ${headerClasses} border-b px-3 md:px-4 py-3 md:py-4 flex-shrink-0`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-white font-semibold text-sm md:text-base truncate drop-shadow">{status}</h3>
                  <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-white/40 text-white text-xs font-bold backdrop-blur">
                    {count}
                  </span>
                </div>
              </div>

              <DragDropContext
                onDragStart={() => document.body.classList.add('dnd-dragging')}
                onDragEnd={(r) => {
                  document.body.classList.remove('dnd-dragging');
                  (onDragEnd || (() => {}))(r);
                }}
              >
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      data-kanban-list
                      className={`flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 custom-scrollbar transition-colors ${
                        snapshot.isDraggingOver ? 'bg-white/10' : ''
                      }`}
                    >
                      {tickets.length === 0 ? (
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
                                  style={{
                                    ...prov.draggableProps.style,
                                    WebkitUserSelect: 'none',
                                    userSelect: 'none',
                                    WebkitTouchCallout: 'none',
                                    touchAction: snap.isDragging ? 'none' : 'manipulation',
                                  }}
                                >
                                  <DragLiftWrapper isDragging={snap.isDragging}>
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
                                  </DragLiftWrapper>
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
              </DragDropContext>
            </>
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