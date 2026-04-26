import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, workspacesApi, User, Workspace } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any;
  login: (token: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedToken = localStorage.getItem('rp_auth_token');
    if (savedToken) {
      setToken(savedToken);
    }
    setIsInitialized(true);
  }, []);

  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => authApi.getMe(),
    enabled: !!token && isInitialized,
    retry: false,
  });

  const login = (newToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rp_auth_token', newToken);
    }
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ['auth-me'] });
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rp_auth_token');
      window.location.href = '/';
    }
    setToken(null);
    queryClient.setQueryData(['auth-me'], null);
  };

  useEffect(() => {
    if (error) {
      // If unauthorized, clear token
      const apiErr = error as any;
      if (apiErr.error?.code === 'UNAUTHORIZED' || apiErr.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('rp_auth_token');
        }
        setToken(null);
      }
    }
  }, [error]);

  const authContextValue = {
    user: authData?.user ?? null,
    workspace: authData?.active_workspace ?? null,
    isAuthenticated: !!authData?.user,
    isLoading: !isInitialized || (!!token && isLoading),
    error,
    login,
    logout,
    refresh: async () => { await refetch(); },
    switchWorkspace: async (workspaceId: string) => {
      const res = await workspacesApi.switch(workspaceId);
      if (res.access_token) {
        login(res.access_token);
      }
    },
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
