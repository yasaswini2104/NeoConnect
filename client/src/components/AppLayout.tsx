'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-neo-black)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: 'var(--color-neo-accent)', animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: 'var(--color-neo-accent)', animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: 'var(--color-neo-accent)', animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-neo-black)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
