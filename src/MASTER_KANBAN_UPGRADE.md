# Master Kanban — Upgrade Bundle (from pip-events spoke)

Everything below is **drop-in ready** for the Master Kanban package so all
spokes get the same glassy look, iOS-native touch DnD, mouse-parity drag
behaviour, bounded board height, and optimistic reorder.

There are **two layers** to ship:

1. **Primitives** — small edits to the Master components themselves
   (`MasterKanbanBoard`, `MasterKanbanColumn`, `MasterKanbanCard`,
   `DragLiftWrapper`). These are framework changes.
2. **Spoke theme template** — a single `<style>` block + a `handleDragEnd`
   pattern that any spoke can paste into its dashboard page to get the
   glass theme + responsive widths + optimistic same-column reorder.

---

## 1. Primitive: `MasterKanbanBoard.jsx`

Key additions:

- `boardHeightClasses` prop (bounded height so columns scroll internally).
- `handleDragStart` / `handleDragEnd` toggle `body.dnd-dragging` class.
- Inline `<style>` block that locks every scroll container during drag —
  **mouse-parity touch behaviour**: only the card moves, page + columns
  stay frozen until drop.

```jsx
import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import useHorizontalScroll from "@/hooks/useHorizontalScroll";
import MasterKanbanColumn from "./MasterKanbanColumn";

export default function MasterKanbanBoard({
  columns = [],
  onDragEnd,
  isLoading = false,
  highlightedTicketId,
  unreadByTicket = {},
  onTicketClick,
  renderCardContent,
  getActions,
  className,
  // Bounded height — spokes override per-app
  boardHeightClasses = "h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]",
}) {
  const { ref, canScrollLeft, canScrollRight, scrollBy } = useHorizontalScroll();

  const handleDragStart = () => {
    if (typeof document !== "undefined") document.body.classList.add("dnd-dragging");
  };
  const handleDragEnd = (result) => {
    if (typeof document !== "undefined") document.body.classList.remove("dnd-dragging");
    onDragEnd?.(result);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mirror mouse-drag exactly on touch: while a card is being dragged,
          freeze every scroll container so ONLY the card moves with the
          pointer (matches how mouse drag feels on desktop, where the page
          and columns don't auto-pan). The library still re-orders cards
          inside the list via placeholders. */}
      <style>{`
        body.dnd-dragging {
          overflow: hidden !important;
          overscroll-behavior: none;
        }
        body.dnd-dragging [data-kanban-list] {
          overflow: hidden !important;
          overscroll-behavior: contain;
        }
      `}</style>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white transition"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white transition"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      )}

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div ref={ref} className={cn("flex gap-4 overflow-x-auto pb-4 px-2 scroll-smooth snap-x", boardHeightClasses)}>
          {columns.map((col) => {
            const actions = getActions?.(col.status) || {};
            return (
              <MasterKanbanColumn
                key={col.status}
                status={col.status}
                tickets={col.tickets || []}
                isLoading={isLoading}
                isDimmed={col.isDimmed}
                colorClasses={col.colorClasses}
                headerClasses={col.headerClasses}
                description={col.description}
                highlightedTicketId={highlightedTicketId}
                unreadByTicket={unreadByTicket}
                onTicketClick={onTicketClick}
                renderCardContent={renderCardContent}
                emptyLabel={col.emptyLabel}
                {...actions}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
```

---

## 2. Primitive: `MasterKanbanColumn.jsx`

Key requirements:

- Root `<div>` has **`data-kanban-column`** attribute (used by spoke CSS).
- Droppable list `<div>` has **`data-kanban-list`** attribute (used by the
  drag-lock CSS + spoke scrollbar overrides).
- Dragged card is **portaled to `document.body`** to escape blurred/clipped
  ancestors (essential for glass / backdrop-blur themes).
- Card wrapper sets `touchAction: "none"` only while dragging and disables
  iOS text-selection callouts.

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Archive, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import MasterKanbanCard from "./MasterKanbanCard";
import DragLiftWrapper from "./DragLiftWrapper";

