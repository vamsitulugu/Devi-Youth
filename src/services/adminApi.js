// Admin/committee data-access layer. Unlike src/services/api.js this never
// falls back to sample data — the admin area requires a live Supabase
// connection, and RLS (see supabase/02_policies.sql) is the real gate on
// who can read or write what. Callers still see a clean rejection if
// Supabase isn't configured, via `assertReady()`.

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

function assertReady() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
}

function up(err) {
  if (err) throw new Error(err.message || 'Something went wrong.');
}

// ---------- festivals ----------
export async function listFestivals() {
  assertReady();
  const { data, error } = await supabase.from('festivals').select('*').order('year', { ascending: false });
  up(error);
  return data || [];
}

export async function getActiveFestival() {
  assertReady();
  const { data, error } = await supabase.from('festivals').select('*').eq('is_active', true).maybeSingle();
  up(error);
  return data;
}

export async function upsertFestival(payload) {
  assertReady();
  const { id, ...rest } = payload;
  const { data, error } = id
    ? await supabase.from('festivals').update(rest).eq('id', id).select().single()
    : await supabase.from('festivals').insert(rest).select().single();
  up(error);
  return data;
}

export async function setActiveFestival(id) {
  assertReady();
  up((await supabase.from('festivals').update({ is_active: false }).neq('id', id)).error);
  const { data, error } = await supabase.from('festivals').update({ is_active: true }).eq('id', id).select().single();
  up(error);
  return data;
}

export async function deleteFestival(id) {
  assertReady();
  up((await supabase.from('festivals').delete().eq('id', id)).error);
}

// ---------- generic year-scoped CRUD ----------
function crud(table) {
  return {
    async list(festivalId, orderBy = 'sort_order') {
      assertReady();
      let q = supabase.from(table).select('*').eq('festival_id', festivalId);
      q = orderBy ? q.order(orderBy, { ascending: true }) : q;
      const { data, error } = await q;
      up(error);
      return data || [];
    },
    async add(payload) {
      assertReady();
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      up(error);
      return data;
    },
    async update(id, payload) {
      assertReady();
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      up(error);
      return data;
    },
    async remove(id) {
      assertReady();
      up((await supabase.from(table).delete().eq('id', id)).error);
    },
  };
}

export const announcementsApi = crud('announcements');
export const eventsApi = crud('events');
export const committeeApi = crud('committee_members');
export const albumsApi = crud('photo_albums');
export const donationsApi = crud('donations');
export const expensesApi = crud('expenses');

// overrides needing custom ordering
announcementsApi.list = async (festivalId) => {
  assertReady();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('festival_id', festivalId)
    .order('published_at', { ascending: false });
  up(error);
  return data || [];
};
eventsApi.list = async (festivalId) => {
  assertReady();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('festival_id', festivalId)
    .order('event_date', { ascending: true });
  up(error);
  return data || [];
};
donationsApi.list = async (festivalId) => {
  assertReady();
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('festival_id', festivalId)
    .order('donation_date', { ascending: false });
  up(error);
  return data || [];
};
expensesApi.list = async (festivalId) => {
  assertReady();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('festival_id', festivalId)
    .order('expense_date', { ascending: false });
  up(error);
  return data || [];
};

export async function getDonorHistory(donorName) {
  assertReady();
  const { data, error } = await supabase
    .from('donations')
    .select('*, festivals(year)')
    .eq('donor_name', donorName)
    .order('donation_date', { ascending: false });
  up(error);
  return data || [];
}

// Deleting a donation always requires a reason and the name of whoever is
// removing it — see supabase/07_donation_deletion.sql. This calls a
// SECURITY DEFINER function that atomically archives the row into
// deleted_donations (visible on the Deleted Donations tab) and removes it
// from the live donations list, rather than a plain table delete.
export async function deleteDonationWithReason(donationId, reason, deletedByName) {
  assertReady();
  const { error } = await supabase.rpc('delete_donation_with_reason', {
    p_donation_id: donationId,
    p_reason: reason,
    p_deleted_by_name: deletedByName,
  });
  up(error);
}

