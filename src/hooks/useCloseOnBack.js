import { useEffect, useRef } from 'react';

/**
 * Makes the mobile/browser back button close an in-page overlay (a photo
 * viewer, an album view, an admin edit form, etc.) instead of leaving the
 * page entirely — which on a mobile PWA/webview means closing the whole app.
 *
 * How it works: the moment an overlay opens, we push one extra history
 * entry and register it on a shared stack. Pressing back pops exactly one
 * history entry and closes only the top-most overlay — so with a photo
 * viewer open on top of an album view, one back press closes the viewer and
 * the next closes the album, step by step, the way the person expects.
 *
 * If an overlay is closed some other way (an X button, tapping an item,
 * etc.) instead of the back button, we remove its entry from the stack and
 * pop the extra history entry ourselves — flagging that pop as
 * "programmatic" so the shared popstate listener doesn't also close
 * whatever overlay happens to be underneath it.
 *
 * Usage: useCloseOnBack(isOpen, closeFn)
 */
const stack = [];
let listenerAttached = false;
let suppressNextPop = false;

function ensureListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('popstate', () => {
    if (suppressNextPop) {
      suppressNextPop = false;
      return;
    }
    const top = stack.pop();
    if (top) top.onClose();
  });
}

export function useCloseOnBack(isOpen, onClose) {
  const entryRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    ensureListener();

    const entry = { onClose: () => onCloseRef.current() };
    stack.push(entry);
    entryRef.current = entry;
    window.history.pushState({ __overlay: true }, '');

    return () => {
      // Still in the stack means this closed some other way (not the back
      // button) — clean up the entry and the extra history state ourselves,
      // without letting that back() call also pop whatever's underneath.
      const idx = stack.indexOf(entryRef.current);
      if (idx !== -1) {
        stack.splice(idx, 1);
        suppressNextPop = true;
        window.history.back();
      }
      entryRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
