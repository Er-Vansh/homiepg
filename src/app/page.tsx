'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Search, MapPin, ShieldCheck, Calendar, ArrowRight, Award, CheckCircle2, Home, Clock, Zap, Heart } from 'lucide-react';

export default function LandingPage() {
  const [cityInput, setCityInput] = useState('');
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* Brand Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10" showText={true} darkText={true} />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/search" className="text-sm font-semibold hover:text-[#0d55c8] dark:hover:text-blue-400 transition-colors hidden sm:block">
            Explore Listings
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-extrabold text-[#0d55c8] dark:text-blue-400 hover:underline">
                Dashboard &rarr;
              </Link>
              <button 
                onClick={async () => {
                  const res = await fetch('/api/auth/logout', { method: 'POST' });
                  if (res.ok) {
                    setUser(null);
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-sm font-bold shadow-sm hover:bg-rose-50/10 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold hover:text-[#0d55c8] dark:hover:text-blue-400 transition-colors">Sign In</Link>
              <Link 
                href="/login?register=true" 
                className="px-4 py-2 bg-[#0d55c8] text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all hover:scale-[1.02]"
              >
                Find Your Stay
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-8 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-[#0d55c8] dark:text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          <Award className="w-3.5 h-3.5 text-emerald-500" /> India's First Real-Time Bed Selector
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white max-w-4xl leading-[1.1]">
          Coliving Accommodations, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0d55c8] to-emerald-500">Booked Instantly.</span>
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl font-medium">
          Say goodbye to random visits and hidden pricing. HomiePG provides direct floor plans, live seat booking charts, and complete digital KYC for easy move-ins.
        </p>

        {/* Hero Search Box */}
        <div className="w-full max-w-2xl p-2 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-2 flex-1 w-full border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800">
            <MapPin className="text-[#0d55c8] w-5 h-5 flex-shrink-0" />
            <input 
              type="text"
              placeholder="Search City (Noida, Bangalore, Pune...)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="bg-transparent outline-none border-none w-full text-sm font-semibold placeholder-zinc-400"
            />
          </div>
          <Link
            href={`/search?city=${cityInput}`}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#0d55c8] hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 group transition-all"
          >
            Find Bed
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl pt-12 border-t border-zinc-200/60 dark:border-zinc-900/60">
          {[
            { value: '3+', label: 'Metro Cities' },
            { value: '25+', label: 'Verified PGs' },
            { value: '98%', label: 'Occupancy Rate' },
            { value: '₹6K+', label: 'Starting Rent' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <h3 className="text-3xl font-black text-[#0d55c8] dark:text-blue-400">{stat.value}</h3>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tenant Benefits Grid Section (Original structure but themed and Tenant-focused) */}
      <section className="bg-zinc-100 dark:bg-zinc-900/40 py-20 px-6">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-[#0d55c8] uppercase tracking-widest">Designed For Renters & Students</span>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">HomiePG Tenant Experience</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              Everything you need to find, reserve, and stay in verified paying guest accommodations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Benefit Card 1 */}
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm space-y-4 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#0d55c8] flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Cinema Bed Picker</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                View room shapes and share details dynamically. Pick your exact bed slot (Green for available) and reserve it instantly with a simple deposit upload.
              </p>
            </div>

            {/* Benefit Card 2 */}
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm space-y-4 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Safe Digital KYC</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Securely upload Aadhaar or PAN files. View verification status and access signed rental agreements instantly on your mobile phone dashboard.
              </p>
            </div>

            {/* Benefit Card 3 */}
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm space-y-4 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Automatic Rent Bills</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Check itemized monthly invoices (Base rent, electricity bill, Wi-Fi). Pay online easily and download clean PDF transaction receipts directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding Banner */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/80 px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" showText={false} />
            <span className="font-extrabold text-sm text-zinc-900 dark:text-white">HomiePG</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            "Your Home Away From Home."
          </div>

          <p className="text-xs text-zinc-400">&copy; 2026 HomiePG Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