export default function MasterKanbanColumn({
  status,
  tickets = [],
  isLoading = false,
  isDimmed = false,
  highlightedTicketId,
  unreadByTicket = {},
  onTicketClick,
  renderCardContent,
  colorClasses = "from-white/20 to-white/10 border-white/30",
  headerClasses = "bg-white/30 border-white/40",
  onTidyUp,
  onArchiveSome,
  onArchiveAll,
  emptyLabel = "No items",
  description,
  shellClasses = "flex-shrink-0 w-[42vw] md:w-72 lg:w-80 h-full flex flex-col rounded-2xl border bg-gradient-to-b backdrop-blur-sm transition-opacity",
  listClasses = "flex-1 p-3 space-y-2 min-h-32 overflow-y-auto transition-colors",
  titleClasses = "text-sm font-semibold text-slate-800",
  countBadgeClasses = "text-xs font-medium text-slate-600 bg-white/60 rounded-full px-2 py-0.5",
  descriptionClasses = "text-[11px] text-slate-600/80 mt-0.5 leading-snug",
  emptyClasses = "text-center text-xs text-slate-500 py-8",
  bareCard = false,
}) {
  return (
    <div
      data-kanban-column
      className={cn(shellClasses, colorClasses, isDimmed && "opacity-60")}
    >
      {/* Header */}
      <div className={cn("flex items-start justify-between px-4 py-3 border-b rounded-t-2xl gap-2", headerClasses)}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={titleClasses}>{status}</h3>
            <span className={countBadgeClasses}>{tickets.length}</span>
          </div>
          {description && <p className={descriptionClasses}>{description}</p>}
        </div>

        <div className="flex items-center gap-1">
          {onTidyUp && tickets.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onTidyUp}
              className="h-7 px-2 text-xs gap-1 text-slate-700 hover:bg-white/50" title="Tidy Up">
              <Sparkles className="w-3 h-3" /> Tidy
            </Button>
          )}
          {onArchiveSome && tickets.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onArchiveSome}
              className="h-7 px-2 text-xs text-slate-700 hover:bg-white/50" title="Clean Up">
              Clean
            </Button>
          )}
          {onArchiveAll && (
            <Button variant="ghost" size="sm" onClick={onArchiveAll}
              disabled={tickets.length === 0}
              className="h-7 px-2 text-xs gap-1 text-slate-700 hover:bg-white/50 disabled:opacity-40"
              title="Archive All">
              <Archive className="w-3 h-3" /> All
            </Button>
          )}
        </div>
      </div>

      <Droppable droppableId={status}>
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            data-kanban-list
            className={cn(listClasses, dropSnapshot.isDraggingOver && "bg-white/30")}
          >
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : tickets.length === 0 ? (
              <div className={emptyClasses}>{emptyLabel}</div>
            ) : (
              tickets.map((ticket, index) => (
                <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                  {(provided, snapshot) => {
                    const child = (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          zIndex: snapshot.isDragging ? 9999 : "auto",
                          WebkitUserSelect: "none",
                          userSelect: "none",
                          WebkitTouchCallout: "none",
                          touchAction: snapshot.isDragging ? "none" : "manipulation",
                        }}
                      >
                        <DragLiftWrapper isDragging={snapshot.isDragging}>
                          <MasterKanbanCard
                            ticket={ticket}
                            onClick={() => !snapshot.isDragging && onTicketClick?.(ticket)}
                            isDragging={snapshot.isDragging}
                            isHighlighted={ticket.id === highlightedTicketId}
                            unreadCount={unreadByTicket[ticket.id] || 0}
                            renderContent={renderCardContent}
                            dragBorderClasses={headerClasses}
                            bareCard={bareCard}
                          />
                        </DragLiftWrapper>
                      </div>
                    );
                    if (snapshot.isDragging && typeof document !== "undefined") {
                      return ReactDOM.createPortal(child, document.body);
                    }
                    return child;
                  }}
                </Draggable>
              ))
            )}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
