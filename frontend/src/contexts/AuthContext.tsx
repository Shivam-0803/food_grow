import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, type User } from '@/lib/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('foodflow_token');
    const saved = localStorage.getItem('foodflow_user');
    if (saved) setUser(JSON.parse(saved));
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('foodflow_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('foodflow_token');
        localStorage.removeItem('foodflow_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('foodflow_token', data.token);
    localStorage.setItem('foodflow_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role = 'store_manager') => {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('foodflow_token', data.token);
      localStorage.setItem('foodflow_user', JSON.stringify(data.user));
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('foodflow_token');
    localStorage.removeItem('foodflow_user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
