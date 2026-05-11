import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tenantsApi } from '../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  { key: 'free_trial', name: 'Free Trial', price: '$0', events: '3', attendees: '100', team: '2', fee: '5%' },
  { key: 'starter', name: 'Starter', price: '$29/mo', events: '10', attendees: '500', team: '3', fee: '3%' },
  { key: 'pro', name: 'Pro', price: '$79/mo', events: '50', attendees: '5,000', team: '10', fee: '2%' },
  { key: 'enterprise', name: 'Enterprise', price: '$199/mo', events: 'Unlimited', attendees: 'Unlimited', team: 'Unlimited', fee: '1%' },
];

export default function OrganizationPage() {
  const { activeTenant, tenants, refreshTenants } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', contactEmail: '', contactPhone: '', description: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', contactEmail: '', contactPhone: '', description: '', primaryColor: '' });

  useEffect(() => {
    if (activeTenant) {
      loadTenant();
    } else {
      setLoading(false);
    }
  }, [activeTenant]);

  const loadTenant = async () => {
    if (!activeTenant) return;
    try {
      const { data } = await tenantsApi.getById(activeTenant.id);
      setTenant(data);
      setEditForm({
        name: data.name,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || '',
        description: data.description || '',
        primaryColor: data.primaryColor || '#6366f1',
      });
    } catch {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await tenantsApi.create(newTenant);
      toast.success('Organization created!');
      setShowCreateModal(false);
      setNewTenant({ name: '', contactEmail: '', contactPhone: '', description: '' });
      await refreshTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    try {
      await tenantsApi.update(activeTenant.id, editForm);
      toast.success('Organization updated!');
      setEditing(false);
      await loadTenant();
      await refreshTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleUpgrade = async (plan: string) => {
    if (!activeTenant) return;
    try {
      await tenantsApi.updateSubscription(activeTenant.id, plan);
      toast.success('Plan updated!');
      await loadTenant();
      await refreshTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update plan');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  // No tenant yet — show create
  if (!activeTenant || tenants.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <span className="text-5xl">🏢</span>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Create Your Organization</h2>
          <p className="mt-2 text-gray-600">Set up your organization to start managing events.</p>
          <button onClick={() => setShowCreateModal(true)} className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
            Create Organization
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold mb-4">Create Organization</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                  <input type="text" required value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Acme Events" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                  <input type="email" required value={newTenant.contactEmail} onChange={(e) => setNewTenant({ ...newTenant, contactEmail: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="contact@acme.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={newTenant.contactPhone} onChange={(e) => setNewTenant({ ...newTenant, contactPhone: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={newTenant.description} onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" rows={3} />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
          + New Organization
        </button>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Organization Details</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                <input type="color" value={editForm.primaryColor} onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })} className="w-full h-10 rounded-lg border cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" rows={3} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Changes</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">Name</span><p className="font-medium">{tenant?.name}</p></div>
            <div><span className="text-sm text-gray-500">Slug</span><p className="font-medium text-gray-600">{tenant?.slug}</p></div>
            <div><span className="text-sm text-gray-500">Contact Email</span><p className="font-medium">{tenant?.contactEmail}</p></div>
            <div><span className="text-sm text-gray-500">Phone</span><p className="font-medium">{tenant?.contactPhone || '-'}</p></div>
            <div className="md:col-span-2"><span className="text-sm text-gray-500">Description</span><p className="font-medium">{tenant?.description || '-'}</p></div>
          </div>
        )}
      </div>

      {/* Subscription Plan */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Subscription Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isActive = tenant?.subscriptionPlan === plan.key;
            return (
              <div key={plan.key} className={`rounded-xl border-2 p-4 ${isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary-600 mt-1">{plan.price}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <li>📅 {plan.events} events</li>
                  <li>👥 {plan.attendees} attendees</li>
                  <li>👤 {plan.team} team members</li>
                  <li>💰 {plan.fee} platform fee</li>
                </ul>
                {isActive ? (
                  <div className="mt-4 py-2 text-center text-sm font-medium text-primary-600 bg-primary-100 rounded-lg">Current Plan</div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.key)} className="mt-4 w-full py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                    {plan.key === 'free_trial' ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Usage */}
      {tenant && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Max Events</p>
              <p className="text-xl font-bold">{tenant.maxEvents === -1 ? 'Unlimited' : tenant.maxEvents}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Max Attendees / Event</p>
              <p className="text-xl font-bold">{tenant.maxAttendeesPerEvent === -1 ? 'Unlimited' : tenant.maxAttendeesPerEvent}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Max Team Members</p>
              <p className="text-xl font-bold">{tenant.maxTeamMembers === -1 ? 'Unlimited' : tenant.maxTeamMembers}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Create New Organization</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={newTenant.contactEmail} onChange={(e) => setNewTenant({ ...newTenant, contactEmail: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
