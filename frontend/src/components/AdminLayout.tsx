import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const adminNavigation = [
  { name: 'Dashboard', href: '/super-admin', icon: '📊' },
  { name: 'Tenants', href: '/super-admin/tenants', icon: '🏢' },
  { name: 'Users', href: '/super-admin/users', icon: '👥' },
  { name: 'Invoices', href: '/super-admin/invoices', icon: '💳' },
  { name: 'Billing', href: '/super-admin/billing', icon: '💰' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-800">
          <span className="text-2xl">🔧</span>
          <div>
            <h1 className="text-lg font-bold text-white">EventMS</h1>
            <p className="text-xs text-purple-400">Admin Panel</p>
          </div>
        </div>

        <nav className="mt-6 space-y-1 px-3">
          {adminNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/super-admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-3">
          <div className="rounded-lg bg-gray-800 p-3">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-purple-400">Super Admin</p>
          </div>
        </div>
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

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-600">Platform Management System</span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
