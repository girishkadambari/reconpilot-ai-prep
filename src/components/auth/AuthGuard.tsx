import { useNavigate } from '@tanstack/react-router';
import { useAuth } from './AuthContext';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <div className="text-[13px] text-muted-foreground animate-pulse">Loading ReconPilot...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
