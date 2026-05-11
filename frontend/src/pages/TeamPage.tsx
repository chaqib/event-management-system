import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tenantsApi } from '../services/api';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', desc: 'Full management access' },
  { value: 'manager', label: 'Manager', desc: 'Manage events and bookings' },
  { value: 'event_coordinator', label: 'Event Coordinator', desc: 'Create and manage events' },
  { value: 'finance', label: 'Finance', desc: 'View payments and reports' },
  { value: 'support', label: 'Support', desc: 'Handle bookings and customers' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
];

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  event_coordinator: 'bg-green-100 text-green-700',
  finance: 'bg-yellow-100 text-yellow-700',
  support: 'bg-orange-100 text-orange-700',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function TeamPage() {
  const { activeTenant } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (activeTenant) loadMembers();
    else setLoading(false);
  }, [activeTenant]);

  const loadMembers = async () => {
    if (!activeTenant) return;
    try {
      const { data } = await tenantsApi.getMembers(activeTenant.id);
      setMembers(data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    setInviting(true);
    try {
      await tenantsApi.inviteMember(activeTenant.id, inviteForm);
      toast.success('Member invited!');
      setShowInvite(false);
      setInviteForm({ email: '', role: 'viewer' });
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    if (!activeTenant) return;
    try {
      await tenantsApi.updateMemberRole(activeTenant.id, memberId, { role });
      toast.success('Role updated');
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!activeTenant || !confirm(`Remove ${name} from the team?`)) return;
    try {
      await tenantsApi.removeMember(activeTenant.id, memberId);
      toast.success('Member removed');
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (!activeTenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Create an organization first to manage your team.</p>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage members and roles for {activeTenant.name}</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          + Invite Member
        </button>
      </div>

      {/* Roles Legend */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Roles</h3>
        <div className="flex flex-wrap gap-2">
          {[{ value: 'owner', label: 'Owner', desc: 'Full control, billing' }, ...ROLE_OPTIONS].map((r) => (
            <span key={r.value} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[r.value]}`} title={r.desc}>
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{m.user?.firstName} {m.user?.lastName}</p>
                    <p className="text-sm text-gray-500">{m.user?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {m.tenantRole === 'owner' ? (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS.owner}`}>Owner</span>
                  ) : (
                    <select
                      value={m.tenantRole}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-sm"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  {m.tenantRole !== 'owner' && (
                    <button
                      onClick={() => handleRemove(m.id, `${m.user?.firstName} ${m.user?.lastName}`)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">No team members yet. Invite someone to get started!</div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="user@example.com" />
                <p className="text-xs text-gray-400 mt-1">User must have an existing account</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
