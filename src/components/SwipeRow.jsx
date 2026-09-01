import { useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * Wraps one admin list row. Swipe left to reveal Edit/Delete (or a
 * custom `actions` array); tap anywhere on the row while closed still
 * fires normally. Snaps open/closed rather than free-scrolling, and
 * only one open at a time isn't enforced here (kept simple) — closes
 * itself on outside tap via onPointerDown on the backdrop-less row.
 */
export default function SwipeRow({ children, onEdit, onDelete, actions, className = '', style }) {
  const [dragX, setDragX] = useState(0);
  const [open, setOpen] = useState(false);
  const startX = useRef(null);
  const dragging = useRef(false);

  const list = actions || [
    onEdit && { icon: Pencil, label: 'Edit', onClick: onEdit, color: 'var(--color-ink)' },
    onDelete && { icon: Trash2, label: 'Delete', onClick: onDelete, color: 'var(--color-danger)' },
  ].filter(Boolean);

  const actionsWidth = list.length * 56;

  function onTouchStart(e) {
    dragging.current = true;
    startX.current = e.touches[0].clientX;
  }
  function onTouchMove(e) {
    if (!dragging.current) return;
    const delta = e.touches[0].clientX - startX.current;
    const base = open ? -actionsWidth : 0;
    const next = Math.max(-actionsWidth, Math.min(0, base + delta));
    setDragX(next);
  }
  function onTouchEnd() {
    dragging.current = false;
    const shouldOpen = dragX < -actionsWidth / 2;
    setOpen(shouldOpen);
    setDragX(shouldOpen ? -actionsWidth : 0);
  }

  return (
    <div className={`swipe-row ${className}`} style={style}>
      <div className="swipe-row-actions" style={{ width: actionsWidth }}>
        {list.map(({ icon: Icon, label, onClick, color }) => (
          <button
            key={label}
            type="button"
            className="swipe-action-btn"
            style={{ background: color }}
            onClick={() => { onClick(); setOpen(false); setDragX(0); }}
            aria-label={label}
          >
            <Icon size={17} />
          </button>
        ))}
      </div>
      <div
        className="swipe-row-inner"
        style={{ transform: `translateX(${dragX}px)`, transition: dragging.current ? 'none' : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
