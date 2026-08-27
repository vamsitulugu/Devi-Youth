import { Phone } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCommittee } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Committee() {
  const { t, lang } = useLanguage();
  const { data: committee, loading, error } = useAsyncData(getCommittee, []);

  return (
    <>
      <Header title={t('committee_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError />}
        {!loading && !error && (
          <div className="committee-grid">
            {committee?.map((m) => (
              <div className="card member-card" key={m.id}>
                <PhotoTile src={m.photo} className="avatar" />
                <div className="name">{m.name}</div>
                <div className="position">{m.position[lang]}</div>
                {m.phone && (
                  <a className="btn btn-outline btn-sm" href={`tel:${m.phone}`}>
                    <Phone size={13} /> {t('contact')}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
