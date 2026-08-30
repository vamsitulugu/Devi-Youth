import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Select, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { useCloseOnBack } from '../../hooks/useCloseOnBack';
import {
  getLotteryForFestival, upsertLottery, lotteryPrizesApi, lotteryWinnersApi, uploadImage, publicUrl,
} from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const blankDraw = { draw_date: '', draw_time: '', location_en: '', location_te: '', location_source_lang: null };
const blankPrize = { name_en: '', name_te: '', name_source_lang: null, value: '', image_url: '' };
const blankWinner = { winner_name: '', prize_id: '' };

export default function ManageLottery() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [lottery, setLottery] = useState(null);
  const [draw, setDraw] = useState(blankDraw);
  const [prizes, setPrizes] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingDraw, setSavingDraw] = useState(false);

  const [newPrize, setNewPrize] = useState(blankPrize);
  const [prizeFile, setPrizeFile] = useState(null);
  const [addingPrize, setAddingPrize] = useState(false);
  useCloseOnBack(addingPrize, () => setAddingPrize(false));
  const [prizeToDelete, setPrizeToDelete] = useState(null);

  const [newWinner, setNewWinner] = useState(blankWinner);
  const [addingWinner, setAddingWinner] = useState(false);
  useCloseOnBack(addingWinner, () => setAddingWinner(false));
  const [winnerToDelete, setWinnerToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      const row = await getLotteryForFestival(festivalId);
      setLottery(row);
      setDraw(row ? {
        draw_date: row.draw_date || '', draw_time: row.draw_time || '',
        location_en: row.location_en || '', location_te: row.location_te || '', location_source_lang: row.location_source_lang,
      } : blankDraw);
      if (row) {
        const [p, w] = await Promise.all([lotteryPrizesApi.list(row.id), lotteryWinnersApi.list(row.id)]);
        setPrizes(p);
        setWinners(w);
      } else {
        setPrizes([]);
        setWinners([]);
      }
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId, festivalLoading]);

  async function handleSaveDraw(e) {
    e.preventDefault();
    setSavingDraw(true);
    try {
      const saved = await upsertLottery({ ...draw, festival_id: festivalId });
      setLottery(saved);
      toast('Draw details saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingDraw(false);
    }
  }

  async function handleAddPrize(e) {
    e.preventDefault();
    if (!lottery) {
      toast('Save draw details first', 'error');
      return;
    }
    setAddingPrize(true);
    try {
      let image_url = '';
      if (prizeFile) {
        const path = `lottery/${festival.year}-${Date.now()}-${prizeFile.name}`;
        image_url = await uploadImage(prizeFile, path);
      }
      await lotteryPrizesApi.add({ ...newPrize, image_url, lottery_id: lottery.id, sort_order: prizes.length });
      toast('Prize added');
      setNewPrize(blankPrize);
      setPrizeFile(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAddingPrize(false);
    }
  }

  async function handleDeletePrize() {
    try {
      await lotteryPrizesApi.remove(prizeToDelete.id);
      toast('Prize removed');
      setPrizeToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleAddWinner(e) {
    e.preventDefault();
    if (!lottery) return;
    setAddingWinner(true);
    try {
      await lotteryWinnersApi.add({
        winner_name: newWinner.winner_name,
        prize_id: newWinner.prize_id || null,
        lottery_id: lottery.id,
      });
      toast('Winner added');
      setNewWinner(blankWinner);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAddingWinner(false);
    }
  }

  async function handleDeleteWinner() {
    try {
      await lotteryWinnersApi.remove(winnerToDelete.id);
      toast('Winner removed');
      setWinnerToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Lottery" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {loading && <PageSkeleton rows={3} />}
        {!loading && error && <PageError onRetry={reload} />}

        {!loading && !error && festivalId && (
          <>
            <form className="card card-pad" onSubmit={handleSaveDraw}>
              <FormGrid>
                <strong>Draw Details</strong>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Field label="Draw Date">
                    <Input type="date" value={draw.draw_date} onChange={(e) => setDraw({ ...draw, draw_date: e.target.value })} />
                  </Field>
                  <Field label="Time">
                    <Input placeholder="8:00 PM" value={draw.draw_time} onChange={(e) => setDraw({ ...draw, draw_time: e.target.value })} />
                  </Field>
                </div>
                <BilingualField label="Location" baseName="location" form={draw} setForm={setDraw} />
                <button className="btn btn-primary btn-block" disabled={savingDraw}>
                  {savingDraw ? 'Saving…' : 'Save Draw Details'}
                </button>
              </FormGrid>
            </form>

            <div>
              <div className="section-title"><h2>Prizes</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prizes.map((p) => (
                  <div key={p.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {p.image_url && <img src={publicUrl(p.image_url)} alt="" className="thumb" loading="lazy" decoding="async" />}
                    <div style={{ flex: 1 }}>
                      <div className="title">{p.name_en || p.name_te}</div>
                      <div className="meta">{p.value}</div>
                    </div>
                    <button className="icon-btn" onClick={() => setPrizeToDelete(p)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
                  </div>
                ))}
              </div>
              <form className="card card-pad" onSubmit={handleAddPrize} style={{ marginTop: 10 }}>
                <FormGrid>
                  <strong>Add Prize</strong>
                  <BilingualField label="Name" baseName="name" form={newPrize} setForm={setNewPrize} required />
                  <Field label="Value">
                    <Input placeholder="₹10,000" value={newPrize.value} onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })} />
                  </Field>
                  <Field label="Photo">
                    <Input type="file" accept="image/*" onChange={(e) => setPrizeFile(e.target.files?.[0] || null)} />
                  </Field>
                  <button className="btn btn-primary btn-block" disabled={addingPrize || !lottery}>
                    <Plus size={16} /> {addingPrize ? 'Adding…' : 'Add Prize'}
                  </button>
                  {!lottery && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>Save draw details first.</div>}
                </FormGrid>
              </form>
            </div>

            <div>
              <div className="section-title"><h2>Winners</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {winners.map((w) => (
                  <div key={w.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div className="title">{w.winner_name}</div>
                      <div className="meta">{w.lottery_prizes?.name_en || w.lottery_prizes?.name_te || '—'}</div>
                    </div>
                    <button className="icon-btn" onClick={() => setWinnerToDelete(w)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
                  </div>
                ))}
              </div>
              <form className="card card-pad" onSubmit={handleAddWinner} style={{ marginTop: 10 }}>
                <FormGrid>
                  <strong>Add Winner</strong>
                  <Field label="Winner Name">
                    <Input required value={newWinner.winner_name} onChange={(e) => setNewWinner({ ...newWinner, winner_name: e.target.value })} />
                  </Field>
                  <Field label="Prize">
                    <Select value={newWinner.prize_id} onChange={(e) => setNewWinner({ ...newWinner, prize_id: e.target.value })}>
                      <option value="">— None —</option>
                      {prizes.map((p) => <option key={p.id} value={p.id}>{p.name_en || p.name_te}</option>)}
                    </Select>
                  </Field>
                  <button className="btn btn-primary btn-block" disabled={addingWinner || !lottery}>
                    <Plus size={16} /> {addingWinner ? 'Adding…' : 'Add Winner'}
                  </button>
                </FormGrid>
              </form>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={!!prizeToDelete}
        message={`Delete prize "${prizeToDelete?.name_en || prizeToDelete?.name_te}"?`}
        onConfirm={handleDeletePrize}
        onCancel={() => setPrizeToDelete(null)}
      />
      <ConfirmDialog
        open={!!winnerToDelete}
        message={`Remove winner "${winnerToDelete?.winner_name}"?`}
        onConfirm={handleDeleteWinner}
        onCancel={() => setWinnerToDelete(null)}
      />
    </>
  );
}
