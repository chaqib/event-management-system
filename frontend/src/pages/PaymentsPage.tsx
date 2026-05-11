import { useEffect, useState } from 'react';
import { paymentsApi } from '../services/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalRevenue: '0', totalTransactions: '0' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, statsRes] = await Promise.all([
          paymentsApi.getAll({ page, limit: 15 }),
          paymentsApi.getRevenue(),
        ]);
        setPayments(paymentsRes.data.payments);
        setTotalPages(paymentsRes.data.totalPages);
        setStats(statsRes.data);
      } catch {
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor all transactions</p>
      </div>

      {/* Revenue Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-1 text-3xl font-bold text-green-600">${Number(stats.totalRevenue).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payments found</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{p.id.slice(0, 8)}...</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.user?.firstName} {p.user?.lastName}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">${p.amount}</td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.paymentMethod?.replace('_', ' ') || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
