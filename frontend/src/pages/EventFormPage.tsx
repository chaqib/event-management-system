import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi, venuesApi } from '../services/api';
import toast from 'react-hot-toast';

const categories = ['conference', 'concert', 'sports', 'workshop', 'seminar', 'social', 'networking', 'exhibition', 'festival', 'other'];

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', shortDescription: '', category: 'other',
    startDate: '', endDate: '', timezone: 'UTC', venueId: '',
    isOnline: false, onlineUrl: '', maxCapacity: '',
    isFree: false, coverImageUrl: '', refundPolicy: '', currency: 'USD', tags: '',
  });

  useEffect(() => {
    venuesApi.getAll({ limit: 100 }).then(res => setVenues(res.data.venues || [])).catch(() => {});
    if (isEdit && id) {
      eventsApi.getById(id).then(res => {
        const e = res.data;
        setForm({
          title: e.title || '', description: e.description || '',
          shortDescription: e.shortDescription || '', category: e.category || 'other',
          startDate: e.startDate?.slice(0, 16) || '', endDate: e.endDate?.slice(0, 16) || '',
          timezone: e.timezone || 'UTC', venueId: e.venueId || '',
          isOnline: e.isOnline || false, onlineUrl: e.onlineUrl || '',
          maxCapacity: e.maxCapacity?.toString() || '', isFree: e.isFree || false,
          coverImageUrl: e.coverImageUrl || '', refundPolicy: e.refundPolicy || '',
          currency: e.currency || 'USD', tags: e.tags?.join(', ') || '',
        });
      }).catch(() => toast.error('Event not found'));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      venueId: form.venueId || undefined,
    };

    try {
      if (isEdit && id) {
        await eventsApi.update(id, payload);
        toast.success('Event updated');
      } else {
        await eventsApi.create(payload);
        toast.success('Event created');
      }
      navigate('/events');
    } catch {
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Event' : 'Create Event'}</h1>
        <p className="mt-1 text-sm text-gray-500">Fill in the details below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Title *</label>
          <input type="text" required value={form.title} onChange={e => update('title', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Short Description</label>
          <input type="text" value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} maxLength={500} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Description</label>
          <textarea rows={5} value={form.description} onChange={e => update('description', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none capitalize">
              {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="tech, ai, startup" className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input type="datetime-local" required value={form.startDate} onChange={e => update('startDate', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date *</label>
            <input type="datetime-local" required value={form.endDate} onChange={e => update('endDate', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
        </div>

        {/* Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Venue</label>
            <select value={form.venueId} onChange={e => update('venueId', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none">
              <option value="">Select venue (optional)</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name} - {v.city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Capacity</label>
            <input type="number" value={form.maxCapacity} onChange={e => update('maxCapacity', e.target.value)} min={1} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
        </div>

        {/* Online / Free toggles */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isOnline} onChange={e => update('isOnline', e.target.checked)} className="rounded border-gray-300" />
            Online Event
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFree} onChange={e => update('isFree', e.target.checked)} className="rounded border-gray-300" />
            Free Event
          </label>
        </div>

        {form.isOnline && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Online URL</label>
            <input type="url" value={form.onlineUrl} onChange={e => update('onlineUrl', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
        )}

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Cover Image URL</label>
          <input type="url" value={form.coverImageUrl} onChange={e => update('coverImageUrl', e.target.value)} className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/events')} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
