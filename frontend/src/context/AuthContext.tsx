import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, tenantsApi } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  tenants: TenantInfo[];
  activeTenant: TenantInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [activeTenant, setActiveTenant] = useState<TenantInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    const savedTenants = localStorage.getItem('tenants');
    const savedActiveTenantId = localStorage.getItem('activeTenantId');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      if (savedTenants) {
        const parsedTenants = JSON.parse(savedTenants);
        setTenants(parsedTenants);
        if (savedActiveTenantId) {
          const active = parsedTenants.find((t: TenantInfo) => t.id === savedActiveTenantId);
          if (active) setActiveTenant(active);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    // Store tenants
    const userTenants = data.tenants || [];
    localStorage.setItem('tenants', JSON.stringify(userTenants));
    setTenants(userTenants);

    // Auto-select first tenant if available
    if (userTenants.length > 0) {
      localStorage.setItem('activeTenantId', userTenants[0].id);
      setActiveTenant(userTenants[0]);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenants');
    localStorage.removeItem('activeTenantId');
    setUser(null);
    setTenants([]);
    setActiveTenant(null);
  };

  const switchTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      localStorage.setItem('activeTenantId', tenantId);
      setActiveTenant(tenant);
    }
  };

  const refreshTenants = async () => {
    try {
      const { data } = await tenantsApi.getMyTenants();
      const userTenants = data.map((m: any) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        logo: m.tenant.logo,
        role: m.tenantRole,
        plan: m.tenant.subscriptionPlan,
      }));
      localStorage.setItem('tenants', JSON.stringify(userTenants));
      setTenants(userTenants);

      // Keep active tenant if still valid
      const activeTenantId = localStorage.getItem('activeTenantId');
      if (activeTenantId) {
        const active = userTenants.find((t: TenantInfo) => t.id === activeTenantId);
        if (active) setActiveTenant(active);
        else if (userTenants.length > 0) {
          localStorage.setItem('activeTenantId', userTenants[0].id);
          setActiveTenant(userTenants[0]);
        }
      }
    } catch {
      // Ignore errors during refresh
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, tenants, activeTenant, login, logout, switchTenant, refreshTenants }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
