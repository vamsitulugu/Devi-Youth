import { ImageIcon } from 'lucide-react';

export default function PhotoTile({ src, alt, className = '', onClick, wide = false }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${wide ? 'wide-photo' : ''} ${className}`}
        onClick={onClick}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`g-item ${wide ? 'wide-photo' : ''} ${className}`}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-border)' }}
    >
      <ImageIcon size={wide ? 32 : 20} strokeWidth={1.5} />
    </div>
  );
}
