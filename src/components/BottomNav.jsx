import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Megaphone, CalendarDays, Images, Menu } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useUnreadCount } from './NotificationSheet';

const items = [
  { to: '/', icon: Home, key: 'nav_home', end: true },
  { to: '/announcements', icon: Megaphone, key: 'nav_announcements' },
  { to: '/events', icon: CalendarDays, key: 'nav_events' },
  { to: '/gallery', icon: Images, key: 'nav_gallery' },
  { to: '/more', icon: Menu, key: 'nav_more' },
];

/**
 * BottomNav v2 — frosted bar, icon capsule that lifts and pops on select,
 * and a marigold rail that physically slides between tabs instead of
 * disappearing and reappearing. Same five routes, same labels.
 */
export default function BottomNav() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const [rail, setRail] = useState({ left: 0, width: 0, ready: false });
  const unread = useUnreadCount();

  const activeIndex = (() => {
    const i = items.findIndex((it) => (it.end ? pathname === it.to : pathname.startsWith(it.to)));
    return i === -1 ? 0 : i;
  })();

  // Measure the active tab so the rail can be positioned in real pixels —
  // this survives label length changing between EN and Telugu.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const el = nav.children[activeIndex];
    if (!el) return;
    const w = Math.min(30, el.offsetWidth * 0.4);
    setRail({ left: el.offsetLeft + (el.offsetWidth - w) / 2, width: w, ready: true });
  }, [activeIndex]);

  useEffect(() => {
    const onResize = () => {
      const nav = navRef.current;
      const el = nav && nav.children[activeIndex];
      if (!el) return;
      const w = Math.min(30, el.offsetWidth * 0.4);
      setRail({ left: el.offsetLeft + (el.offsetWidth - w) / 2, width: w, ready: true });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIndex]);

  return (
    <nav className="bottom-nav nav-v2" ref={navRef}>
      {items.map(({ to, icon: Icon, key, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <Icon size={21} strokeWidth={2.2} />
            {key === 'nav_announcements' && unread > 0 && <span className="nav-dot" />}
          </span>
          <span className="nav-label">{t(key)}</span>
        </NavLink>
      ))}
      <span
        className="nav-v2-rail"
        style={{
          width: rail.width,
          transform: `translateX(${rail.left}px)`,
          opacity: rail.ready ? 1 : 0,
        }}
      />
    </nav>
  );
}
