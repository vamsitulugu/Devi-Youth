import { Field, Input, Textarea } from './FormField';
import { detectLanguage, LANGUAGE_LABELS } from '../../lib/language';

// A SINGLE input for content that's stored bilingually (`{base}_en` /
// `{base}_te` / `{base}_source_lang`). The admin types once, in whichever
// language they're comfortable with; we detect the script as they type
// and store it in the matching column. The other language is left blank
// and gets filled in for viewers by src/services/localize.js.
//
// `form`/`setForm` are the parent's plain form-state pair — this
// component reads `${baseName}_en`, `${baseName}_te`, `${baseName}_source_lang`
// off `form` and writes the same three keys back via `setForm`.
export default function BilingualField({ label, baseName, form, setForm, multiline, required, placeholder, hint }) {
  const enKey = `${baseName}_en`;
  const teKey = `${baseName}_te`;
  const langKey = `${baseName}_source_lang`;

  const sourceLang = form[langKey] || (form[teKey] && !form[enKey] ? 'te' : 'en');
  const value = sourceLang === 'te' ? (form[teKey] || '') : (form[enKey] || '');

  function handleChange(e) {
    const val = e.target.value;
    // Re-detect on every change so switching scripts mid-edit is picked
    // up correctly. If the field is empty or has no clear script (pure
    // numbers/punctuation), keep whatever language it was in already.
    const detected = detectLanguage(val) || sourceLang;
    setForm((f) => ({
      ...f,
      [enKey]: detected === 'en' ? val : '',
      [teKey]: detected === 'te' ? val : '',
      [langKey]: detected,
    }));
  }

  const Comp = multiline ? Textarea : Input;

  return (
    <Field label={label} hint={hint}>
      <Comp required={required} placeholder={placeholder} value={value} onChange={handleChange} />
      {value && (
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
          Detected language: {LANGUAGE_LABELS[sourceLang]?.en ?? 'English'} — the {sourceLang === 'te' ? 'English' : 'Telugu'} version
          is generated automatically.
        </span>
      )}
    </Field>
  );
}