```

---

## 3. Primitive: `MasterKanbanCard.jsx`

⚠️ **Critical**: `transition-all` on the card root must **NOT** include
`transform` — `@hello-pangea/dnd` manipulates `transform` during drag +
drop, and a CSS transition on it causes a visible "slide-back" flicker
after `onDragEnd`. Keep transitions to `colors`, `border-color`, `shadow`
only. (The spoke CSS in §5 enforces this.)

```jsx
import React from "react";
import { cn } from "@/lib/utils";

export default function MasterKanbanCard({
  ticket,
  onClick,
  isDragging = false,
  isHighlighted = false,
  unreadCount = 0,
  renderContent,
  dragBorderClasses,
  bareCard = false,
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl cursor-pointer transition-all",
        !bareCard && "bg-white border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-slate-300",
        isDragging && "shadow-2xl border-2",
        isDragging && (dragBorderClasses || "border-pink-300"),
        isHighlighted && "ring-2 ring-pink-400 animate-pulse"
      )}
    >
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 z-10 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      {renderContent ? renderContent(ticket) : (
        <div className="text-sm text-slate-700">{ticket.title || ticket.id}</div>
      )}
    </div>
  );
}
```

---

## 4. Primitive: `DragLiftWrapper.jsx`

iOS-style pickup feel: subtle scale + tilt + short haptic. The `transform`
lives on an **inner** element — the outer keeps DnD's `translate(x,y)`
untouched (combining the two breaks drop positioning).

```jsx
import { useEffect, useRef } from 'react';

