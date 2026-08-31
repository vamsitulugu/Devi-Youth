import { useEffect, useState } from 'react';
import { Users, Trash2, Phone } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { useCountUp } from '../../hooks/useCountUp';
import { listRsvps, deleteRsvp } from '../../services/rsvp';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import Reveal from '../../components/Reveal';

function AnimatedCount({ value }) {
  const shown = useCountUp(value);
  return <span className="admin-stat-value" style={{ fontSize: 'var(--fs-xxl)', fontWeight: 800 }}>{Math.round(shown)}</span>;
}

export default function ManageRsvp() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    setLoading(true);
    try {
      setItems(await listRsvps(festivalId));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId, festivalLoading]);

  async function handleDelete() {
    try {
      await deleteRsvp(toDelete.id);
      toast('RSVP removed');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const totalGuests = items.reduce((s, r) => s + Number(r.guests || 1), 0);

  return (
    <>
      <AdminHeader title="RSVPs" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {(loading || festivalLoading) && <PageSkeleton />}
        {!loading && !festivalLoading && error && <PageError onRetry={reload} />}

        {!loading && !festivalLoading && !error && (
          <Reveal as="div" className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="icon-badge"><Users size={18} /></div>
            <div>
              <AnimatedCount value={totalGuests} />
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>total guests across {items.length} RSVPs</div>
            </div>
          </Reveal>
        )}

        {!loading && !festivalLoading && !error && items.length === 0 && (
          <div className="card empty-state">No RSVPs yet.</div>
        )}
        {!loading && !festivalLoading && !error && items.map((r, i) => (
          <Reveal key={r.id} delay={Math.min(i, 10) * 25} as="div" className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{r.name}</div>
              <div className="meta">
                {r.guests} {r.guests === 1 ? 'guest' : 'guests'}
                {r.phone && <> · <Phone size={11} style={{ verticalAlign: -1 }} /> {r.phone}</>}
              </div>
            </div>
            <button className="icon-btn" onClick={() => setToDelete(r)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
          </Reveal>
        ))}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        message={`Remove ${toDelete?.name}'s RSVP?`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
