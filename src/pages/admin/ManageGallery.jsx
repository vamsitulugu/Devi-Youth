import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, X, ArrowLeft, Upload, ImageIcon, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import {
  albumsApi,
  listAlbumsWithCounts,
  listPhotos,
  deletePhoto,
  createAlbumWithPhotos,
  uploadPhotosToAlbum,
  isAcceptedImage,
  publicUrl,
} from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import PhotoViewer from '../../components/PhotoViewer';
import { detectLanguage } from '../../lib/language';

let _fileKey = 0;

function toStagedFile(file) {
  return { key: `f${++_fileKey}`, file, preview: URL.createObjectURL(file), status: 'pending' };
}

// Shared drag/drop + click-to-upload photo picker with live previews and
// per-file remove/status. Used both for the New Album flow and for
// adding more photos to an existing album.
function PhotoDropzone({ staged, setStaged, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    const accepted = files.filter(isAcceptedImage);
    const rejected = files.length - accepted.length;
    if (accepted.length) setStaged((prev) => [...prev, ...accepted.map(toStagedFile)]);
    return rejected;
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  }

  function removeStaged(key) {
    setStaged((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((s) => s.key !== key);
    });
  }

  return (
    <>
      <div
        className={`photo-dropzone${dragActive ? ' drag-active' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        <Upload size={26} strokeWidth={1.5} />
        {staged.length > 0
          ? <strong>{staged.length} photo{staged.length === 1 ? '' : 's'} selected — click or drop to add more</strong>
          : <span>Drag &amp; drop photos here or click to upload<br />JPG, JPEG, PNG or WebP</span>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {staged.length > 0 && (
        <div className="photo-preview-grid">
          {staged.map((s) => (
            <div key={s.key} className="photo-preview-item">
              <img src={s.preview} alt="" />
              {s.status === 'pending' && !disabled && (
                <button type="button" className="remove-btn" onClick={() => removeStaged(s.key)} aria-label="Remove photo">
                  <X size={13} />
                </button>
              )}
              {s.status === 'uploading' && <div className="upload-status">…</div>}
              {s.status === 'done' && <div className="upload-status"><CheckCircle2 size={18} /></div>}
              {s.status === 'failed' && <div className="upload-status failed"><XCircle size={18} /></div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const blankAlbum = { name_en: '' };

export default function ManageGallery() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankAlbum);
  const [staged, setStaged] = useState([]);
  const [saving, setSaving] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);

  const [openAlbum, setOpenAlbum] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setAlbums([]); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      setAlbums(await listAlbumsWithCounts(festivalId));
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

  function closeForm() {
    staged.forEach((s) => URL.revokeObjectURL(s.preview));
    setStaged([]);
    setForm(blankAlbum);
    setAdding(false);
  }

  const canSubmit = form.name_en.trim().length > 0 && staged.length > 0 && !saving;

  async function handleCreateAlbum(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const files = staged.map((s) => s.file);
      const typed = form.name_en.trim();
      const detected = detectLanguage(typed) || 'en';
      const { uploaded, failed } = await createAlbumWithPhotos(
        {
          name_en: detected === 'en' ? typed : '',
          name_te: detected === 'te' ? typed : '',
          name_source_lang: detected,
          festival_id: festivalId,
          sort_order: albums.length,
        },
        festival.year,
        files,
        ({ index }) => {
          setStaged((prev) => prev.map((s, i) => (i < index ? { ...s, status: 'done' } : s)));
        }
      );
      setStaged((prev) => prev.map((s) => {
        const failedEntry = failed.find((f) => f.file === s.file);
        return { ...s, status: failedEntry ? 'failed' : 'done' };
      }));
      if (failed.length === 0) {
        toast(`Album created with ${uploaded.length} photo${uploaded.length === 1 ? '' : 's'}`);
        closeForm();
      } else if (uploaded.length > 0) {
        toast(`Album created — ${uploaded.length} uploaded, ${failed.length} failed`, 'error');
      } else {
        toast(`Album created, but all ${failed.length} photo upload(s) failed. You can retry from inside the album.`, 'error');
      }
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

  if (openAlbum) {
    return (
      <AlbumDetail
        album={openAlbum}
        festivalYear={festival?.year}
        onBack={() => { setOpenAlbum(null); reload(); }}
        toast={toast}
      />
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
          <form className="card card-pad" onSubmit={handleCreateAlbum}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>New Album</strong>
                <button type="button" onClick={closeForm} aria-label="Close" disabled={saving}><X size={18} /></button>
              </div>
              <Field label="Album Name">
                <Input
                  required
                  placeholder="Pooja, Procession, Immersion…"
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  disabled={saving}
                />
                {form.name_en && (
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
                    Detected language: {detectLanguage(form.name_en) === 'te' ? 'Telugu' : 'English'} — the other version is generated automatically.
                  </span>
                )}
              </Field>
              <Field label="Photos">
                <PhotoDropzone staged={staged} setStaged={setStaged} disabled={saving} />
              </Field>
              <button className="btn btn-primary btn-block" disabled={!canSubmit}>
                {saving ? 'Creating & uploading…' : 'Create Album & Upload Photos'}
              </button>
            </FormGrid>
          </form>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}
        {!loading && !error && albums.length === 0 && !adding && (
          <div className="card empty-state">No albums yet.</div>
        )}
        {!loading && !error && albums.length > 0 && (
          <div className="album-grid">
            {albums.map((a) => (
              <div key={a.id} className="card album-card" style={{ position: 'relative' }}>
                <button style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setOpenAlbum(a)}>
                  <div className="album-cover">
                    {a.cover_photo_url ? (
                      <img src={publicUrl(a.cover_photo_url)} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <div className="album-cover-empty"><ImageIcon size={28} strokeWidth={1.5} /></div>
                    )}
                    {a.photo_count > 0 && <span className="album-cover-badge">{a.photo_count} photo{a.photo_count === 1 ? '' : 's'}</span>}
                  </div>
                  <div className="album-info">
                    <span className="album-name">{a.name_en || a.name_te}</span>
                    <ChevronRight size={18} className="album-chevron" />
                  </div>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setAlbumToDelete(a)}
                  aria-label="Delete album"
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', borderRadius: '50%' }}
                >
                  <Trash2 size={15} color="var(--color-danger)" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!albumToDelete}
        message={`Delete album "${albumToDelete?.name_en || albumToDelete?.name_te}" and all its photos?`}
        onConfirm={handleDeleteAlbum}
        onCancel={() => setAlbumToDelete(null)}
      />
    </>
  );
}

function AlbumDetail({ album, festivalYear, onBack, toast }) {
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);

  const [addingPhotos, setAddingPhotos] = useState(false);
  const [staged, setStaged] = useState([]);
  const [uploading, setUploading] = useState(false);

  async function reloadPhotos() {
    setPhotosLoading(true);
    try {
      setPhotos(await listPhotos(album.id));
      setPhotosError(null);
    } catch (err) {
      setPhotosError(err);
    } finally {
      setPhotosLoading(false);
    }
  }

  useEffect(() => {
    reloadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id]);

  const viewerPhotos = useMemo(
    () => photos.map((p) => ({ id: p.id, src: publicUrl(p.storage_path) })),
    [photos]
  );

  function closeAddPhotos() {
    staged.forEach((s) => URL.revokeObjectURL(s.preview));
    setStaged([]);
    setAddingPhotos(false);
  }

  async function handleUploadMore() {
    if (!staged.length || uploading) return;
    setUploading(true);
    try {
      const files = staged.map((s) => s.file);
      const { uploaded, failed } = await uploadPhotosToAlbum(album, festivalYear, files, ({ index }) => {
        setStaged((prev) => prev.map((s, i) => (i < index ? { ...s, status: 'done' } : s)));
      });
      setStaged((prev) => prev.map((s) => {
        const failedEntry = failed.find((f) => f.file === s.file);
        return { ...s, status: failedEntry ? 'failed' : 'done' };
      }));
      if (failed.length === 0) {
        toast(`${uploaded.length} photo(s) uploaded`);
        closeAddPhotos();
      } else if (uploaded.length > 0) {
        toast(`${uploaded.length} uploaded, ${failed.length} failed — you can retry the failed ones`, 'error');
      } else {
        toast(`All ${failed.length} upload(s) failed. Check your connection and try again.`, 'error');
      }
      await reloadPhotos();
    } finally {
      setUploading(false);
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

  return (
    <>
      <AdminHeader title={album.name_en || album.name_te} showBack />
      <div className="page">
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontWeight: 600, color: 'var(--color-vermillion)' }}
        >
          <ArrowLeft size={16} /> All Albums
        </button>

        {!addingPhotos && (
          <button className="btn btn-primary btn-block" onClick={() => setAddingPhotos(true)}>
            <Upload size={16} /> Add Photos
          </button>
        )}

        {addingPhotos && (
          <div className="card card-pad">
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Add Photos</strong>
                <button type="button" onClick={closeAddPhotos} aria-label="Close" disabled={uploading}><X size={18} /></button>
              </div>
              <PhotoDropzone staged={staged} setStaged={setStaged} disabled={uploading} />
              <button className="btn btn-primary btn-block" onClick={handleUploadMore} disabled={!staged.length || uploading}>
                {uploading ? 'Uploading…' : `Upload ${staged.length || ''} Photo${staged.length === 1 ? '' : 's'}`}
              </button>
            </FormGrid>
          </div>
        )}

        {photosLoading && <PageSkeleton rows={2} />}
        {!photosLoading && photosError && <PageError />}
        {!photosLoading && !photosError && photos.length === 0 && (
          <div className="card empty-state">No photos in this album yet.</div>
        )}
        {!photosLoading && !photosError && photos.length > 0 && (
          <div className="gallery-grid">
            {photos.map((p, i) => (
              <div key={p.id} style={{ position: 'relative' }}>
                <img
                  src={publicUrl(p.storage_path)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onClick={() => setViewerIndex(i)}
                  style={{ width: '100%', aspectRatio: 1, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                />
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

      {viewerIndex !== null && (
        <PhotoViewer
          photos={viewerPhotos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      <ConfirmDialog
        open={!!photoToDelete}
        message="Delete this photo? This can't be undone."
        onConfirm={handleDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />
    </>
  );
}
