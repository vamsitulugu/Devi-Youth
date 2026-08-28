// Resolves a { en, te } pair where the admin only entered ONE side (the
// single-input workflow — see BilingualField) into a complete pair with
// both languages filled in, using cached/live translation.
//
// Fallback hierarchy (per spec):
//   1. Both sides already present (e.g. legacy hand-entered rows) -> used as-is.
//   2. Missing side has a cached translation -> used.
//   3. Otherwise translate live now.
//   4. If translation fails for any reason -> fall back to the source
//      text itself. NEVER return blank/undefined/null for a language
//      that has real underlying content.
import { translateText } from './translate';

export async function resolveBilingual(pair) {
  const en = (pair?.en || '').trim();
  const te = (pair?.te || '').trim();
  if (en && te) return { en, te };
  if (!en && !te) return { en: '', te: '' };

  const sourceLang = pair?.sourceLang || (en ? 'en' : 'te');
  const sourceText = sourceLang === 'en' ? en : te;
  const targetLang = sourceLang === 'en' ? 'te' : 'en';

  const translated = await translateText(sourceText, sourceLang, targetLang);
  const filledSide = translated || sourceText; // never blank

  return sourceLang === 'en' ? { en: sourceText, te: filledSide } : { en: filledSide, te: sourceText };
}

// Resolves many bilingual pairs in parallel. Each item is resolved
// independently and failures are isolated (resolveBilingual never
// throws), so one bad field can't take down a whole list.
export async function resolveManyBilingual(pairs) {
  return Promise.all(pairs.map(resolveBilingual));
}
