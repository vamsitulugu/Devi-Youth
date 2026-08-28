import { useEffect, useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import { Field, Input, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { getLadduForFestival, upsertLaddu, uploadImage, publicUrl } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const blank = {
  title_en: 'Laddu Velam', title_te: '', title_source_lang: 'en', starting_price: '', final_price: '',
  winner_name: '', auction_date: '', auction_time: '', location_en: '', location_te: '', location_source_lang: null, image_url: '',
};

export default function ManageLaddu() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setForm(blank); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      const row = await getLadduForFestival(festivalId);
      setForm(row ? {
        title_en: row.title_en, title_te: row.title_te, title_source_lang: row.title_source_lang,
        starting_price: row.starting_price || '', final_price: row.final_price || '',
        winner_name: row.winner_name || '', auction_date: row.auction_date || '',
        auction_time: row.auction_time || '', location_en: row.location_en || '',
        location_te: row.location_te || '', location_source_lang: row.location_source_lang, image_url: row.image_url || '',
      } : blank);
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

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (file) {
        const path = `laddu/${festival.year}-${Date.now()}-${file.name}`;
        image_url = await uploadImage(file, path);
      }
      await upsertLaddu({ ...form, image_url, festival_id: festivalId });
      toast('Laddu Velam saved');
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHeader title="Laddu Velam" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}

        {!loading && !error && festivalId && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              {form.image_url && (
                <img src={publicUrl(form.image_url)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              )}
              <BilingualField label="Title" baseName="title" form={form} setForm={setForm} required />
              <Field label="Photo">
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Field>
              <Field label="Starting Price">
                <Input placeholder="₹5,000" value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} />
              </Field>
              <Field label="Final Price" hint="Leave blank until the offline auction has happened">
                <Input placeholder="₹21,000" value={form.final_price} onChange={(e) => setForm({ ...form, final_price: e.target.value })} />
              </Field>
              <Field label="Winner Name">
                <Input value={form.winner_name} onChange={(e) => setForm({ ...form, winner_name: e.target.value })} />
              </Field>
              <div style={{ display: 'flex', gap: 10 }}>
                <Field label="Auction Date">
                  <Input type="date" value={form.auction_date} onChange={(e) => setForm({ ...form, auction_date: e.target.value })} />
                </Field>
                <Field label="Time">
                  <Input placeholder="7:00 PM" value={form.auction_time} onChange={(e) => setForm({ ...form, auction_time: e.target.value })} />
                </Field>
              </div>
              <BilingualField label="Location" baseName="location" form={form} setForm={setForm} />
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </FormGrid>
          </form>
        )}
      </div>
    </>
  );
}
