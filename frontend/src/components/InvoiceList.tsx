import { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  amount: number;
  amountPaid: number;
  currency: string;
  status: string;
  dueDate?: string;
  createdAt: string;
  tenant?: { name: string; slug: string };
}

interface Props {
  invoices: Invoice[];
  onApprove: (id: string) => void;
  onSend: (id: string, email: string) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onRefund: (id: string, amount: number, reason: string) => void;
  onCancel: (id: string, reason: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-purple-100 text-purple-800',
};

const paymentTypeEmoji: Record<string, string> = {
  invoice: '📄',
  bank_transfer: '🏦',
  check: '✓',
  cash: '💵',
  wire_transfer: '💸',
  other: '📌',
};

export default function InvoiceList({
  invoices,
  onApprove,
  onSend,
  onRecordPayment,
  onRefund,
  onCancel,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invoice</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tenant</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Paid</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {paymentTypeEmoji[invoice.status] || '📄'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{formatDate(invoice.createdAt)}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-700">{invoice.tenant?.name || 'Unknown'}</div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="font-medium text-gray-900">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(invoice.amountPaid, invoice.currency)}
                  </div>
                  {invoice.amount > 0 && (
                    <div className="h-1.5 w-20 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${Math.min((invoice.amountPaid / invoice.amount) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {invoice.dueDate ? (
                  <div className="text-sm text-gray-700">{formatDate(invoice.dueDate)}</div>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    statusColors[invoice.status]
                  }`}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                    className="text-gray-600 hover:text-primary-600"
                    title="More actions"
                  >
                    ⋮
                  </button>
                </div>

                {/* Expandable Actions */}
                {expandedId === invoice.id && (
                  <div className="absolute right-4 top-20 z-50 rounded-lg border border-gray-200 bg-white shadow-lg">
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => {
                          onApprove(invoice.id);
                          setExpandedId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        ✓ Approve
                      </button>
                    )}

                    {invoice.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            const email = prompt('Enter tenant email:');
                            if (email) {
                              onSend(invoice.id, email);
                              setExpandedId(null);
                            }
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          📧 Send Email
                        </button>
                        <hr />
                      </>
                    )}

                    {(invoice.status === 'pending' ||
                      invoice.status === 'partial' ||
                      invoice.status === 'overdue') && (
                      <button
                        onClick={() => {
                          onRecordPayment(invoice);
                          setExpandedId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        💰 Record Payment
                      </button>
                    )}

                    {invoice.status === 'paid' && (
                      <button
                        onClick={() => {
                          const amount = prompt('Refund amount:');
                          const reason = prompt('Reason:');
                          if (amount && reason) {
                            onRefund(invoice.id, parseFloat(amount), reason);
                            setExpandedId(null);
                          }
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        ↩️ Refund
                      </button>
                    )}

                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          const reason = prompt('Cancellation reason:');
                          if (reason) {
                            onCancel(invoice.id, reason);
                            setExpandedId(null);
                          }
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
