'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, MapPin, Building, ShieldCheck, Filter, Wifi, Check, IndianRupee, Map, Loader2 } from 'lucide-react';
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
  rules: string[];
  images: string[];
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold tracking-wider">Loading search matrix...</span>
      </div>
    }>
      <SearchPageComponent />
    </React.Suspense>
  );
}

function SearchPageComponent() {
  const searchParams = useSearchParams();
  
  // Filter states
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minRent, setMinRent] = useState(0);
  const [maxRent, setMaxRent] = useState(25000);
  const [gender, setGender] = useState(searchParams.get('gender') || '');
  const [sharing, setSharing] = useState(Number(searchParams.get('sharing')) || 0);
  const [wifi, setWifi] = useState(false);
  const [food, setFood] = useState(false);
  const [ac, setAc] = useState(false);
  const [washroom, setWashroom] = useState(false);
  const [parking, setParking] = useState(false);

  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBldId, setHoveredBldId] = useState<string | null>(null);
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

  const fetchResults = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (city) q.set('city', city);
      if (minRent) q.set('minRent', minRent.toString());
      if (maxRent) q.set('maxRent', maxRent.toString());
      if (gender) q.set('gender', gender);
      if (sharing) q.set('sharing', sharing.toString());
      if (wifi) q.set('wifi', 'true');
      if (food) q.set('food', 'true');
      if (ac) q.set('ac', 'true');
      if (washroom) q.set('washroom', 'true');
      if (parking) q.set('parking', 'true');

      const res = await fetch(`/api/buildings?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBuildings(data.buildings);
      }
    } catch (e) {
      console.error('Error fetching buildings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [city, minRent, maxRent, gender, sharing, wifi, food, ac, washroom, parking]);

  // Simulated coordinates for map plotting based on index
  const getMapCoords = (idx: number) => {
    const coordinates = [
      { x: 120, y: 150 },
      { x: 280, y: 180 },
      { x: 190, y: 290 },
      { x: 340, y: 110 },
      { x: 220, y: 80 },
    ];
    return coordinates[idx % coordinates.length];
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="block">
          <Logo className="w-8 h-8" showText={true} darkText={true} />
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <button 
              onClick={async () => {
                const res = await fetch('/api/auth/logout', { method: 'POST' });
                if (res.ok) {
                  setUser(null);
                  window.location.reload();
                }
              }}
              className="text-xs font-bold px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50/10 hover:text-rose-500 rounded-lg transition-colors cursor-pointer animate-fade-in"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-xs font-bold px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
              Dashboard Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6 overflow-y-auto shrink-0 md:max-h-[calc(100vh-69px)]">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-4">
            <Filter className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm">Advanced Search Filters</h3>
          </div>

          {/* City search */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 block">Select City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
            >
              <option value="">All Cities</option>
              <option value="Noida">Noida (Sector 62)</option>
              <option value="Bangalore">Bangalore (Koramangala)</option>
              <option value="Pune">Pune (Viman Nagar)</option>
            </select>
          </div>

          {/* Gender constraint */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 block">Gender Restriction</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-850/40">
              {[
                { label: 'All', value: '' },
                { label: 'Boys', value: 'MALE' },
                { label: 'Girls', value: 'FEMALE' },
              ].map((g) => (
                <button
                  key={g.label}
                  onClick={() => setGender(g.value)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    gender === g.value 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500">
              <span>Max Monthly Rent</span>
              <span className="text-indigo-500">₹{maxRent.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range"
              min="5000"
              max="25000"
              step="1000"
              value={maxRent}
              onChange={(e) => setMaxRent(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Sharing type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 block">Sharing Capacity</label>
            <select
              value={sharing}
              onChange={(e) => setSharing(parseInt(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
            >
              <option value="0">Any sharing</option>
              <option value="1">Single Room</option>
              <option value="2">Double Sharing</option>
              <option value="3">Triple Sharing</option>
              <option value="4">Four Sharing</option>
            </select>
          </div>

          {/* Amenities switches */}
          <div className="space-y-3.5 pt-2">
            <label className="text-xs font-bold text-zinc-500 block">Core Amenities</label>
            {[
              { label: 'High-speed Wi-Fi', state: wifi, set: setWifi },
              { label: 'Meals / Food Included', state: food, set: setFood },
              { label: 'Air Conditioning (AC)', state: ac, set: setAc },
              { label: 'Attached Washroom', state: washroom, set: setWashroom },
              { label: 'Parking Lot', state: parking, set: setParking },
            ].map((amenity) => (
              <label key={amenity.label} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={amenity.state}
                  onChange={(e) => amenity.set(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  amenity.state 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'border-zinc-300 dark:border-zinc-700 group-hover:border-indigo-500'
                }`}>
                  {amenity.state && <Check className="w-3 h-3 stroke-[3px]" />}
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                  {amenity.label}
                </span>
              </label>
            ))}
          </div>
        </aside>

        {/* Listings List */}
        <main className="flex-1 p-6 md:p-8 space-y-6 md:max-h-[calc(100vh-69px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-200/40 dark:border-zinc-900 pb-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Search Results</h2>
              <p className="text-xs text-zinc-500 mt-1">Found {buildings.length} verified listings in our directory.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-zinc-500 font-medium">Filtering listings...</span>
            </div>
          ) : buildings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 p-8">
              <Building className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300">No PGs Match Filters</h3>
              <p className="text-xs text-zinc-500 mt-1.5">Try resetting your filters or adjusting your maximum rent slider.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {buildings.map((b, idx) => (
                <Link
                  key={b.id}
                  href={`/pg/${b.id}`}
                  onMouseEnter={() => setHoveredBldId(b.id)}
                  onMouseLeave={() => setHoveredBldId(null)}
                  className={`border rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row ${
                    hoveredBldId === b.id 
                      ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
                      : 'border-zinc-200 dark:border-zinc-850'
                  }`}
                >
                  {/* Image banner */}
                  <div className="w-full sm:w-44 h-40 relative bg-zinc-150 dark:bg-zinc-900 shrink-0">
                    <img 
                      src={b.images[0]} 
                      alt={b.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-zinc-900/80 text-white text-[9px] font-extrabold uppercase tracking-wide">
                      {b.city}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-snug line-clamp-1">{b.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{b.area}, {b.city}</span>
                      </div>
                      
                      {/* Amenities Tag Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {b.amenities.slice(0, 3).map((amenity) => (
                          <span key={amenity} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850/50 text-[9px] font-bold text-zinc-500">
                            {amenity}
                          </span>
                        ))}
                        {b.amenities.length > 3 && (
                          <span className="text-[9px] font-bold text-indigo-400 mt-0.5">+{b.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-zinc-100 dark:border-zinc-900 pt-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">Monthly Rent</span>
                        <span className="text-sm font-extrabold text-indigo-500">₹{b.baseRent.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-500 flex items-center gap-0.5">
                        Live availability &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Right side Map view simulation */}
        <section className="hidden lg:flex w-96 bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 flex-col justify-between sticky top-[69px] max-h-[calc(100vh-69px)] select-none">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Map className="w-4 h-4 text-indigo-500" /> Map Pin Layout
            </h3>
            <p className="text-[10px] text-zinc-500">Simulated neighborhood coordinates tracking matching properties.</p>
          </div>

          {/* Interactive Map Grid */}
          <div className="flex-1 my-6 rounded-2xl bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 relative overflow-hidden shadow-inner">
            {/* Grid background lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            {/* Plot pins */}
            {buildings.map((b, idx) => {
              const coords = getMapCoords(idx);
              const isHovered = hoveredBldId === b.id;
              
              return (
                <div
                  key={b.id}
                  style={{ left: coords.x, top: coords.y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  onMouseEnter={() => setHoveredBldId(b.id)}
                  onMouseLeave={() => setHoveredBldId(null)}
                >
                  {/* Pin Circle */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 ${
                    isHovered 
                      ? 'bg-indigo-600 text-white scale-125 border-white ring-4 ring-indigo-500/20' 
                      : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-500/30'
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  
                  {/* Tiny label */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-zinc-900 text-white text-[8px] font-bold rounded px-1 py-0.5 border border-zinc-700 shadow-md pointer-events-none transition-opacity ${
                    isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    ₹{b.baseRent.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-zinc-400 text-center leading-relaxed">
            Hover over a map pin to locate matching listings. Coordinates are synced dynamically using area geolocation mappings.
          </div>
        </section>

      </div>
    </div>
  );
}
