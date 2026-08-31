import { useEffect, useRef, useState } from 'react';

/**
 * Shared scroll-reveal wrapper — section fades/rises into place the first
 * time it enters the viewport. Used across Home, Announcements, Events,
 * Gallery, Committee, Contacts, More so every screen gets the same
 * considered, staggered entrance instead of popping in as one flat block.
 */
export default function Reveal({ children, delay = 0, as: Tag = 'section', style, className, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const revealClass = `reveal${seen ? ' in' : ''}`;
  return (
    <Tag ref={ref} className={className ? `${revealClass} ${className}` : revealClass} style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
