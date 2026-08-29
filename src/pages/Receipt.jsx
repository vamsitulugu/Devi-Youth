import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Very small English number-to-words for the "Rupees ... only" line —
// donation amounts here are always whole rupees.
function numberToWords(n) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(num) {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  }
  function three(num) {
    if (num >= 100) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + two(num % 100) : '');
    return two(num);
  }
  if (!n || n <= 0) return 'Zero';
  let num = Math.round(n);
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const parts = [];
  if (crore) parts.push(three(crore) + ' Crore');
  if (lakh) parts.push(three(lakh) + ' Lakh');
  if (thousand) parts.push(three(thousand) + ' Thousand');
  if (num) parts.push(three(num));
  return parts.join(' ');
}

export default function Receipt() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | not_found | error

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured) { setStatus('error'); return; }
      const { data, error } = await supabase.rpc('get_receipt_public', { p_id: id });
      if (cancelled) return;
      if (error || !data || data.length === 0) { setStatus('not_found'); return; }
      setReceipt(data[0]);
      setStatus('ok');
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (status === 'loading') {
    return <div className="receipt-wrap"><div className="receipt-card receipt-skeleton" /></div>;
  }

  if (status !== 'ok') {
    return (
      <div className="receipt-wrap">
        <div className="receipt-card" style={{ textAlign: 'center', padding: 40 }}>
          <p>This receipt link isn't valid or has expired.</p>
        </div>
      </div>
    );
  }

  const dateStr = new Date(receipt.donation_date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="receipt-wrap">
      <div className="receipt-card">
        <div className="receipt-seal">ॐ</div>
        <div className="receipt-om">।। ॐ श्री गणेशाय नमः ।।</div>
        <h1 className="receipt-title">{receipt.festival_name}</h1>
        <div className="receipt-sub">Sarvajanik Ganeshotsav</div>
        <div className="receipt-badge">Official Donation Receipt</div>

        <div className="receipt-row">
          <div>
            <div className="receipt-label">Receipt No.</div>
            <div className="receipt-value">{receipt.receipt_no}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="receipt-label">Date</div>
            <div className="receipt-value">{dateStr}</div>
          </div>
        </div>

        <div className="receipt-center">
          <div className="receipt-label">Received with gratitude from</div>
          <div className="receipt-donor">{receipt.donor_name}</div>
          <div className="receipt-label" style={{ marginTop: 18 }}>Contribution Amount</div>
          <div className="receipt-amount">{inr(receipt.amount)}</div>
          <div className="receipt-words">Rupees {numberToWords(receipt.amount)} only</div>
        </div>

        <div className="receipt-footer-note">
          This digital receipt is issued in the spirit of the traditional bill-book.
          May Bappa bless you.
        </div>
      </div>
    </div>
  );
}
