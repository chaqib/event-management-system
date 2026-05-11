import { useState } from 'react';
import { formatCurrency } from '../utils/formatting';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  currency: string;
  status: string;
}

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function PaymentRecordingModal({ invoice, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const remainingAmount = invoice.amount - invoice.amountPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    if (paymentAmount > remainingAmount) {
      alert(`Amount cannot exceed remaining balance of ${formatCurrency(remainingAmount)}`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        amount: paymentAmount,
        referenceNumber,
        notes,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
        <p className="mt-1 text-sm text-gray-600">Invoice {invoice.invoiceNumber}</p>

        {/* Invoice Summary */}
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Already Paid:</span>
              <span className="font-medium">{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-base">
              <span className="font-medium">Remaining:</span>
              <span className="font-bold text-primary-600">
                {formatCurrency(remainingAmount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-gray-600">{invoice.currency}</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {amount && (
              <p className="mt-1 text-xs text-gray-500">
                Remaining after: {formatCurrency(remainingAmount - parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., TXN-12345, CHK-5678"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Wire transfer ID, check number, or payment reference
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this payment..."
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

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
              disabled={loading || !amount}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
