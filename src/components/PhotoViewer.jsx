import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// photos: [{ id, src, caption? }]. index: which photo is open.
export default function PhotoViewer({ photos, index, onClose, onIndexChange }) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const pinchRef = useRef(null); // { startDist, startZoom }
  const photo = photos[index];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetZoom();
  }, [index, resetZoom]);

  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (index < photos.length - 1) onIndexChange(index + 1);
  }, [index, photos.length, onIndexChange]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
      else if (e.key === '-') setZoom((z) => Math.max(MIN_ZOOM, z - 0.5));
      else if (e.key === '0') resetZoom();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, goPrev, goNext, resetZoom]);

  // Prevent the page behind the viewer from scrolling while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(2)));
  }
  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, +(z - 0.5).toFixed(2));
      if (next === MIN_ZOOM) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  // Simple drag-to-pan when zoomed in (mouse + touch), and pinch-free
  // double-tap/click to toggle zoom for a quick mobile-friendly gesture.
  function onPointerDown(e) {
    if (e.touches && e.touches.length === 2) {
      // Two fingers landed — start of a pinch gesture, not a drag.
      dragRef.current = null;
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchRef.current = { startDist: dist, startZoom: zoom };
      return;
    }
    if (zoom <= MIN_ZOOM) return;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current = { startX: point.clientX, startY: point.clientY, origin: pos };
  }
  function onPointerMove(e) {
    if (e.touches && e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const { startDist, startZoom } = pinchRef.current;
      if (startDist > 0) {
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom * (dist / startDist)));
        setZoom(+nextZoom.toFixed(2));
        if (nextZoom <= MIN_ZOOM) setPos({ x: 0, y: 0 });
      }
      return;
    }
    if (!dragRef.current) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragRef.current.startX;
    const dy = point.clientY - dragRef.current.startY;
    setPos({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy });
  }
  function onPointerUp(e) {
    if (e?.touches && e.touches.length > 0) return; // still have a finger down
    dragRef.current = null;
    pinchRef.current = null;
  }
  function onDoubleClick() {
    if (zoom > MIN_ZOOM) resetZoom();
    else setZoom(2);
  }

  // Mouse-wheel / trackpad zoom for desktop, centered roughly on the
  // cursor so zooming feels natural rather than always zooming to center.
  function onWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY;
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta * 0.0015 * z).toFixed(2)));
      if (next === MIN_ZOOM) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  if (!photo) return null;

  return (
    <div
      className="photo-viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="photo-viewer-toolbar">
        <div className="photo-viewer-counter">{index + 1} / {photos.length}</div>
        <div className="photo-viewer-actions">
          <button onClick={zoomOut} aria-label="Zoom out" disabled={zoom <= MIN_ZOOM}><ZoomOut size={18} /></button>
          <button onClick={zoomIn} aria-label="Zoom in" disabled={zoom >= MAX_ZOOM}><ZoomIn size={18} /></button>
          <button onClick={resetZoom} aria-label="Reset zoom" disabled={zoom === 1 && pos.x === 0 && pos.y === 0}><RotateCcw size={17} /></button>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
      </div>

      <div
        className="photo-viewer-stage"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
      >
        {index > 0 && (
          <button className="photo-viewer-nav prev" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous photo">
            <ChevronLeft size={26} />
          </button>
        )}
        <img
          src={photo.src}
          alt={photo.caption || ''}
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            cursor: zoom > MIN_ZOOM ? 'grab' : 'zoom-in',
          }}
        />
        {index < photos.length - 1 && (
          <button className="photo-viewer-nav next" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next photo">
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {photo.caption && <div className="photo-viewer-caption">{photo.caption}</div>}
    </div>
  );
}