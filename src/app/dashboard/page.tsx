'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRouter() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!res.ok || !data.authenticated) {
          router.push('/login');
          return;
        }

        const role = data.user.role;
        if (role === 'SUPER_ADMIN') {
          router.push('/dashboard/admin');
        } else if (role === 'OWNER') {
          router.push('/dashboard/owner');
        } else if (role === 'USER') {
          router.push('/dashboard/user');
        } else {
          setError('Invalid user role configuration.');
        }
      } catch (e) {
        console.error('Session validation check failed', e);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
          {error}
        </div>
      ) : (
        <>
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-zinc-500 font-semibold tracking-wider">Verifying security token and permissions...</span>
        </>
      )}
    </div>
  );
}