export default function DragLiftWrapper({ isDragging, children }) {
  const wasDragging = useRef(false);

  useEffect(() => {
    if (isDragging && !wasDragging.current) {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(12); } catch { /* ignore */ }
      }
    }
    wasDragging.current = isDragging;
  }, [isDragging]);

  return (
    <div
      style={{
        transform: isDragging ? 'scale(1.04) rotate(1.5deg)' : 'none',
        transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformOrigin: 'center',
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      {children}
    </div>
  );
}
```

---

## 5. Spoke theme template — paste into the dashboard page

Wrap `<MasterKanbanBoard />` in `<div className="board-height-wrap">…</div>`
and add this `<style>` block right next to it. Tweak colours per spoke,
but the **structure**, the **transition rules**, and the
**`overflow-x-hidden` desktop override** are what make the polish work.

```jsx
<div className="board-height-wrap">
  <MasterKanbanBoard className="h-full" {/* …props… */} />
</div>
<style>{`
  /* ===== Bounded board height — columns scroll internally ===== */
  .board-height-wrap { height: calc(100vh - 140px); overflow: hidden; }
  @media (max-width: 1023px) {
    /* leave room for mobile tab bar + safe area */
    .board-height-wrap { height: calc(100vh - 120px - 56px - env(safe-area-inset-bottom, 0px)); }
  }
  .board-height-wrap > div { height: 100%; }
  .board-height-wrap > div > div[class*="overflow-x-auto"] {
    height: 100%;
    padding-bottom: 0;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  /* ===== Column chrome ===== */
  .board-height-wrap [data-kanban-column] {
    height: 100%;
    max-height: 100%;
    width: 18rem !important;          /* mobile */
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.06);
    overflow: hidden;
    animation: column-fade-in 0.4s ease-out;
  }
  .board-height-wrap [data-kanban-column].opacity-60:hover { opacity: 1; }
  @media (min-width: 768px) {
    .board-height-wrap [data-kanban-column] { width: 20rem !important; }
  }
  /* Desktop — fit all swimlanes to viewport, no horizontal scroll */
  @media (min-width: 1024px) {
    .board-height-wrap [data-kanban-column] {
      flex: 1 1 0 !important;
      width: auto !important;
      min-width: 0 !important;
    }
    .board-height-wrap > div > div[class*="overflow-x-auto"] {
      overflow-x: hidden !important;
    }
  }
  @keyframes column-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ===== Empty-state text ===== */
  .board-height-wrap [data-kanban-column] > div:last-child > div.text-center {
    color: rgba(255,255,255,0.85) !important;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  /* ===== Header — white text on tint ===== */
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

  /* ===== Translucent glassy cards =====
     IMPORTANT: do NOT transition transform / position properties — DnD
     manipulates transform during drag + drop, and a CSS transition on
     transform causes a visible "slide-back" flicker after onDragEnd.
     Keep transitions to colors + shadow only. */
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
  .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.6);
  }
`}</style>
```

---

## 6. Optimistic same-column reorder pattern (`handleDragEnd`)

Cross-column drag → usually opens a status-change dialog (per spoke).
**Same-column drag** → persist a `manual_order` field. The flash-free trick
is `flushSync` on a **plain React state override** so the new order paints
in the same frame DnD clears its drop transforms.

```jsx
import { flushSync } from 'react-dom';

const [orderOverrides, setOrderOverrides] = useState({});

// Apply override in your column sort:
//   const aMan = orderOverrides[a.id] ?? a.manual_order ?? null;
//   const bMan = orderOverrides[b.id] ?? b.manual_order ?? null;
//   if (aMan !== null && bMan !== null) return aMan - bMan;
//   …

const handleDragEnd = async (result) => {
  const { destination, source, draggableId } = result;
  if (!destination) return;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  const ticket = activeTickets.find(t => t.id === draggableId);
  if (!ticket) return;
  const newStatus = destination.droppableId;

  // Same column → manual reorder
  if (ticket.status === newStatus) {
    const colTickets = ticketsByColumn[newStatus] || [];
    const reordered = Array.from(colTickets);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    const orderMap = {};
    reordered.forEach((t, i) => { orderMap[t.id] = i; });

    // flushSync guarantees the new order paints in the SAME frame DnD
    // clears its transforms — no "old order" flash.
    flushSync(() => {
      setOrderOverrides(prev => ({ ...prev, ...orderMap }));
    });

    await Promise.all(reordered.map((t, i) =>
      base44.entities.YourEntity.update(t.id, { manual_order: i })
    ));
    await queryClient.invalidateQueries({ queryKey: ['yourEntity'] });

    setOrderOverrides(prev => {
      const next = { ...prev };
      Object.keys(orderMap).forEach(id => { delete next[id]; });
      return next;
    });
    return;
  }

  // Cross column → open dialog / update status
  // …
};
```

Add `manual_order: { type: 'number' }` to the entity schema, and **clear it
(`manual_order: null`) when the status changes** — old positions are
meaningless in a new column.

---

## 7. Optional add-on patterns (lift from this spoke as-is)

These aren't part of Master itself but are useful spoke building blocks:

- **`HostedSidePanel.jsx`** — right-edge slide-out swimlane for "park"
  statuses (Hosted, Ghosted, Done). Responsive: middle-right on desktop /
  tablet, bottom-right above the mobile tab bar on phones. Uses the same
  `DragLiftWrapper` + portal-on-drag pattern as columns.
- **`MobileTabBar.jsx`** — iOS-style bottom tab bar with safe-area padding.
  Home / Search / Archive / Profile, with 44×44 minimum tap targets.
- **`useHorizontalScroll`** hook — drives the `<ChevronLeft/Right>` arrows
  in `MasterKanbanBoard`. Already in this spoke at `hooks/useHorizontalScroll.js`.

---

## Summary of behaviour you get for free

| Behaviour | How |
|---|---|
| Touch DnD = mouse DnD (page + columns frozen during drag) | `body.dnd-dragging` overflow lock in `MasterKanbanBoard` `<style>` |
| Dragged card escapes blurred/clipped ancestors | Portal to `document.body` in `MasterKanbanColumn` |
| iOS pickup feel (scale + tilt + haptic) | `DragLiftWrapper` |
| No "slide-back" flicker on drop | NO `transform` in card transitions + `flushSync` on optimistic reorder |
| Glass theme with white-on-tint headers | Spoke `<style>` template targets `[data-kanban-column]` |
| All columns fit screen on desktop, scroll on tablet/mobile | `flex: 1 1 0` + `overflow-x: hidden` at `lg+` |
| Bounded height — column lists scroll internally | `boardHeightClasses` prop + `.board-height-wrap` |
| Horizontal scroll arrows on tablet/mobile | `useHorizontalScroll` (already in `MasterKanbanBoard`) |