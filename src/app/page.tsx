'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  Home, 
  Clock, 
  Zap, 
  Heart, 
  Wifi, 
  Coffee, 
  Sparkles, 
  Building, 
  Compass, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Logo } from '@/components/logo';

interface BuildingItem {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  baseRent: number;
  baseDeposit: number;
  amenities: string[];
  nearbyColleges: string[];
  nearbyMetro: string[];
  images: string[];
  rules: string[];
}

export default function LandingPage() {
  const router = useRouter();

  // Search filter states
  const [city, setCity] = useState('');
  const [sharing, setSharing] = useState('0'); // '0' means all
  const [gender, setGender] = useState(''); // '' means all

  // DB Data states
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<BuildingItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Load auth state and listings on mount
  useEffect(() => {
    // 1. Fetch user auth session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    // 2. Fetch live buildings list
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBuildings(data.buildings);
          setFilteredBuildings(data.buildings);
        }
      })
      .catch((e) => console.error('Failed to load buildings', e))
      .finally(() => setLoading(false));
  }, []);

  // Filter listings locally when clicking category tabs
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'all') {
      setFilteredBuildings(buildings);
    } else if (category === 'ac') {
      setFilteredBuildings(buildings.filter(b => b.amenities.some(a => a.toLowerCase().includes('ac'))));
    } else if (category === 'wifi') {
      setFilteredBuildings(buildings.filter(b => b.amenities.some(a => a.toLowerCase().includes('wi-fi') || a.toLowerCase().includes('wifi'))));
    } else if (category === 'food') {
      setFilteredBuildings(buildings.filter(b => b.amenities.some(a => a.toLowerCase().includes('food') || a.toLowerCase().includes('meals'))));
    } else if (category === 'washroom') {
      setFilteredBuildings(buildings.filter(b => b.amenities.some(a => a.toLowerCase().includes('washroom') || a.toLowerCase().includes('attached'))));
    } else if (category === 'gym') {
      setFilteredBuildings(buildings.filter(b => b.amenities.some(a => a.toLowerCase().includes('gym') || a.toLowerCase().includes('fitness'))));
    }
  };

  // Perform search redirect
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (city) query.set('city', city);
    if (sharing !== '0') query.set('sharing', sharing);
    if (gender) query.set('gender', gender);
    router.push(`/search?${query.toString()}`);
  };

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      setUser(null);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200">
      
      {/* Brand Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-zinc-200/50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10" showText={true} darkText={true} />
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/search" className="text-sm font-semibold hover:text-[#0d55c8] transition-colors hidden sm:block">
            Explore PGs
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-extrabold text-[#0d55c8] hover:underline">
                Dashboard &rarr;
              </Link>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-zinc-250 text-zinc-650 hover:text-rose-600 rounded-lg text-sm font-bold shadow-sm hover:bg-rose-50/20 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold hover:text-[#0d55c8] transition-colors">Sign In</Link>
              <Link 
                href="/login?register=true" 
                className="px-4 py-2 bg-[#0d55c8] hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/10 transition-all hover:scale-[1.02]"
              >
                Become a Resident
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative pt-16 pb-12 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-8 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/10 bg-blue-500/5 text-[#0d55c8] text-xs font-bold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5 text-emerald-500" /> India's First Real-Time Bed Selector
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 max-w-4xl leading-[1.15]">
          Coliving Accommodations, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0d55c8] to-emerald-500">Booked Instantly.</span>
        </h1>

        <p className="text-zinc-500 text-sm sm:text-base max-w-2xl font-semibold leading-relaxed">
          Skip generic brokers and hidden fees. HomiePG offers direct floor plans, live seat booking charts, and digital KYC verifying your move-in instantly.
        </p>

        {/* Premium Airbnb-Inspired Search Console panel */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="w-full max-w-3xl p-3 bg-white border border-zinc-200 shadow-2xl rounded-3xl flex flex-col md:flex-row items-center gap-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80"
        >
          {/* Location field */}
          <div className="flex items-center gap-3 px-4 py-2 flex-1 w-full text-left">
            <MapPin className="text-[#0d55c8] w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[9px] uppercase font-black text-zinc-400 block tracking-widest">Where</label>
              <input 
                type="text"
                placeholder="Search City (Noida, Bangalore...)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent outline-none border-none w-full text-xs font-semibold placeholder-zinc-400 text-zinc-800"
              />
            </div>
          </div>

          {/* Sharing selector */}
          <div className="flex items-center gap-3 px-4 py-2 w-full md:w-56 text-left">
            <Home className="text-emerald-500 w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[9px] uppercase font-black text-zinc-400 block tracking-widest">Room Type</label>
              <select 
                value={sharing}
                onChange={(e) => setSharing(e.target.value)}
                className="bg-transparent outline-none border-none w-full text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                <option value="0">All Sharing Models</option>
                <option value="1">Single Occupancy</option>
                <option value="2">Double Occupancy</option>
                <option value="3">Triple Occupancy</option>
              </select>
            </div>
          </div>

          {/* Gender filter */}
          <div className="flex items-center gap-3 px-4 py-2 w-full md:w-48 text-left">
            <Sparkles className="text-amber-500 w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[9px] uppercase font-black text-zinc-400 block tracking-widest">Category</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="bg-transparent outline-none border-none w-full text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                <option value="">All Cohorts</option>
                <option value="MALE">Boys Hostel</option>
                <option value="FEMALE">Girls Hostel</option>
                <option value="UNISEX">Co-ed Living</option>
              </select>
            </div>
          </div>

          {/* Search trigger button */}
          <div className="p-1 w-full md:w-auto">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3.5 bg-[#0d55c8] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 group transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search PGs</span>
            </button>
          </div>
        </form>
      </section>

      {/* Airbnb-style Horizontal Categories Scrollbar */}
      <div className="border-y border-zinc-200 bg-white/70 backdrop-blur-sm sticky top-[73px] z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'all', label: 'All PGs', icon: Building },
            { id: 'ac', label: 'AC Enabled', icon: Zap },
            { id: 'wifi', label: 'High-speed Wi-Fi', icon: Wifi },
            { id: 'food', label: 'Food Included', icon: Coffee },
            { id: 'washroom', label: 'Attached Washroom', icon: ShieldCheck },
            { id: 'gym', label: 'Gym & Fitness', icon: Compass }
          ].map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#0d55c8] text-white border-[#0d55c8] shadow-md shadow-blue-600/10 scale-105' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-500'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Catalog Grid (Airbnb style featured cards) */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Featured Accommodations</h2>
            <p className="text-xs text-zinc-500 mt-1 font-semibold">Direct reservations from pg owners with verified real-time vacancies</p>
          </div>
          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200/50">
            {filteredBuildings.length} Verified PGs
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-[#0d55c8] animate-spin" />
            <span className="text-xs text-zinc-500 font-bold tracking-wider">Syncing properties with the cloud...</span>
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white border border-zinc-200/60 rounded-3xl text-center">
            <Compass className="w-12 h-12 text-zinc-300 animate-bounce" />
            <h3 className="font-extrabold text-sm text-zinc-800">No matching spaces found</h3>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              We couldn't find any verified listings matching the active criteria. Try exploring another filter category.
            </p>
            <button 
              onClick={() => handleCategoryChange('all')}
              className="mt-2 px-4 py-2 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBuildings.map((b) => {
              const previewImg = b.images && b.images.length > 0 
                ? b.images[0] 
                : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';

              return (
                <div 
                  key={b.id} 
                  className="group bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image wrapper */}
                  <div className="relative h-56 overflow-hidden bg-zinc-150">
                    <img 
                      src={previewImg} 
                      alt={b.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Top highlights badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase text-emerald-600 tracking-wider shadow-sm border border-emerald-500/10">
                        Verified PG
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-extrabold text-white tracking-wide shadow">
                      {b.city}
                    </div>
                  </div>

                  {/* Body description */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">
                        {b.area}
                      </span>
                      <h3 className="font-extrabold text-base text-zinc-900 tracking-tight group-hover:text-[#0d55c8] transition-colors leading-tight">
                        {b.name}
                      </h3>
                      
                      {/* Landmarks */}
                      {b.nearbyColleges && b.nearbyColleges.length > 0 && (
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold truncate leading-none">
                            {b.nearbyColleges[0]}
                          </span>
                        </div>
                      )}

                      {/* Amenities Icons Row */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.amenities.slice(0, 3).map((amenity, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/50 text-zinc-500 font-bold text-[9px]"
                          >
                            {amenity}
                          </span>
                        ))}
                        {b.amenities.length > 3 && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200/30 text-zinc-400 font-bold text-[9px]">
                            +{b.amenities.length - 3} More
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing & Link */}
                    <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black text-zinc-450 uppercase block tracking-wider">Starting Rent</span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span className="text-base font-black text-[#0d55c8]">₹{b.baseRent.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-bold text-zinc-500">/mo</span>
                        </div>
                      </div>

                      <Link 
                        href={`/pg/${b.id}`}
                        className="px-4 py-2.5 bg-[#0d55c8] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/5 hover:scale-[1.03] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Book Bed</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Renter Features Grid Section */}
      <section className="bg-white border-t border-zinc-200 py-20 px-6">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-[#0d55c8] uppercase tracking-wider block">Designed For Renters & Students</span>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">HomiePG Tenant Experience</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto font-semibold">
              Everything you need to find, reserve, and stay in verified paying guest accommodations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Benefit Card 1 */}
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200/60 shadow-sm space-y-4 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0d55c8] flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg">Cinema Bed Picker</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-semibold">
                View room shapes and share details dynamically. Pick your exact bed slot (Green for available) and reserve it instantly with a simple deposit upload.
              </p>
            </div>

            {/* Benefit Card 2 */}
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200/60 shadow-sm space-y-4 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg">Safe Digital KYC</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-semibold">
                Securely upload Aadhaar or PAN files. View verification status and access signed rental agreements instantly on your mobile phone dashboard.
              </p>
            </div>

            {/* Benefit Card 3 */}
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200/60 shadow-sm space-y-4 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg">Automatic Rent Bills</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-semibold">
                Check itemized monthly invoices (Base rent, electricity bill, Wi-Fi). Pay online easily and download clean PDF transaction receipts directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding Banner */}
      <footer className="mt-auto border-t border-zinc-200 bg-white px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" showText={false} />
            <span className="font-extrabold text-sm text-zinc-900">HomiePG</span>
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
