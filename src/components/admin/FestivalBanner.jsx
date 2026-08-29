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
    <div className="eyebrow" style={{ alignSelf: 'flex-start' }}>
      <CalendarRange size={13} /> Editing {festival.year}
      {!festival.is_active && ' (not the active year)'}
    </div>
  );
}