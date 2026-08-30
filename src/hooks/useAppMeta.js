import { useEffect, useState } from 'react';

// scripts/publish-apk.js writes both of these into public/downloads/ on
// every release, so this always reflects whatever was most recently
// published — nothing here needs to change by hand when the app
// version bumps. Returns null until the app knows one way or the
// other (loading), and stays null forever if no APK has been
// published yet (so the download UI just doesn't render rather than
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

export const APK_DOWNLOAD_URL = '/downloads/devi-youth.apk';
