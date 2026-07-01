'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, Mail, Loader2, Server, Terminal, Lock } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AdminPortal() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // Simulated live security terminal log feed
  useEffect(() => {
    const defaultLogs = [
      'SYS: Initializing HomiePG Secure Kernel...',
      'NET: Firewall rules loaded successfully.',
      'SEC: Strict RBAC route filters engaged.',
      'DB: Cloud ledger sync established.',
      'MON: Platform heartbeat telemetry: ACTIVE'
    ];
    setLogs(defaultLogs);

    const logGenerator = setInterval(() => {
      const auditEvents = [
        `AUDIT: Checked route telemetry parameters.`,
        `SECURITY: Heartbeat handshake verified.`,
        `SYSTEM: Purged inactive session keys from heap.`,
        `NET: Port 443 listening, IP logs active.`,
        `MON: CPU load: ${(Math.random() * 8 + 1).toFixed(2)}%, memory usage: 42.1%`
      ];
      const randomEvent = auditEvents[Math.floor(Math.random() * auditEvents.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-4), `[${timestamp}] ${randomEvent}`]);
    }, 4500);

    return () => clearInterval(logGenerator);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setLogs(prev => [...prev, 'SECURITY: Handshake success. Redirecting to terminal...']);
        router.push('/dashboard/admin');
        router.refresh();
      } else {
        setError(data.error || 'Authentication rejected: Invalid admin access keys.');
      }
    } catch (err) {
      setError('System Error: Unable to complete authentication handshake.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative matrix style scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-20"></div>

      {/* Background glow grids */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 z-10">
        
        {/* Brand visual header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo className="w-14 h-14 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl" showText={false} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">HomiePG Security Gateway</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Restricted Admin Area / Direct Login
          </p>
        </div>

        {/* Portal card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold leading-relaxed animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Admin Token Identifier</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-600 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@homiepg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 text-white rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none transition-colors placeholder-zinc-700"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block">Security Credentials Passphrase</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-600 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter secret code key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 text-white rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none transition-colors placeholder-zinc-700"
                />
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all uppercase tracking-widest flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Initiate Secure Login
                </>
              )}
            </button>
          </form>
        </div>

        {/* Diagnostic log screen console */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-2 font-mono text-[9px] text-zinc-500 select-none">
          <div className="flex items-center gap-1.5 text-zinc-400 border-b border-zinc-800/50 pb-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold tracking-tight uppercase">Platform Diagnostic Logs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto animate-ping"></span>
          </div>
          <div className="space-y-1 leading-relaxed">
            {logs.map((log, idx) => (
              <div key={idx} className="truncate">
                <span className="text-zinc-600">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
