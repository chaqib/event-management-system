import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../services/api';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  currentAttendees: number;
  isFree: boolean;
  minPrice: number;
  viewCount: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-700',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await eventsApi.getAll(params);
      setEvents(data.events);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handlePublish = async (id: string) => {
    try {
      await eventsApi.publish(id);
      toast.success('Event published');
      fetchEvents();
    } catch {
      toast.error('Failed to publish event');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return;
    try {
      await eventsApi.cancel(id);
      toast.success('Event cancelled');
      fetchEvents();
    } catch {
      toast.error('Failed to cancel event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    try {
      await eventsApi.delete(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all events on the platform</p>
        </div>
        <Link to="/events/new" className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
          + Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-white p-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="flex-1 rounded-lg border px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Views</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No events found</td></tr>
            ) : events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{event.title}</div>
                </td>
                <td className="px-6 py-4 text-sm capitalize text-gray-600">{event.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(event.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[event.status] || 'bg-gray-100 text-gray-700'}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {event.isFree ? 'Free' : `$${event.minPrice}`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{event.viewCount}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/events/${event.id}/edit`} className="text-sm text-primary-600 hover:text-primary-800">Edit</Link>
                    {event.status === 'draft' && (
                      <button onClick={() => handlePublish(event.id)} className="text-sm text-green-600 hover:text-green-800">Publish</button>
                    )}
                    {event.status === 'published' && (
                      <button onClick={() => handleCancel(event.id)} className="text-sm text-orange-600 hover:text-orange-800">Cancel</button>
                    )}
                    <button onClick={() => handleDelete(event.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
