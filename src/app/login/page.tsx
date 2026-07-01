'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, UserPlus, KeyRound, Mail, User as UserIcon, Building, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold tracking-wider">Loading auth portal...</span>
      </div>
    }>
      <LoginFormComponent />
    </React.Suspense>
  );
}

function LoginFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerParam = searchParams.get('register') === 'true';

  const [isRegister, setIsRegister] = useState(registerParam);
  const role = 'USER';

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setIsRegister(searchParams.get('register') === 'true');
    const roleParam = searchParams.get('role');
    if (roleParam === 'OWNER') {
      router.push('/pgowner');
    }
    const errParam = searchParams.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
    }
  }, [searchParams, router]);

  const handleDemoLogin = () => {
    setError('');
    setSuccess('');
    setEmail('user@homiepg.com');
    setPassword('Password123');
  };

  const handleGoogleAuth = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister 
      ? { email, password, name, role: 'USER', phone }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(isRegister ? 'Registration successful! Logging in...' : 'Welcome back! Redirecting...');
      
      // Delay routing to let user see success state
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Connection failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-indigo-500 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
        <div className="flex justify-center mb-4">
          <Logo className="w-10 h-10" showText={false} />
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          {isRegister ? 'Create your account' : 'Sign in to HomiePG'}
        </h2>
        <p className="text-center text-xs text-zinc-500 mt-2 font-medium">
          Secure JWT Session • Role Based Access Controls
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-6">
          
          {/* Action Tabs Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/40 dark:border-zinc-700/20">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${!isRegister ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${isRegister ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500'}`}
            >
              Register
            </button>
          </div>

          {!isRegister && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
              <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Demo Account Quick-Fill</span>
              <button 
                type="button"
                onClick={handleDemoLogin}
                className="w-full px-2 py-1.5 bg-zinc-200 hover:bg-indigo-500 hover:text-white dark:bg-zinc-800/50 rounded-md text-[10px] font-bold text-zinc-600 dark:text-zinc-300 text-center transition-all cursor-pointer"
              >
                Tenant User Demo
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration specific fields */}
            {isRegister && (
              <>
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-600 placeholder-zinc-400"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +919988776655"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-600 placeholder-zinc-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 block">Security Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 mt-6 transition-all hover:scale-[1.01]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs font-semibold uppercase">
              <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In / Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-3 border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isRegister ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

        </div>
      </div>
    </div>
  );
}
