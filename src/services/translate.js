// Dynamic EN<->TE translation for admin-entered content.
//
// Design constraints (see the localization spec this implements):
//  - Never call the translation API on every render — cache aggressively.
//  - Never leave the API key concept exposed client-side — MyMemory's
//    free tier needs no key at all, so there's nothing to leak; if this
//    is later swapped for a keyed provider, route the call through a
//    Supabase Edge Function instead of calling it from the browser.
//  - Never throw. A translation failure must never break a page or blank
//    out real content — callers always get `null` back on failure and
//    fall back to the original source text.
//  - De-duplicate concurrent requests for the same text so a page with
//    many untranslated fields doesn't fire N redundant network calls.

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const TIMEOUT_MS = 8000;

// Per-session memory cache: fastest path, avoids even hitting Supabase
// for text we've already resolved once during this page load.
const memoryCache = new Map(); // `${targetLang}::${text}` -> translated text
const inFlight = new Map(); // same key -> in-progress Promise

function cacheKey(text, targetLang) {
  return `${targetLang}::${text}`;
}

async function readSharedCache(text, targetLang) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('source_text', text)
      .eq('target_lang', targetLang)
      .maybeSingle();
    return data?.translated_text || null;
  } catch {
    return null; // cache is best-effort, never fatal
  }
}

function writeSharedCache(text, sourceLang, targetLang, translatedText) {
  if (!isSupabaseConfigured) return;
  // Fire-and-forget: a failed cache write should never affect the caller,
  // who already has the translated text in hand.
  supabase
    .from('translation_cache')
    .upsert(
      { source_text: text, source_lang: sourceLang, target_lang: targetLang, translated_text: translatedText },
      { onConflict: 'source_text,target_lang' }
    )
    .then(() => {}, () => {});
}

async function callTranslationApi(text, sourceLang, targetLang) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    // MyMemory returns a "MYMEMORY WARNING" string (still HTTP 200) when
    // its free-tier quota is hit — treat that as a failure, not a result.
    if (!translated || /MYMEMORY WARNING|INVALID/i.test(translated)) return null;
    return translated;
  } catch {
    return null; // network error, abort/timeout, bad JSON — all non-fatal
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Translates `text` from `sourceLang` to `targetLang`.
 * Returns the translated string, or `null` if translation isn't possible
 * right now (empty input, API failure, timeout). Callers must fall back
 * to the original source text on `null` — never render blank content.
 */
export async function translateText(text, sourceLang, targetLang) {
  if (!text || !text.trim()) return null;
  if (!sourceLang || !targetLang || sourceLang === targetLang) return text;

  const key = cacheKey(text, targetLang);
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const cached = await readSharedCache(text, targetLang);
    if (cached) {
      memoryCache.set(key, cached);
      return cached;
    }
    const translated = await callTranslationApi(text, sourceLang, targetLang);
    if (translated) {
      memoryCache.set(key, translated);
      writeSharedCache(text, sourceLang, targetLang, translated);
    }
    return translated;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
