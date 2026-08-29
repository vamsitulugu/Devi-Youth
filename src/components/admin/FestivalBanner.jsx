import { Link } from 'react-router-dom';
import { CalendarRange } from 'lucide-react';

export default function FestivalBanner({ festival }) {
  if (!festival) {
    return (
      <div className="card card-pad empty-state">
        No festival year selected. <Link to="/admin/settings" style={{ color: 'var(--color-marigold-text)', fontWeight: 700 }}>Set one up in Settings</Link>.
      </div>
    );
  }
  return (
    <div
      className="chip"
      style={{ alignSelf: 'flex-start', display: 'inline-flex', gap: 6 }}
    >
      <CalendarRange size={13} /> Editing {festival.year}
      {!festival.is_active && ' (not the active year)'}
    </div>
  );
}