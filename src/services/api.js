// Single data-access layer for the whole app.
//
// Every function returns data shaped exactly like src/data/sampleData.js
// (bilingual fields as { en, te } objects) so page components never need
// to know whether they're looking at Supabase rows or sample data.
//
// IMPORTANT: sample data is ONLY used when Supabase isn't configured at
// all (local dev with no .env — see src/lib/supabaseClient.js). Once
// Supabase is configured, this file never silently substitutes fake
// content for real gaps or errors — visitors would otherwise see
// realistic-looking fabricated announcements/events with no way to tell
// they aren't real. Instead:
//   - no active festival configured  -> real empty/placeholder results
//   - a genuine Supabase query error -> thrown, so the page's existing
//     error state (see PageError in components/LoadingStates) shows up
//     instead of quietly rendering sample content.

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import * as sample from '../data/sampleData';

// ---------- storage helpers ----------
export function publicImageUrl(path) {
  if (!path) return null;
  if (!isSupabaseConfigured) return null;
  const { data } = supabase.storage.from('gallery').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function throwIfError(error) {
  if (error) throw new Error(error.message || 'Something went wrong while loading data.');
}

// A festival with id === null means "no active festival configured yet"
// (as opposed to Supabase not being configured, or a genuine fetch error).
const EMPTY_FESTIVAL = {
  id: null,
  year: null,
  name: { en: '', te: '' },
  village: { en: '', te: '' },
  dates: { en: '', te: '' },
  publicDonationTotal: null,
};

// ---------- active festival (cached per session) ----------
let _festivalCache = null;

async function getActiveFestival() {
  if (!isSupabaseConfigured) {
    return {
      id: null,
      year: sample.festival.year,
      name: sample.festival.name,
      village: sample.festival.village,
      dates: sample.festival.dates,
      publicDonationTotal: sample.festival.publicDonationTotal,
    };
  }
  if (_festivalCache) return _festivalCache;

  const { data, error } = await supabase
    .from('festivals')
    .select('*')
    .eq('is_active', true)
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(error);
  if (!data) {
    // No active festival has been set up yet in Admin > Settings.
    // This is a real, expected state — not an error — so we return an
    // honest empty placeholder rather than fabricated sample content.
    return EMPTY_FESTIVAL;
  }

  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  _festivalCache = {
    id: data.id,
    year: data.year,
    name: { en: data.name_en, te: data.name_te },
    village: { en: data.village_en, te: data.village_te },
    dates: { en: `${fmt(start)} – ${fmt(end)} ${data.year}`, te: `${fmt(start)} – ${fmt(end)}, ${data.year}` },
    publicDonationTotal: data.public_donation_total,
  };
  return _festivalCache;
}

export async function getFestival() {
  return getActiveFestival();
}

// ---------- announcements ----------
export async function getAnnouncements() {
  if (!isSupabaseConfigured) return sample.announcements;
  const festival = await getActiveFestival();
  if (!festival.id) return [];
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('festival_id', festival.id)
    .order('published_at', { ascending: false });
  throwIfError(error);
  return (data || []).map((a) => ({
    id: a.id,
    important: a.important,
    date: a.published_at?.slice(0, 10),
    title: { en: a.title_en, te: a.title_te },
    body: { en: a.body_en, te: a.body_te },
    image: publicImageUrl(a.image_url),
  }));
}

// ---------- events ----------
export async function getEvents() {
  if (!isSupabaseConfigured) return sample.events;
  const festival = await getActiveFestival();
  if (!festival.id) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('festival_id', festival.id)
    .order('event_date', { ascending: true })
    .order('sort_order', { ascending: true });
  throwIfError(error);
  return (data || []).map((e) => ({
    id: e.id,
    date: e.event_date,
    time: e.event_time,
    title: { en: e.title_en, te: e.title_te },
    location: { en: e.location_en, te: e.location_te },
    description: { en: e.description_en, te: e.description_te },
  }));
}

// ---------- committee ----------
export async function getCommittee() {
  if (!isSupabaseConfigured) return sample.committee;
  const festival = await getActiveFestival();
  if (!festival.id) return [];
  const { data, error } = await supabase
    .from('committee_members')
    .select('*')
    .eq('festival_id', festival.id)
    .order('sort_order', { ascending: true });
  throwIfError(error);
  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    position: { en: m.position_en, te: m.position_te },
    phone: m.phone,
    photo: publicImageUrl(m.photo_url),
  }));
}

// ---------- laddu velam ----------
// Returns null when there's nothing to show yet (no active festival, or
// the committee hasn't entered this year's auction details) — callers
// must handle a null result (see Home.jsx / Laddu.jsx).
export async function getLaddu() {
  if (!isSupabaseConfigured) return sample.laddu;
  const festival = await getActiveFestival();
  if (!festival.id) return null;

  const [{ data: current, error: currentError }, { data: history, error: historyError }] = await Promise.all([
    supabase.from('laddu_auctions').select('*').eq('festival_id', festival.id).maybeSingle(),
    supabase
      .from('laddu_auctions')
      .select('*, festivals!inner(year)')
      .neq('festival_id', festival.id)
      .order('festivals(year)', { ascending: false }),
  ]);
  throwIfError(currentError);
  throwIfError(historyError);

  if (!current) return null;

  return {
    current: {
      year: festival.year,
      title: { en: current.title_en, te: current.title_te },
      image: publicImageUrl(current.image_url),
      startingPrice: current.starting_price,
      finalPrice: current.final_price,
      winner: current.winner_name,
      date: current.auction_date,
      time: current.auction_time,
      location: { en: current.location_en, te: current.location_te },
    },
    history: (history || []).map((h) => ({ year: h.festivals.year, finalPrice: h.final_price, winner: h.winner_name })),
  };
}

