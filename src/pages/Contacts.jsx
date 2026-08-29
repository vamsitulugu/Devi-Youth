import { Phone, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getContacts } from '../services/api';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Contacts() {
  const { t, lang } = useLanguage();
  const { data: contacts, loading, error, reload } = useAsyncData(getContacts, []);

  return (
    <>
      <Header title={t('contacts_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && (!contacts || contacts.length === 0) && (
          <EmptyState icon={User} title={t('contacts_empty')} subtitle={t('contacts_empty_sub')} />
        )}
        {!loading && !error && contacts?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contacts.map((c) => (
              <div className="card contact-row" key={c.id}>
                <div className="icon-badge"><User size={20} /></div>
                <div className="info">
                  <div className="name">{c.name}</div>
                  <div className="role">{c.role[lang]}</div>
                </div>
                <div className="actions">
                  <a className="icon-btn call" href={`tel:${c.phone}`} aria-label={t('call')}>
                    <Phone size={16} />
                  </a>
                  <a
                    className="icon-btn whatsapp"
                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}