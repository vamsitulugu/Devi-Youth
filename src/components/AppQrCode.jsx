import { useEffect, useRef, useState } from 'react';
import { X, Download, QrCode as QrCodeIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { useLanguage } from '../i18n/LanguageContext';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { SITE_URL } from '../config';

/**
 * A small "QR Code" button that, when tapped, shows a full-size QR code
 * pointing at the villager-facing home page (SITE_URL). Used in both the
 * villager header and the admin/committee header — same button, same code,
 * same destination — so whoever is showing it, the person scanning always
 * lands on the villager app, never an admin screen.
 */
export default function AppQrCode() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const canvasRef = useRef(null);
  useCloseOnBack(open, () => setOpen(false));

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, SITE_URL, {
      width: 240,
      margin: 1,
      color: { dark: '#3a1a10', light: '#ffffff' },
    });
  }, [open]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'devi-youth-app-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <>
      <button className="lang-toggle qr-toggle" onClick={() => setOpen(true)} aria-label={t('qr_button_label')}>
        <QrCodeIcon size={14} />
      </button>
      {open && (
        <div className="lightbox" style={{ background: 'rgba(20,10,5,0.6)' }} onClick={() => setOpen(false)}>
          <div className="card card-pad qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn qr-modal-close" onClick={() => setOpen(false)} aria-label={t('qr_modal_close')}>
              <X size={18} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-md)', marginBottom: 6, textAlign: 'center' }}>
              {t('qr_modal_title')}
            </div>
            <div style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)', marginBottom: 16, textAlign: 'center' }}>
              {t('qr_modal_subtitle')}
            </div>
            <div className="qr-canvas-wrap">
              <canvas ref={canvasRef} />
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleDownload}>
              <Download size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
              {t('qr_modal_download')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
