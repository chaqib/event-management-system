import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Events', href: '/events', icon: '🎪' },
  { name: 'Bookings', href: '/bookings', icon: '🎫' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Venues', href: '/venues', icon: '📍' },
  { name: 'Payments', href: '/payments', icon: '💳' },
  { name: 'Promotions', href: '/promotions', icon: '🏷️' },
  { name: 'Organization', href: '/organization', icon: '🏢' },
  { name: 'Team', href: '/team', icon: '👤' },
];

export default function Layout() {
  const { user, logout, tenants, activeTenant, switchTenant } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-800">
          <span className="text-2xl">🎉</span>
          <h1 className="text-lg font-bold text-white">EventMS</h1>
        </div>

        {/* Tenant Selector */}
        {tenants.length > 0 && (
          <div className="px-3 py-3 border-b border-gray-800">
            <select
              value={activeTenant?.id || ''}
              onChange={(e) => switchTenant(e.target.value)}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {activeTenant && (
              <div className="mt-1.5 flex items-center gap-2 px-1">
                <span className="text-xs text-gray-500 capitalize">{activeTenant.role.replace('_', ' ')}</span>
                <span className="text-xs text-gray-600">•</span>
                <span className="text-xs text-primary-400 uppercase">{activeTenant.plan.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        )}

        <nav className="mt-4 space-y-1 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
