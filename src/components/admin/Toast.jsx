import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height, 0px) + 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 'min(92vw, 460px)',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card card-pad"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: t.type === 'error' ? '#FBE4E1' : '#E4EFE6',
              color: t.type === 'error' ? 'var(--color-danger)' : 'var(--color-leaf-dark)',
              fontWeight: 600,
              fontSize: 'var(--fs-sm)',
            }}
          >
            {t.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
