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
  const [role, setRole] = useState<'USER' | 'OWNER'>('USER');

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setIsRegister(searchParams.get('register') === 'true');
    const roleParam = searchParams.get('role');
    if (roleParam === 'OWNER' || roleParam === 'USER') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleDemoLogin = (demoRole: 'owner' | 'tenant') => {
    setError('');
    setSuccess('');
    if (demoRole === 'owner') {
      setEmail('owner@homiepg.com');
      setPassword('Password123');
    } else {
      setEmail('user@homiepg.com');
      setPassword('Password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister 
      ? { email, password, name, role, phone, companyName: role === 'OWNER' ? companyName : undefined }
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

          {/* Quick Demo Assist Login Buttons */}
          {!isRegister && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
              <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Demo Account Quick-Fill</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleDemoLogin('owner')}
                  className="px-2 py-1.5 bg-zinc-200 hover:bg-indigo-500 hover:text-white dark:bg-zinc-800/50 rounded-md text-[10px] font-bold text-zinc-600 dark:text-zinc-300 text-center transition-all"
                >
                  PG Owner ERP Demo
                </button>
                <button 
                  onClick={() => handleDemoLogin('tenant')}
                  className="px-2 py-1.5 bg-zinc-200 hover:bg-indigo-500 hover:text-white dark:bg-zinc-800/50 rounded-md text-[10px] font-bold text-zinc-600 dark:text-zinc-300 text-center transition-all"
                >
                  Tenant User Demo
                </button>
              </div>
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
                {/* Role Toggle Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 block">I want to register as a:</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('USER')}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        role === 'USER' 
                          ? 'border-indigo-600 bg-indigo-500/5 text-indigo-600' 
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" /> Renter / Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('OWNER')}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        role === 'OWNER' 
                          ? 'border-indigo-600 bg-indigo-500/5 text-indigo-600' 
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" /> PG Owner
                    </button>
                  </div>
                </div>

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

                {/* Company Name (only for Owner) */}
                {role === 'OWNER' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 block">Company Name</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Elite Co-living Co."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-indigo-600 placeholder-zinc-400"
                      />
                    </div>
                  </div>
                )}
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

        </div>
      </div>
    </div>
  );
}
