import { ImageIcon } from 'lucide-react';

export default function PhotoTile({ src, alt, className = '', onClick, wide = false, style }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${wide ? 'wide-photo' : ''} ${className}`}
        onClick={onClick}
        loading="lazy"
        style={onClick ? { cursor: 'zoom-in', ...style } : style}
      />
    );
  }
  return (
    <div
      className={`g-item ${wide ? 'wide-photo' : ''} ${className}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-border)',
        ...(onClick ? { cursor: 'zoom-in' } : null),
        ...style,
      }}
    >
      <ImageIcon size={wide ? 32 : 20} strokeWidth={1.5} />
    </div>
  );
}
