import { CalendarDays } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getAnnouncements } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import WhatsAppShare from '../components/WhatsAppShare';
import Header from '../components/Header';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Announcements() {
  const { t, lang } = useLanguage();
  const { data: announcements, loading, error } = useAsyncData(getAnnouncements, []);

  return (
    <>
      <Header title={t('announcements_title')} />
      <div className="page">
        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}
        {!loading && !error && announcements?.length === 0 && (
          <div className="card empty-state">{t('announcements_empty')}</div>
        )}
        {!loading && !error && announcements?.map((a) => (
          <div className="card card-pad" key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {a.image && <PhotoTile src={a.image} alt="" wide />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {a.important && <span className="chip chip-danger">{t('important')}</span>}
              <span className="meta" style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
                <CalendarDays size={12} style={{ verticalAlign: -2 }} /> {a.date}
              </span>
            </div>
            <div className="title" style={{ fontSize: 'var(--fs-md)' }}>{a.title?.[lang] || ''}</div>
            <div className="desc" style={{ fontSize: 'var(--fs-sm)' }}>{a.body?.[lang] || ''}</div>
            <div>
              <WhatsAppShare text={`🙏 ${a.title?.[lang] || ''}\n\n${a.body?.[lang] || ''}`} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}