import { useEffect, useState } from 'react';
import { venuesApi } from '../services/api';
import toast from 'react-hot-toast';

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', country: '', capacity: '', contactEmail: '' });

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data } = await venuesApi.getAll({ limit: 50 });
      setVenues(data.venues);
    } catch {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVenues(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await venuesApi.create({ ...form, capacity: form.capacity ? Number(form.capacity) : undefined });
      toast.success('Venue created');
      setShowForm(false);
      setForm({ name: '', address: '', city: '', country: '', capacity: '', contactEmail: '' });
      fetchVenues();
    } catch {
      toast.error('Failed to create venue');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this venue?')) return;
    try {
      await venuesApi.delete(id);
      toast.success('Venue deleted');
      fetchVenues();
    } catch {
      toast.error('Failed to delete venue');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
          <p className="mt-1 text-sm text-gray-500">Manage event venues</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          {showForm ? 'Cancel' : '+ Add Venue'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" required placeholder="Venue name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="text" required placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="text" required placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="text" required placeholder="Country" value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
            <input type="email" placeholder="Contact email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} className="rounded-lg border px-4 py-2.5 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700">Save Venue</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <p className="text-gray-500">Loading...</p> : venues.map(v => (
          <div key={v.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900">{v.name}</h3>
              <button onClick={() => handleDelete(v.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{v.address}</p>
            <p className="text-sm text-gray-500">{v.city}, {v.country}</p>
            {v.capacity && <p className="mt-2 text-xs text-gray-400">Capacity: {v.capacity}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
