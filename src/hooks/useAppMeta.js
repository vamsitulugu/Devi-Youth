import { useEffect, useState } from 'react';

// scripts/publish-apk.js uploads the APK to Vercel Blob Storage and
// writes public/downloads/app-meta.json on every release — the APK
// itself is never committed to git, only this small pointer file. This
// always reflects whatever was most recently published, so nothing
// here needs to change by hand when the app version bumps. Returns
// undefined while loading, and null forever if no APK has been
// published yet (so download UI just doesn't render rather than
// pointing at a broken link).
export function useAppMeta() {
  const [meta, setMeta] = useState(undefined); // undefined = still loading

  useEffect(() => {
    let cancelled = false;
    fetch('/downloads/app-meta.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setMeta(data); })
      .catch(() => { if (!cancelled) setMeta(null); });
    return () => { cancelled = true; };
  }, []);

  return meta;
}