import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe extraction in SSR Next.js
  const isClient = typeof window !== 'undefined';
  const initialToken = isClient ? localStorage.getItem('token') : null;
  const initialUser = isClient ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    isLoading: false,
    error: null,
    setToken: (token) => {
      if (isClient) {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
      }
      set({ token, isAuthenticated: !!token });
    },
    setUser: (user) => {
      if (isClient) {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
      }
      set({ user });
    },
    login: (token, user) => {
      if (isClient) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true, error: null });
    },
    logout: () => {
      if (isClient) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      set({ token: null, user: null, isAuthenticated: false, error: null });
    }
  };
});
