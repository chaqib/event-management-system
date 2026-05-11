import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import BookingsPage from './pages/BookingsPage';
import UsersPage from './pages/UsersPage';
import VenuesPage from './pages/VenuesPage';
import PaymentsPage from './pages/PaymentsPage';
import PromotionsPage from './pages/PromotionsPage';
import OrganizationPage from './pages/OrganizationPage';
import TeamPage from './pages/TeamPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTenantsPage from './pages/admin/AdminTenantsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminInvoicesPage from './pages/AdminInvoicesPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';

// Regular tenant users - not super admin
function TenantRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <>{children}</>;
}

// Super admin only
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/admin-login" replace />;
  if (user.role !== 'super_admin') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Tenant Portal */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<TenantRoute><Layout /></TenantRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<EventFormPage />} />
          <Route path="events/:id/edit" element={<EventFormPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="organization" element={<OrganizationPage />} />
          <Route path="team" element={<TeamPage />} />
        </Route>

        {/* Admin Portal */}
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/super-admin" element={<SuperAdminRoute><AdminLayout /></SuperAdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="tenants" element={<AdminTenantsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="invoices" element={<AdminInvoicesPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
