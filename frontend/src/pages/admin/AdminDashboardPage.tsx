import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

interface DashboardMetrics {
  tenants: { total: number; active: number; trial: number; suspended: number };
  users: { total: number; active: number; banned: number };
  revenue: { total: number; recentPayments: number };
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await adminApi.getDashboard();
        setMetrics(data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!metrics) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  const StatCard = ({ label, value, icon, color }: any) => (
    <div className={`rounded-lg ${color} p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="mt-1 text-gray-500">Overview of the entire event management platform</p>
      </div>

      {/* Tenants Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Tenants</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Tenants" value={metrics.tenants.total} icon="🏢" color="bg-blue-600" />
          <StatCard label="Active" value={metrics.tenants.active} icon="✅" color="bg-green-600" />
          <StatCard label="Trial" value={metrics.tenants.trial} icon="🔄" color="bg-yellow-600" />
          <StatCard label="Suspended" value={metrics.tenants.suspended} icon="🚫" color="bg-red-600" />
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Users</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Users" value={metrics.users.total} icon="👥" color="bg-purple-600" />
          <StatCard label="Active" value={metrics.users.active} icon="🟢" color="bg-green-600" />
          <StatCard label="Banned" value={metrics.users.banned} icon="⛔" color="bg-red-600" />
        </div>
      </div>

      {/* Revenue Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Revenue</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Revenue" value={`$${metrics.revenue.total.toFixed(2)}`} icon="💰" color="bg-indigo-600" />
          <StatCard label="Recent Transactions" value={metrics.revenue.recentPayments} icon="💳" color="bg-cyan-600" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex gap-3">
          <a href="/super-admin/tenants" className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Manage Tenants
          </a>
          <a href="/super-admin/users" className="inline-block rounded-lg bg-secondary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-700">
            Manage Users
          </a>
          <a href="/super-admin/billing" className="inline-block rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700">
            Billing
          </a>
        </div>
      </div>
    </div>
  );
}
