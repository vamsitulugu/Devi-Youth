import { NavLink } from 'react-router-dom';
import { Home, Megaphone, CalendarDays, Images, Menu } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const items = [
  { to: '/', icon: Home, key: 'nav_home', end: true },
  { to: '/announcements', icon: Megaphone, key: 'nav_announcements' },
  { to: '/events', icon: CalendarDays, key: 'nav_events' },
  { to: '/gallery', icon: Images, key: 'nav_gallery' },
  { to: '/more', icon: Menu, key: 'nav_more' },
];

export default function BottomNav() {
  const { t } = useLanguage();
  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, key, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={21} strokeWidth={2.2} />
          <span className="nav-label">{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
