const fieldStyle = {
  width: '100%',
  minHeight: 44,
  padding: '12px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--color-border)',
  background: '#fff',
  fontSize: 'var(--fs-base)', /* 16px — prevents iOS Safari auto-zoom on focus */
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-body)',
};

export function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)' }}>{label}</span>}
      {children}
      {hint && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input {...props} style={{ ...fieldStyle, ...(props.style || {}) }} />;
}

export function Textarea(props) {
  return <textarea rows={3} {...props} style={{ ...fieldStyle, resize: 'vertical', ...(props.style || {}) }} />;
}

export function Select(props) {
  return <select {...props} style={{ ...fieldStyle, ...(props.style || {}) }} />;
}

export function FormGrid({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}