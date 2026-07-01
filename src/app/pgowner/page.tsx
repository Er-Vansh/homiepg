'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, KeyRound, Mail, Loader2, Server, Terminal, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function PgOwnerPortal() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // Load any error parameters from the search params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errParam = params.get('error');
      if (errParam) {
        setError(decodeURIComponent(errParam));
      }
    }
  }, []);

  // Simulated live ERP audit logs feed
  useEffect(() => {
    const defaultLogs = [
      'SYS: Initializing HomiePG Owner ERP Kernel...',
      'PROP: Syncing building metadata and room arrays...',
      'FIN: Digital rent ledger reconciliation active.',
      'SMS: Automated resident alert channels ready.',
      'MON: Owner ERP dashboard heartbeat: ACTIVE'
    ];
    setLogs(defaultLogs);

    const logGenerator = setInterval(() => {
      const erpEvents = [
        `ERP: Synced ledger payments. Checked database state.`,
        `COMPLIANCE: Verified resident KYC documentation state.`,
        `AUDIT: Refreshed room vacancy data.`,
        `MON: Active resident network usage: Normal`,
        `DB: Database write lock: RELEASED`,
        `LEDGER: Generated invoice audit logs.`
      ];
      const randomEvent = erpEvents[Math.floor(Math.random() * erpEvents.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-4), `[${timestamp}] ${randomEvent}`]);
    }, 4000);

    return () => clearInterval(logGenerator);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/owner/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setLogs(prev => [...prev, 'ERP: Auth handshake success. Transitioning to ERP workspace...']);
        router.push('/dashboard/owner');
        router.refresh();
      } else {
        setError(data.error || 'Authentication rejected: Invalid owner credentials.');
      }
    } catch (err) {
      setError('ERP Link Error: Unable to verify credentials with auth cluster.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('owner@homiepg.com');
    setPassword('Password123');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background glow grids */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 z-10">
        
        {/* Brand visual header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo className="w-14 h-14 bg-white border border-zinc-200 p-2 rounded-2xl shadow-sm" showText={false} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">HomiePG Owner ERP Portal</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center justify-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-600" />
            Restricted Property Management Access
          </p>
        </div>

        {/* Portal card */}
        <div className="bg-white border border-zinc-200 shadow-xl p-6 space-y-6 rounded-2xl">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Owner Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="owner@homiepg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-emerald-600 text-zinc-900 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none transition-colors placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Security Credentials Passphrase</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-emerald-600 text-zinc-900 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none transition-colors placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Server className="w-4 h-4 shrink-0" />
                  Initiate ERP Connection
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Assist Login Buttons */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/85 space-y-2">
            <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Demo Account Quick-Fill</span>
            <button 
              type="button"
              onClick={handleDemoFill}
              className="w-full px-2 py-1.5 bg-zinc-200 hover:bg-emerald-600 hover:text-white rounded-md text-[10px] font-bold text-zinc-600 text-center transition-all cursor-pointer"
            >
              PG Owner ERP Demo
            </button>
          </div>

        </div>

        {/* Diagnostic log screen console */}
        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-4 space-y-2 font-mono text-[9px] text-zinc-500 select-none">
          <div className="flex items-center gap-1.5 text-zinc-600 border-b border-zinc-200 pb-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold tracking-tight uppercase">ERP Diagnostic Logs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto animate-ping"></span>
          </div>
          <div className="space-y-1 leading-relaxed">
            {logs.map((log, idx) => (
              <div key={idx} className="truncate">
                <span className="text-zinc-400">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
