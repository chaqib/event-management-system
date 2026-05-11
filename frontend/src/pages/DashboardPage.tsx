import { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';

interface DashboardData {
  users: { total: number; attendees: number; organizers: number; admins: number };
  events: { total: number; published: number; draft: number; cancelled: number; completed: number };
  bookings: { total: number; confirmed: number; cancelled: number; totalRevenue: number };
  revenue: { totalRevenue: string; totalTransactions: string };
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(res => setData(res.data))
      .catch(() => {
        // Set default values if API fails
        setData({
          users: { total: 0, attendees: 0, organizers: 0, admins: 0 },
          events: { total: 0, published: 0, draft: 0, cancelled: 0, completed: 0 },
          bookings: { total: 0, confirmed: 0, cancelled: 0, totalRevenue: 0 },
          revenue: { totalRevenue: '0', totalTransactions: '0' },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your event management platform</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={data?.users.total || 0} icon="👥" color="bg-blue-50" />
        <StatCard title="Total Events" value={data?.events.total || 0} icon="🎪" color="bg-green-50" />
        <StatCard title="Total Bookings" value={data?.bookings.total || 0} icon="🎫" color="bg-purple-50" />
        <StatCard
          title="Total Revenue"
          value={`$${Number(data?.revenue.totalRevenue || 0).toLocaleString()}`}
          icon="💰"
          color="bg-yellow-50"
        />
      </div>

      {/* Secondary Stats */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Events Breakdown */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Events Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">{data?.events.published || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Draft</span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">{data?.events.draft || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">{data?.events.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">{data?.events.cancelled || 0}</span>
            </div>
          </div>
        </div>

        {/* Users Breakdown */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Users Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Attendees</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">{data?.users.attendees || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Organizers</span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">{data?.users.organizers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Admins</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{data?.users.admins || 0}</span>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Bookings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmed</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">{data?.bookings.confirmed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">{data?.bookings.cancelled || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue from Bookings</span>
              <span className="font-semibold text-gray-900">${(data?.bookings.totalRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/events/new" className="flex items-center gap-2 rounded-lg bg-primary-50 p-3 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors">
              ➕ Create Event
            </a>
            <a href="/venues" className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors">
              📍 Add Venue
            </a>
            <a href="/promotions" className="flex items-center gap-2 rounded-lg bg-purple-50 p-3 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors">
              🏷️ Create Promo
            </a>
            <a href="/users" className="flex items-center gap-2 rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors">
              👥 Manage Users
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
