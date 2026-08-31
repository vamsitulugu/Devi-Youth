import { useMemo, useState } from 'react';
import { Phone, MessageCircle, User, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getContacts } from '../services/api';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

const COPY = { en: { search: 'Search contacts…', none: 'No matches.' }, te: { search: 'సంప్రదింపులు వెతకండి…', none: 'ఏమీ దొరకలేదు.' } };

function isWhatsAppCapable(phone) {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

export default function Contacts() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { data: contacts, loading, error, reload } = useAsyncData(getContacts, []);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return contacts || [];
    return (contacts || []).filter((ct) =>
      ct.name?.toLowerCase().includes(needle) ||
      ct.role?.[lang]?.toLowerCase().includes(needle) ||
      ct.phone?.includes(needle));
  }, [contacts, q, lang]);

  return (
    <>
      <Header title={t('contacts_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && (!contacts || contacts.length === 0) && (
          <EmptyState icon={User} title={t('contacts_empty')} subtitle={t('contacts_empty_sub')} />
        )}

        {!loading && !error && contacts?.length > 6 && (
          <div className="search-bar" style={{ margin: 0 }}>
            <Search size={16} strokeWidth={2.4} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search} aria-label={c.search} />
          </div>
        )}

        {!loading && !error && contacts?.length > 0 && filtered.length === 0 && (
          <EmptyState icon={User} title={c.none} />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((ct, i) => (
              <Reveal key={ct.id} delay={Math.min(i, 8) * 35} as="div" className="card contact-row">
                <div className="icon-badge"><User size={20} /></div>
                <div className="info">
                  <div className="name">{ct.name}</div>
                  <div className="role">{ct.role[lang]}</div>
                </div>
                <div className="actions">
                  <a className="icon-btn call" href={`tel:${ct.phone}`} aria-label={t('call')}>
                    <Phone size={16} />
                  </a>
                  {isWhatsAppCapable(ct.phone) && (
                    <a
                      className="icon-btn whatsapp"
                      href={`https://wa.me/${ct.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