// ---------- lottery ----------
// Returns null when there's nothing to show yet — callers must handle a
// null result (see Home.jsx / Lottery.jsx).
export async function getLottery() {
  if (!isSupabaseConfigured) return sample.lottery;
  const festival = await getActiveFestival();
  if (!festival.id) return null;

  const { data: lotteryRow, error: lotteryError } = await supabase
    .from('lottery')
    .select('*')
    .eq('festival_id', festival.id)
    .maybeSingle();
  throwIfError(lotteryError);
  if (!lotteryRow) return null;

  const [
    { data: prizes, error: prizesError },
    { data: winners, error: winnersError },
    { data: historyRows, error: historyError },
  ] = await Promise.all([
    supabase.from('lottery_prizes').select('*').eq('lottery_id', lotteryRow.id).order('sort_order'),
    supabase.from('lottery_winners').select('*, lottery_prizes(name_en)').eq('lottery_id', lotteryRow.id),
    supabase
      .from('lottery')
      .select('*, festivals!inner(year), lottery_prizes(name_en, name_te), lottery_winners(winner_name)')
      .neq('festival_id', festival.id)
      .order('festivals(year)', { ascending: false }),
  ]);
  throwIfError(prizesError);
  throwIfError(winnersError);
  throwIfError(historyError);

  return {
    drawDate: lotteryRow.draw_date,
    drawTime: lotteryRow.draw_time,
    location: { en: lotteryRow.location_en, te: lotteryRow.location_te },
    prizes: (prizes || []).map((p) => ({
      id: p.id,
      name: { en: p.name_en, te: p.name_te },
      value: p.value,
      image: publicImageUrl(p.image_url),
    })),
    winners: (winners || []).map((w) => ({ name: w.winner_name, prize: w.lottery_prizes?.name_en })),
    history: (historyRows || []).map((h) => ({
      year: h.festivals.year,
      topPrize: { en: h.lottery_prizes?.[0]?.name_en, te: h.lottery_prizes?.[0]?.name_te },
      winner: h.lottery_winners?.[0]?.winner_name,
    })),
  };
}

// ---------- gallery ----------
export async function getGalleryYears() {
  if (!isSupabaseConfigured) return sample.galleryYears;
  const { data, error } = await supabase.from('festivals').select('year').order('year', { ascending: false });
  throwIfError(error);
  return (data || []).map((f) => f.year);
}

export async function getGalleryAlbums(year) {
  if (!isSupabaseConfigured) return sample.galleryPhotos[year] || [];
  const { data: festivalRow, error: festivalError } = await supabase.from('festivals').select('id').eq('year', year).maybeSingle();
  throwIfError(festivalError);
  if (!festivalRow) return [];
  const { data: albums, error } = await supabase
    .from('photo_albums')
    .select('*, photos(count)')
    .eq('festival_id', festivalRow.id)
    .order('sort_order');
  throwIfError(error);
  return (albums || []).map((a) => ({
    id: a.id,
    // Album names are English-only; { en, te } is kept so pages that key
    // off lang[album] (e.g. captions) keep working without special-casing.
    album: { en: a.name_en, te: a.name_en },
    cover: publicImageUrl(a.cover_photo_url),
    count: a.photos?.[0]?.count ?? 0,
  }));
}

// All photos in one album, newest first — used by the album viewer.
export async function getAlbumPhotos(albumId) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data || []).map((p) => ({ id: p.id, src: publicImageUrl(p.storage_path) }));
}

// Most recently uploaded photos across every album for the active
// festival — used for the "Latest Photos" preview on Home. Real data
// only: if nothing has been uploaded yet, this returns an empty array
// and the caller should hide the section rather than fake placeholders.
export async function getLatestPhotos(limit = 6) {
  if (!isSupabaseConfigured) return [];
  const festival = await getActiveFestival();
  if (!festival.id) return [];
  const { data: albums, error: albumsError } = await supabase
    .from('photo_albums')
    .select('id')
    .eq('festival_id', festival.id);
  throwIfError(albumsError);
  const albumIds = (albums || []).map((a) => a.id);
  if (!albumIds.length) return [];
  const { data, error } = await supabase
    .from('photos')
    .select('id, storage_path')
    .in('album_id', albumIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  throwIfError(error);
  return (data || []).map((p) => ({ id: p.id, src: publicImageUrl(p.storage_path) }));
}

// ---------- history ----------
export async function getHistory() {
  if (!isSupabaseConfigured) return sample.history;
  const { data, error } = await supabase
    .from('festivals')
    .select('year, public_donation_total')
    .order('year', { ascending: false });
  throwIfError(error);
  return (data || []).map((f) => ({
    year: f.year,
    highlight: { en: f.public_donation_total ? `Total donations: ${f.public_donation_total}` : '', te: '' },
  }));
}

// ---------- contacts ----------
export async function getContacts() {
  if (!isSupabaseConfigured) return sample.contacts;
  const { data, error } = await supabase.from('contacts').select('*').order('sort_order');
  throwIfError(error);
  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    role: { en: c.role_en, te: c.role_te },
    phone: c.phone,
  }));
}