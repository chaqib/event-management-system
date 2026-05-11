import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

interface RevenueData {
  dailyRevenue: Array<{ date: string; amount: number; transactions: number }>;
  byPlan: Array<{ plan: string; count: number }>;
  totalRevenue: number;
}

export default function AdminBillingPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchRevenue();
  }, [days]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getRevenue(days);
      setRevenue(data);
    } catch {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!revenue) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  const totalTransactions = revenue.dailyRevenue.reduce((sum, d) => sum + d.transactions, 0);
  const avgDailyRevenue = revenue.dailyRevenue.length > 0 ? revenue.totalRevenue / revenue.dailyRevenue.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Revenue</h1>
        <p className="mt-1 text-gray-500">Platform revenue and financial metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="mt-2 text-4xl font-bold">${revenue.totalRevenue.toFixed(2)}</p>
          <p className="mt-2 text-xs opacity-75">Last {days} days</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Total Transactions</p>
          <p className="mt-2 text-4xl font-bold">{totalTransactions}</p>
          <p className="mt-2 text-xs opacity-75">Across all tenants</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Daily Average</p>
          <p className="mt-2 text-4xl font-bold">${avgDailyRevenue.toFixed(2)}</p>
          <p className="mt-2 text-xs opacity-75">Per day</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={() => setDays(7)}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${days === 7 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setDays(30)}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${days === 30 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setDays(90)}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${days === 90 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
        >
          Last 90 Days
        </button>
      </div>

      {/* Revenue by Plan */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue by Plan</h2>
        <div className="space-y-3">
          {revenue.byPlan.map((item: any) => (
            <div key={item.plan} className="flex items-center justify-between border-b pb-3 last:border-0">
              <span className="font-medium text-gray-900 capitalize">{item.plan}</span>
              <span className="text-sm text-gray-600">{item.count} tenant{item.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Revenue */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Daily Revenue</h2>
        <div className="space-y-2">
          {revenue.dailyRevenue.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
              <span className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString()}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{item.transactions} tx</span>
                <span className="w-32 text-right font-medium text-gray-900">${item.amount.toFixed(2)}</span>
                {/* Simple bar visualization */}
                <div className="h-6 w-32 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${(item.amount / Math.max(...revenue.dailyRevenue.map(r => r.amount))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
