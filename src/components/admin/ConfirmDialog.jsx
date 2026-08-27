import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title = 'Are you sure?', message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="lightbox" style={{ background: 'rgba(20,10,5,0.55)' }} onClick={onCancel}>
      <div
        className="card card-pad"
        style={{ width: 'min(92vw, 360px)', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <AlertTriangle color="var(--color-danger)" size={30} style={{ margin: '0 auto 10px' }} />
        <div style={{ fontWeight: 700, fontSize: 'var(--fs-md)', marginBottom: 6 }}>{title}</div>
        {message && <div style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)', marginBottom: 16 }}>{message}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-block" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-block"
            style={{ background: 'var(--color-danger)', color: '#fff' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
