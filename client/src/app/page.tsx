'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('neo_access_token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-neo-black)' }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-neo-accent)', animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-neo-accent)', animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-neo-accent)', animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
