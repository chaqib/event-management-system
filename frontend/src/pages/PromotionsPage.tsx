import { useEffect, useState } from 'react';
import { promotionsApi } from '../services/api';
import toast from 'react-hot-toast';

const typeColors: Record<string, string> = {
  percentage: 'bg-blue-100 text-blue-700',
  fixed: 'bg-green-100 text-green-700',
};

export default function PromotionsPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '', maxUses: '', minOrderAmount: '', startDate: '', endDate: '',
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const { data } = await promotionsApi.getAll();
      setPromos(data.promotions || []);
    } catch {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await promotionsApi.create({
        ...form,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      });
      toast.success('Promo code created');
      setShowForm(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', minOrderAmount: '', startDate: '', endDate: '' });
      fetchPromos();
    } catch {
      toast.error('Failed to create promotion');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage promo codes and discounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          {showForm ? 'Cancel' : '+ New Promo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" required placeholder="Promo code (e.g. SAVE20)" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
            <input type="number" required placeholder="Discount value" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="number" placeholder="Max uses (optional)" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="number" placeholder="Min order amount (optional)" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <div></div>
            <input type="date" placeholder="Start date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="date" placeholder="End date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700">Create Promo</button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Uses</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : promos.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No promotions found</td></tr>
            ) : promos.map(p => {
              const isExpired = p.endDate && new Date(p.endDate) < new Date();
              const isMaxed = p.maxUses && p.currentUses >= p.maxUses;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900">{p.code}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColors[p.discountType]}`}>{p.discountType}</span></td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.discountType === 'percentage' ? `${p.discountValue}%` : `$${p.discountValue}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.currentUses || 0}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.endDate ? new Date(p.endDate).toLocaleDateString() : 'No limit'}</td>
                  <td className="px-6 py-4">
                    {isExpired ? <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Expired</span>
                     : isMaxed ? <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Maxed Out</span>
                     : <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Active</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