export async function getDeletedDonations(festivalId) {
  assertReady();
  const { data, error } = await supabase
    .from('deleted_donations')
    .select('*')
    .eq('festival_id', festivalId)
    .order('deleted_at', { ascending: false });
  up(error);
  return data || [];
}

// ---------- contacts (not year-scoped) ----------
export const contactsApi = {
  async list() {
    assertReady();
    const { data, error } = await supabase.from('contacts').select('*').order('sort_order');
    up(error);
    return data || [];
  },
  async add(payload) {
    assertReady();
    const { data, error } = await supabase.from('contacts').insert(payload).select().single();
    up(error);
    return data;
  },
  async update(id, payload) {
    assertReady();
    const { data, error } = await supabase.from('contacts').update(payload).eq('id', id).select().single();
    up(error);
    return data;
  },
  async remove(id) {
    assertReady();
    up((await supabase.from('contacts').delete().eq('id', id)).error);
  },
};

// ---------- laddu (one row per festival) ----------
export async function getLadduForFestival(festivalId) {
  assertReady();
  const { data, error } = await supabase.from('laddu_auctions').select('*').eq('festival_id', festivalId).maybeSingle();
  up(error);
  return data;
}

export async function upsertLaddu(payload) {
  assertReady();
  const { data, error } = await supabase
    .from('laddu_auctions')
    .upsert(payload, { onConflict: 'festival_id' })
    .select()
    .single();
  up(error);
  return data;
}

// ---------- lottery ----------
export async function getLotteryForFestival(festivalId) {
  assertReady();
  const { data, error } = await supabase.from('lottery').select('*').eq('festival_id', festivalId).maybeSingle();
  up(error);
  return data;
}

export async function upsertLottery(payload) {
  assertReady();
  const { data, error } = await supabase.from('lottery').upsert(payload, { onConflict: 'festival_id' }).select().single();
  up(error);
  return data;
}

export const lotteryPrizesApi = {
  async list(lotteryId) {
    assertReady();
    const { data, error } = await supabase.from('lottery_prizes').select('*').eq('lottery_id', lotteryId).order('sort_order');
    up(error);
    return data || [];
  },
  async add(payload) {
    assertReady();
    const { data, error } = await supabase.from('lottery_prizes').insert(payload).select().single();
    up(error);
    return data;
  },
  async update(id, payload) {
    assertReady();
    const { data, error } = await supabase.from('lottery_prizes').update(payload).eq('id', id).select().single();
    up(error);
    return data;
  },
  async remove(id) {
    assertReady();
    up((await supabase.from('lottery_prizes').delete().eq('id', id)).error);
  },
};

export const lotteryWinnersApi = {
  async list(lotteryId) {
    assertReady();
    const { data, error } = await supabase
      .from('lottery_winners')
      .select('*, lottery_prizes(name_en, name_te)')
      .eq('lottery_id', lotteryId);
    up(error);
    return data || [];
  },
  async add(payload) {
    assertReady();
    const { data, error } = await supabase.from('lottery_winners').insert(payload).select().single();
    up(error);
    return data;
  },
  async remove(id) {
    assertReady();
    up((await supabase.from('lottery_winners').delete().eq('id', id)).error);
  },
};

// ---------- albums (with photo counts, for the album-card list) ----------
export async function listAlbumsWithCounts(festivalId) {
  assertReady();
  const { data, error } = await supabase
    .from('photo_albums')
    .select('*, photos(count)')
    .eq('festival_id', festivalId)
    .order('sort_order', { ascending: true });
  up(error);
  return (data || []).map((a) => ({ ...a, photo_count: a.photos?.[0]?.count ?? 0 }));
}

// ---------- photos ----------
export async function listPhotos(albumId) {
  assertReady();
  const { data, error } = await supabase.from('photos').select('*').eq('album_id', albumId).order('created_at', { ascending: false });
  up(error);
  return data || [];
}

