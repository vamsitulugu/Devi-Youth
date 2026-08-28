// Lightweight script-based language detection for the two languages this
// app supports. We deliberately do NOT call an API for this — it needs
// to be instant (used on every keystroke in admin forms) and the Telugu
// Unicode block makes a regex 100% reliable for script detection.
//
// This detects SCRIPT, not "correctness" — a proper noun typed in Telugu
// script is still detected as Telugu, which is what we want: transliterated
// names (e.g. "గణేష్") should be stored as the Telugu source value, not
// silently translated into a different word.

const TELUGU_RE = /[\u0C00-\u0C7F]/;
const LATIN_RE = /[A-Za-z]/;

/**
 * Returns 'te' if the text contains any Telugu-script characters, 'en' if
 * it contains Latin letters (and no Telugu), or null if the text is empty
 * or contains neither (e.g. only numbers/punctuation) — callers should
 * fall back to whatever language was previously selected in that case.
 */
export function detectLanguage(text) {
  if (!text || !text.trim()) return null;
  if (TELUGU_RE.test(text)) return 'te';
  if (LATIN_RE.test(text)) return 'en';
  return null;
}

export const LANGUAGE_LABELS = {
  en: { en: 'English', te: 'ఇంగ్లీష్' },
  te: { en: 'Telugu', te: 'తెలుగు' },
};
