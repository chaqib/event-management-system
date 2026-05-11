import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  status: string;
  plan: string;
  createdAt: string;
  maxEvents: number;
  maxTeamMembers: number;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminApi.getTenants(params);
      setTenants(data.tenants);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!window.confirm('Suspend this tenant?')) return;
    try {
      await adminApi.updateTenantStatus(id, 'suspended', 'Suspended by admin');
      toast.success('Tenant suspended');
      fetchTenants();
    } catch {
      toast.error('Failed to suspend tenant');
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm('Activate this tenant?')) return;
    try {
      await adminApi.updateTenantStatus(id, 'active');
      toast.success('Tenant activated');
      fetchTenants();
    } catch {
      toast.error('Failed to activate tenant');
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedTenant || !selectedPlan) return;
    try {
      await adminApi.updateTenantPlan(selectedTenant, selectedPlan);
      toast.success('Plan updated');
      setShowPlanModal(false);
      fetchTenants();
    } catch {
      toast.error('Failed to update plan');
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all organizations on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-4 py-2.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Limits</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No tenants found
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.ownerEmail}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">{t.plan}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t.maxEvents === -1 ? '∞' : t.maxEvents} events, {t.maxTeamMembers === -1 ? '∞' : t.maxTeamMembers} team
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {t.status === 'active' ? (
                        <button onClick={() => handleSuspend(t.id)} className="text-sm text-red-600 hover:text-red-700">
                          Suspend
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(t.id)} className="text-sm text-green-600 hover:text-green-700">
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTenant(t.id);
                          setShowPlanModal(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Change Plan
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Change Subscription Plan</h3>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="mb-4 w-full rounded-lg border px-4 py-2"
            >
              <option value="">Select Plan</option>
              <option value="free_trial">Free Trial (3 events, 2 team)</option>
              <option value="starter">Starter (10 events, 3 team) - $29</option>
              <option value="pro">Pro (50 events, 10 team) - $79</option>
              <option value="enterprise">Enterprise (Unlimited) - $199</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleUpgradePlan} className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                Update
              </button>
              <button onClick={() => setShowPlanModal(false)} className="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