export async function addPhotoRecord(payload) {
  assertReady();
  const { data, error } = await supabase.from('photos').insert(payload).select().single();
  up(error);
  return data;
}

export async function deletePhoto(photo) {
  assertReady();
  await supabase.storage.from('gallery').remove([photo.storage_path]);
  up((await supabase.from('photos').delete().eq('id', photo.id)).error);
}

// ---------- storage upload ----------
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function isAcceptedImage(file) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name || '');
}

export async function uploadImage(file, path) {
  assertReady();
  const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true, cacheControl: '3600' });
  up(error);
  return path;
}

export function publicUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from('gallery').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function slugify(name) {
  return (name || 'album').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'album';
}

// Uploads a batch of photo files into `album` (storage + `photos` row for
// each), reporting progress as it goes. Never throws for individual file
// failures — those are collected and returned so the caller can show a
// clear "N uploaded, M failed" message instead of silently pretending
// everything succeeded. Returns { uploaded: [...photoRows], failed: [{file, error}] }.
export async function uploadPhotosToAlbum(album, festivalYear, files, onProgress) {
  assertReady();
  const uploaded = [];
  const failed = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({ index: i, total: files.length, file });
    try {
      if (!isAcceptedImage(file)) throw new Error(`${file.name}: unsupported file type`);
      const path = `${festivalYear}/${slugify(album.name_en || album.name_te)}/${Date.now()}-${i}-${file.name}`;
      await uploadImage(file, path);
      const row = await addPhotoRecord({ album_id: album.id, storage_path: path });
      uploaded.push(row);
    } catch (err) {
      failed.push({ file, error: err.message || 'Upload failed' });
    }
  }
  onProgress?.({ index: files.length, total: files.length, done: true });
  return { uploaded, failed };
}

// Creates an album and uploads its first batch of photos in one flow, so
// the admin never has to create an empty album and open a separate
// upload screen. Sets the first successfully-uploaded photo as the
// album's cover. Throws only if the album row itself can't be created;
// individual photo failures are reported back via `failed`.
export async function createAlbumWithPhotos({ name_en, name_te, name_source_lang, festival_id, sort_order }, festivalYear, files, onProgress) {
  assertReady();
  const album = await albumsApi.add({ name_en, name_te, name_source_lang, festival_id, sort_order });
  const { uploaded, failed } = await uploadPhotosToAlbum(album, festivalYear, files, onProgress);
  if (uploaded[0]) {
    try {
      await albumsApi.update(album.id, { cover_photo_url: uploaded[0].storage_path });
      album.cover_photo_url = uploaded[0].storage_path;
    } catch {
      // Cover is cosmetic — don't fail the whole creation over it.
    }
  }
  return { album, uploaded, failed };
}

// ---------- profiles / users ----------
export async function listProfiles() {
  assertReady();
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  up(error);
  return data || [];
}

export async function updateProfileRole(id, role) {
  assertReady();
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
  up(error);
  return data;
}

// ---------- dashboard ----------
export async function getDashboardStats(festivalId) {
  assertReady();
  const [donations, expenses, events, announcements] = await Promise.all([
    supabase.from('donations').select('amount').eq('festival_id', festivalId),
    supabase.from('expenses').select('amount').eq('festival_id', festivalId),
    supabase.from('events').select('id, event_date').eq('festival_id', festivalId),
    supabase.from('announcements').select('id').eq('festival_id', festivalId),
  ]);
  up(donations.error);
  up(expenses.error);
  up(events.error);
  up(announcements.error);

  const totalDonations = (donations.data || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalExpenses = (expenses.data || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = (events.data || []).filter((e) => e.event_date >= today).length;

  return {
    totalDonations,
    totalExpenses,
    balance: totalDonations - totalExpenses,
    donorCount: (donations.data || []).length,
    upcomingEvents,
    announcementCount: (announcements.data || []).length,
  };
}