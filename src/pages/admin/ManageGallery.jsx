import { useEffect, useState } from 'react';
import { Plus, Trash2, X, ArrowLeft, Upload } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { albumsApi, listPhotos, addPhotoRecord, deletePhoto, uploadImage, publicUrl } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const blankAlbum = { name_en: '', name_te: '' };

export default function ManageGallery() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankAlbum);
  const [saving, setSaving] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);

  const [openAlbum, setOpenAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setAlbums([]); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      setAlbums(await albumsApi.list(festivalId));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    setOpenAlbum(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId, festivalLoading]);

  async function handleAddAlbum(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await albumsApi.add({ ...form, festival_id: festivalId, sort_order: albums.length });
      toast('Album created');
      setForm(blankAlbum);
      setAdding(false);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAlbum() {
    try {
      await albumsApi.remove(albumToDelete.id);
      toast('Album deleted');
      setAlbumToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function openAlbumView(album) {
    setOpenAlbum(album);
    setPhotosLoading(true);
    try {
      setPhotos(await listPhotos(album.id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPhotosLoading(false);
    }
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !openAlbum) return;
    setUploading(true);
    try {
      for (const file of files) {
        const path = `${festival.year}/${openAlbum.name_en.toLowerCase().replace(/\s+/g, '-')}/${Date.now()}-${file.name}`;
        await uploadImage(file, path);
        await addPhotoRecord({ album_id: openAlbum.id, storage_path: path });
      }
      toast(`${files.length} photo(s) uploaded`);
      setPhotos(await listPhotos(openAlbum.id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeletePhoto() {
    try {
      await deletePhoto(photoToDelete);
      toast('Photo deleted');
      setPhotoToDelete(null);
      setPhotos((p) => p.filter((x) => x.id !== photoToDelete.id));
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (openAlbum) {
    return (
      <>
        <AdminHeader title={openAlbum.name_en} showBack />
        <div className="page">
          <button
            onClick={() => setOpenAlbum(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontWeight: 600, color: 'var(--color-vermillion)' }}
          >
            <ArrowLeft size={16} /> All Albums
          </button>

          <label className="btn btn-primary btn-block" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload Photos'}
            <input type="file" accept="image/*" multiple hidden onChange={handleUpload} disabled={uploading} />
          </label>

          {photosLoading && <PageSkeleton rows={2} />}
          {!photosLoading && photos.length === 0 && <div className="card empty-state">No photos in this album yet.</div>}
          {!photosLoading && photos.length > 0 && (
            <div className="gallery-grid">
              {photos.map((p) => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <img src={publicUrl(p.storage_path)} alt="" loading="lazy" decoding="async" style={{ width: '100%', aspectRatio: 1, objectFit: 'cover', borderRadius: 4 }} />
                  <button
                    onClick={() => setPhotoToDelete(p)}
                    aria-label="Delete photo"
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(20,10,5,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <ConfirmDialog
          open={!!photoToDelete}
          message="Delete this photo? This can't be undone."
          onConfirm={handleDeletePhoto}
          onCancel={() => setPhotoToDelete(null)}
        />
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Gallery" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {!adding && (
          <button className="btn btn-primary btn-block" onClick={() => setAdding(true)} disabled={!festivalId}>
            <Plus size={16} /> New Album
          </button>
        )}

        {adding && (
          <form className="card card-pad" onSubmit={handleAddAlbum}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>New Album</strong>
                <button type="button" onClick={() => setAdding(false)} aria-label="Close"><X size={18} /></button>
              </div>
              <Field label="Album Name (English)">
                <Input required placeholder="Pooja, Procession, Immersion…" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </Field>
              <Field label="Album Name (Telugu)">
                <Input required value={form.name_te} onChange={(e) => setForm({ ...form, name_te: e.target.value })} />
              </Field>
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? 'Creating…' : 'Create Album'}
              </button>
            </FormGrid>
          </form>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}
        {!loading && !error && albums.length === 0 && <div className="card empty-state">No albums yet for {festival?.year}.</div>}
        {!loading && !error && albums.map((a) => (
          <div key={a.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {a.cover_photo_url && <img src={publicUrl(a.cover_photo_url)} alt="" className="thumb" loading="lazy" decoding="async" />}
            <button style={{ flex: 1, textAlign: 'left' }} onClick={() => openAlbumView(a)}>
              <div className="title">{a.name_en}</div>
            </button>
            <button className="icon-btn" onClick={() => setAlbumToDelete(a)} aria-label="Delete album"><Trash2 size={16} color="var(--color-danger)" /></button>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!albumToDelete}
        message={`Delete album "${albumToDelete?.name_en}" and all its photos?`}
        onConfirm={handleDeleteAlbum}
        onCancel={() => setAlbumToDelete(null)}
      />
    </>
  );
}
