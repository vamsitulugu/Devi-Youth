import { AlertTriangle } from 'lucide-react';

export function PageSkeleton({ rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card card-pad skeleton-row" style={{ height: 76 }} />
      ))}
    </div>
  );
}

export function PageError({ message = "Couldn't load this page. Please try again." }) {
  return (
    <div className="card empty-state">
      <AlertTriangle className="icon" size={28} />
      <div>{message}</div>
    </div>
  );
}
