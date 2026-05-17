import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import TicketCard from './TicketCard';

export default function HostedSidePanel({
  tickets = [],
  onStatusChange,
  onTicketClick,
  highlightedTicketId,
  unreadCountByTicket = {},
}) {
  const [open, setOpen] = useState(true);
  const count = tickets.length;

  return (
    <div
      className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 items-center"
      style={{ pointerEvents: 'none' }}
    >
      {/* Toggle handle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex flex-col items-center justify-center rounded-l-xl shadow-lg transition-all"
        style={{
          pointerEvents: 'auto',
          width: 32,
          height: 120,
          background: 'linear-gradient(135deg,#a855f7,#9333ea)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRight: 'none',
        }}
        title={open ? 'Hide Hosted' : 'Show Hosted'}
      >
        <span className="text-[9px] font-bold text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>HOSTED</span>
        {open ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Panel */}
      <div
        className="rounded-l-2xl shadow-2xl backdrop-blur-md transition-all overflow-hidden"
        style={{
          pointerEvents: 'auto',
          width: open ? 280 : 0,
          opacity: open ? 1 : 0,
          background: 'linear-gradient(180deg, rgba(233,213,255,0.92), rgba(255,255,255,0.92))',
          border: open ? '1px solid rgba(168,85,247,0.35)' : 'none',
          borderRight: 'none',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {open && (
          <>
            <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#9333ea' }} />
                <h3 className="font-bold text-sm" style={{ color: '#6b21a8' }}>Hosted</h3>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(168,85,247,0.18)', color: '#6b21a8' }}
              >
                {count}
              </span>
            </div>

            <Droppable droppableId="Hosted">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 overflow-y-auto px-2 py-2 space-y-2 hosted-scroll"
                  style={{
                    background: snapshot.isDraggingOver ? 'rgba(168,85,247,0.08)' : 'transparent',
                  }}
                >
                  {tickets.length === 0 ? (
                    <p className="text-xs text-center py-8" style={{ color: '#6b7280' }}>
                      No hosted events yet
                    </p>
                  ) : (
                    tickets.map((t, idx) => (
                      <Draggable key={t.id} draggableId={t.id} index={idx}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <TicketCard
                              ticket={t}
                              onStatusChange={onStatusChange}
                              onClick={onTicketClick}
                              isDragging={snap.isDragging}
                              isHighlighted={highlightedTicketId === t.id}
                              viewMode="status"
                              unreadCount={unreadCountByTicket[t.id] || 0}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </>
        )}
      </div>

      <style>{`
        .hosted-scroll::-webkit-scrollbar { width: 6px; }
        .hosted-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 3px; }
      `}</style>
    </div>
  );
}