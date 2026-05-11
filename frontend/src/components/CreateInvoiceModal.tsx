import { useState } from 'react';
import { tenantsApi } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onCreate: (data: any) => void;
}

export default function CreateInvoiceModal({ onClose, onCreate }: Props) {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [formData, setFormData] = useState({
    tenantId: '',
    paymentType: 'invoice',
    amount: '',
    dueDate: '',
    description: '',
    bankDetails: {
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      accountHolder: '',
    },
  });

  useState(() => {
    loadTenants();
  });

  const loadTenants = async () => {
    try {
      const response = await tenantsApi.getAll();
      if (response.data) {
        setTenants(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setTenantsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantId) {
      toast.error('Please select a tenant');
      return;
    }
    if (!formData.amount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        bankDetails:
          formData.paymentType === 'bank_transfer' ? formData.bankDetails : undefined,
      };
      await onCreate(submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Tenant Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tenant</label>
            {tenantsLoading ? (
              <div className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-gray-600">
                Loading tenants...
              </div>
            ) : (
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="invoice">Invoice</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="wire_transfer">Wire Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter invoice description..."
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Bank Details (show if bank transfer) */}
          {formData.paymentType === 'bank_transfer' && (
            <div className="space-y-3 rounded-lg bg-blue-50 p-3">
              <h3 className="font-medium text-gray-700">Bank Account Details</h3>
              <input
                type="text"
                placeholder="Account Number"
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                  })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Routing Number"
                value={formData.bankDetails.routingNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, routingNumber: e.target.value },
                  })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Bank Name"
                value={formData.bankDetails.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                  })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Account Holder"
                value={formData.bankDetails.accountHolder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountHolder: e.target.value },
                  })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
