import { Phone, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getContacts } from '../services/api';
import Header from '../components/Header';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Contacts() {
  const { t, lang } = useLanguage();
  const { data: contacts, loading, error } = useAsyncData(getContacts, []);

  return (
    <>
      <Header title={t('contacts_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError />}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contacts?.map((c) => (
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
