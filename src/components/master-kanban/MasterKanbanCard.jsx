import React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MasterKanbanCard — a generic, presentation-only ticket card.
 *
 * Intentionally dumb: the spoke app decides what to render inside via the
 * `renderContent` prop. The card just provides drag styling, highlight glow,
 * unread badge, and click handling.
 *
 * v0.1.2 — `bareCard` skips the default white chrome (bg/border/padding/shadow)
 * for spokes whose `renderContent` is already a fully-styled card (glassmorphic,
 * dark theme, etc.). The wrapper still handles click, unread badge, and the
 * highlight ring (rounded-xl so it follows the card shape).
 */
export default function MasterKanbanCard({
  ticket,
  onClick,
  isDragging = false,
  isHighlighted = false,
  unreadCount = 0,
  renderContent,
  // Optional: tailwind border-color class matched to the source column so the
  // card's border tints to the current swimlane's color while being dragged.
  // (Pass e.g. "border-pink-300" — only the border-* class is used.)
  dragBorderClasses,
  // v0.1.2 — when true, skip the default white card chrome so the consumer's
  // renderContent provides the full visual.
  bareCard = false,
  // v0.1.4 — when provided, render a dedicated drag handle (grip icon) with
  // these props instead of making the whole card draggable. This is required
  // for touch devices so vertical column-scroll / horizontal board-scroll
  // gestures don't conflict with drag initiation.
  dragHandleProps,
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
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: "none" }}
          className="absolute top-1 right-1 z-10 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-grab active:cursor-grabbing"
          title="Drag to move"
          aria-label="Drag handle"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      {renderContent ? renderContent(ticket) : (
        <div className="text-sm text-slate-700">{ticket.title || ticket.id}</div>
      )}
    </div>
  );
}