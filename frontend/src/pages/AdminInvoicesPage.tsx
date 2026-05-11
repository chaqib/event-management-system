import { useState, useEffect } from 'react';
import { invoicesApi } from '../services/api';
import toast from 'react-hot-toast';
import InvoiceList from '../components/InvoiceList';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import PaymentRecordingModal from '../components/PaymentRecordingModal';

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

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPendingInvoices();
  }, [page, statusFilter]);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesApi.getPendingInvoices(page, 20);
      if (response.data.invoices) {
        setInvoices(response.data.invoices);
        setTotalPages(Math.ceil(response.data.total / 20));
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (data: any) => {
    try {
      await invoicesApi.create(data);
      toast.success('Invoice created successfully');
      setShowCreateModal(false);
      loadPendingInvoices();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const handleApproveInvoice = async (id: string) => {
    try {
      await invoicesApi.approve(id);
      toast.success('Invoice approved');
      loadPendingInvoices();
    } catch (error) {
      toast.error('Failed to approve invoice');
    }
  };

  const handleSendInvoice = async (id: string, email: string) => {
    try {
      await invoicesApi.send(id, email);
      toast.success('Invoice sent to ' + email);
      loadPendingInvoices();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleRecordPayment = async (paymentData: any) => {
    if (!selectedInvoice) return;
    try {
      await invoicesApi.recordPayment(selectedInvoice.id, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      loadPendingInvoices();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleRefund = async (id: string, amount: number, reason: string) => {
    try {
      await invoicesApi.refund(id, { amount, reason });
      toast.success('Refund issued successfully');
      loadPendingInvoices();
    } catch (error) {
      toast.error('Failed to issue refund');
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      await invoicesApi.cancel(id, { reason });
      toast.success('Invoice cancelled');
      loadPendingInvoices();
    } catch (error) {
      toast.error('Failed to cancel invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💳 Invoice Management</h1>
          <p className="mt-2 text-gray-600">Create and track manual payment invoices</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          + New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'pending', 'partial', 'paid', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading invoices...</div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No invoices found</p>
        </div>
      ) : (
        <InvoiceList
          invoices={invoices}
          onApprove={handleApproveInvoice}
          onSend={handleSendInvoice}
          onRecordPayment={(invoice) => {
            setSelectedInvoice(invoice);
            setShowPaymentModal(true);
          }}
          onRefund={handleRefund}
          onCancel={handleCancel}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg bg-gray-200 px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-gray-200 px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateInvoice}
        />
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentRecordingModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleRecordPayment}
        />
      )}
    </div>
  );
}
