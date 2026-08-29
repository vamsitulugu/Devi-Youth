import { useEffect, useState } from 'react';

// Re-runs `fetcher` whenever an entry in `deps` changes. Guards against
// setting state after unmount and against a stale (slower) earlier
// request clobbering a newer one.
export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive) setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return { data, loading, error, reload };
}