import { useEffect, useState } from 'react';
import { bookingsApi } from '../services/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  refunded: 'bg-purple-100 text-purple-700',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await bookingsApi.getAll(params);
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const handleConfirm = async (id: string) => {
    try {
      await bookingsApi.confirm(id);
      toast.success('Booking confirmed');
      fetchBookings();
    } catch {
      toast.error('Failed to confirm booking');
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await bookingsApi.checkIn(id);
      toast.success('Checked in successfully');
      fetchBookings();
    } catch {
      toast.error('Failed to check in');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all bookings and check-ins</p>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Booking #</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Check-in</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No bookings found</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{b.bookingNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{b.event?.title || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{b.user?.firstName} {b.user?.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{b.quantity}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">${b.totalAmount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {b.checkedIn ? <span className="text-green-600">✓ Checked In</span> : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {b.status === 'pending' && (
                      <button onClick={() => handleConfirm(b.id)} className="text-sm text-green-600 hover:text-green-800">Confirm</button>
                    )}
                    {b.status === 'confirmed' && !b.checkedIn && (
                      <button onClick={() => handleCheckIn(b.id)} className="text-sm text-primary-600 hover:text-primary-800">Check In</button>
                    )}
                  </div>
                </td>
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
