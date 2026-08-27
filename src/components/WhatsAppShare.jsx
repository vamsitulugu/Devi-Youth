import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function WhatsAppShare({ text }) {
  const { t } = useLanguage();

  const handleShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button className="btn btn-leaf btn-sm" onClick={handleShare}>
      <MessageCircle size={15} />
      {t('share_whatsapp')}
    </button>
  );
}
