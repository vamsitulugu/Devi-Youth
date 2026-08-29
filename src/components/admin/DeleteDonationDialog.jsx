import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Field, Input, Textarea } from './FormField';
import { useLanguage } from '../../i18n/LanguageContext';

// Deleting a donor's donation history always requires a reason and the
// name of whoever is removing it (see supabase/07_donation_deletion.sql —
// both fields are enforced again at the database level, this is just the
// friendly front-end validation). The record isn't gone after this: it
// moves to the Deleted Donations tab in Money.
export default function DeleteDonationDialog({ open, donation, defaultDeletedBy, onConfirm, onCancel }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [deletedBy, setDeletedBy] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setDeletedBy(defaultDeletedBy || '');
      setErrors({});
      setSubmitting(false);
      // Let the dialog paint before focusing so mobile keyboards don't jump early.
      setTimeout(() => reasonRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!reason.trim()) nextErrors.reason = t('admin_delete_reason_required');
    if (!deletedBy.trim()) nextErrors.deletedBy = t('admin_delete_by_required');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onConfirm(reason.trim(), deletedBy.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lightbox" style={{ background: 'rgba(20,10,5,0.55)' }} onClick={onCancel}>
      <form
        className="card card-pad"
        style={{ width: 'min(92vw, 420px)', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <AlertTriangle color="var(--color-danger)" size={26} />
          <button type="button" onClick={onCancel} aria-label={t('admin_delete_cancel')}><X size={18} /></button>
        </div>
        <div style={{ fontWeight: 700, fontSize: 'var(--fs-md)', margin: '4px 0 2px' }}>
          {t('admin_delete_donation_title')}
        </div>
        {donation && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)', marginBottom: 6 }}>
            {donation.donor_name} — ₹{Number(donation.amount || 0).toLocaleString('en-IN')}
          </div>
        )}
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginBottom: 16 }}>
          {t('admin_delete_donation_warning')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label={t('admin_delete_reason_label')} required error={errors.reason}>
            <Textarea
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin_delete_reason_placeholder')}
              maxLength={500}
            />
          </Field>
          <Field label={t('admin_delete_by_label')} required error={errors.deletedBy}>
            <Input
              value={deletedBy}
              onChange={(e) => setDeletedBy(e.target.value)}
              placeholder={t('admin_delete_by_placeholder')}
              maxLength={120}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" className="btn btn-outline btn-block" onClick={onCancel} disabled={submitting}>
            {t('admin_delete_cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-block"
            style={{ background: 'var(--color-danger)', color: '#fff' }}
            disabled={submitting}
          >
            {submitting ? t('admin_delete_deleting') : t('admin_delete_confirm')}
          </button>
        </div>
      </form>
    </div>
  );
}
