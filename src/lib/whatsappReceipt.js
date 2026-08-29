// Shared by ManageDonations (instant send on save) and PendingSends (bulk
// queue) so both build the exact same message/link.

export function receiptLink(donationId) {
  return `${window.location.origin}${window.location.pathname}#/r/${donationId}`;
}

// Opens WhatsApp (app on mobile, web on desktop) with the receipt message
// pre-filled for the given 10-digit Indian phone number. Returns the URL
// used, mainly so callers can log/debug if needed.
export function openWhatsAppReceipt({ phone, donorName, amount, festivalName, donationId }) {
  const link = receiptLink(donationId);
  const inr = `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const text =
    `🙏 Thank you, ${donorName}, for your generous contribution of ${inr} ` +
    `to Devi Youth — Sree Bala Ganesh (${festivalName || 'our village Ganesh festival'})!\n\n` +
    `Your official receipt:\n${link}`;
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  const url = `https://wa.me/${withCountryCode}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return url;
}
