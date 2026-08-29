import { forwardRef } from 'react';

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

export function Field({ label, children, hint, required, error }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)' }}>
          {label}
          {required && <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span role="alert" style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-danger)', fontWeight: 600 }}>{error}</span>
      ) : (
        hint && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} style={{ ...fieldStyle, ...(props.style || {}) }} />;
});

export const Textarea = forwardRef(function Textarea(props, ref) {
  return <textarea ref={ref} rows={3} {...props} style={{ ...fieldStyle, resize: 'vertical', ...(props.style || {}) }} />;
});

export function Select(props) {
  return <select {...props} style={{ ...fieldStyle, ...(props.style || {}) }} />;
}

export function FormGrid({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}