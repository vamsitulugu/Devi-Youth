// Single data-access layer for the whole app.
//
// Every function returns data shaped exactly like src/data/sampleData.js
// (bilingual fields as { en, te } objects) so page components never need
// to know whether they're looking at Supabase rows or sample data.
//
// When Supabase isn't configured (no .env), everything falls back to the
// sample data used in Phase 1 — handy for local UI work without a backend.

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import * as sample from '../data/sampleData';

// ---------- storage helpers ----------
export function publicImageUrl(path) {
  if (!path) return null;
  if (!isSupabaseConfigured) return null;
  const { data } = supabase.storage.from('gallery').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

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

  if (error || !data) {
    // Fail soft to sample data rather than breaking the page.
    return {
      id: null,
      year: sample.festival.year,
      name: sample.festival.name,
      village: sample.festival.village,
      dates: sample.festival.dates,
      publicDonationTotal: sample.festival.publicDonationTotal,
    };
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
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('festival_id', festival.id)
    .order('published_at', { ascending: false });
  if (error || !data) return sample.announcements;
  return data.map((a) => ({
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
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('festival_id', festival.id)
    .order('event_date', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error || !data) return sample.events;
  return data.map((e) => ({
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
  const { data, error } = await supabase
    .from('committee_members')
    .select('*')
    .eq('festival_id', festival.id)
    .order('sort_order', { ascending: true });
  if (error || !data) return sample.committee;
  return data.map((m) => ({
    id: m.id,
    name: m.name,
    position: { en: m.position_en, te: m.position_te },
    phone: m.phone,
    photo: publicImageUrl(m.photo_url),
  }));
}

// ---------- laddu velam ----------
export async function getLaddu() {
  if (!isSupabaseConfigured) return sample.laddu;
  const festival = await getActiveFestival();

  const [{ data: current }, { data: history }] = await Promise.all([
    supabase.from('laddu_auctions').select('*').eq('festival_id', festival.id).maybeSingle(),
    supabase
      .from('laddu_auctions')
      .select('*, festivals!inner(year)')
      .neq('festival_id', festival.id)
      .order('festivals(year)', { ascending: false }),
  ]);

  return {
    current: current
      ? {
          year: festival.year,
          title: { en: current.title_en, te: current.title_te },
          image: publicImageUrl(current.image_url),
          startingPrice: current.starting_price,
          finalPrice: current.final_price,
          winner: current.winner_name,
          date: current.auction_date,
          time: current.auction_time,
          location: { en: current.location_en, te: current.location_te },
        }
      : sample.laddu.current,
    history: history?.length
      ? history.map((h) => ({ year: h.festivals.year, finalPrice: h.final_price, winner: h.winner_name }))
      : sample.laddu.history,
  };
}

// ---------- lottery ----------
export async function getLottery() {
  if (!isSupabaseConfigured) return sample.lottery;
  const festival = await getActiveFestival();

  const { data: lotteryRow } = await supabase
    .from('lottery')
    .select('*')
    .eq('festival_id', festival.id)
    .maybeSingle();

  if (!lotteryRow) return sample.lottery;

  const [{ data: prizes }, { data: winners }, { data: historyRows }] = await Promise.all([
    supabase.from('lottery_prizes').select('*').eq('lottery_id', lotteryRow.id).order('sort_order'),
    supabase.from('lottery_winners').select('*, lottery_prizes(name_en)').eq('lottery_id', lotteryRow.id),
    supabase
      .from('lottery')
      .select('*, festivals!inner(year), lottery_prizes(name_en, name_te), lottery_winners(winner_name)')
      .neq('festival_id', festival.id)
      .order('festivals(year)', { ascending: false }),
  ]);

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
    history: historyRows?.length
      ? historyRows.map((h) => ({
          year: h.festivals.year,
          topPrize: { en: h.lottery_prizes?.[0]?.name_en, te: h.lottery_prizes?.[0]?.name_te },
          winner: h.lottery_winners?.[0]?.winner_name,
        }))
      : sample.lottery.history,
  };
}

// ---------- gallery ----------
export async function getGalleryYears() {
  if (!isSupabaseConfigured) return sample.galleryYears;
  const { data, error } = await supabase.from('festivals').select('year').order('year', { ascending: false });
  if (error || !data?.length) return sample.galleryYears;
  return data.map((f) => f.year);
}

export async function getGalleryAlbums(year) {
  if (!isSupabaseConfigured) return sample.galleryPhotos[year] || [];
  const { data: festivalRow } = await supabase.from('festivals').select('id').eq('year', year).maybeSingle();
  if (!festivalRow) return [];
  const { data: albums, error } = await supabase
    .from('photo_albums')
    .select('*')
    .eq('festival_id', festivalRow.id)
    .order('sort_order');
  if (error || !albums) return sample.galleryPhotos[year] || [];
  return albums.map((a) => ({
    id: a.id,
    album: { en: a.name_en, te: a.name_te },
    cover: publicImageUrl(a.cover_photo_url),
  }));
}

// ---------- history ----------
export async function getHistory() {
  if (!isSupabaseConfigured) return sample.history;
  const { data, error } = await supabase
    .from('festivals')
    .select('year, public_donation_total')
    .order('year', { ascending: false });
  if (error || !data?.length) return sample.history;
  return data.map((f) => ({
    year: f.year,
    highlight: { en: f.public_donation_total ? `Total donations: ${f.public_donation_total}` : '', te: '' },
  }));
}

// ---------- contacts ----------
export async function getContacts() {
  if (!isSupabaseConfigured) return sample.contacts;
  const { data, error } = await supabase.from('contacts').select('*').order('sort_order');
  if (error || !data) return sample.contacts;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    role: { en: c.role_en, te: c.role_te },
    phone: c.phone,
  }));
}
