'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, User as UserIcon, Calendar, FileText, CheckCircle2, 
  AlertTriangle, Upload, MessageSquare, Send, Plus, CreditCard, ShieldCheck, Loader2,
  Search, Filter, Wifi, Check 
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import InvoiceModal from '@/components/invoice-modal';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'OWNER' | 'SUPER_ADMIN';
  phone?: string;
}

interface UserStay {
  residentId: string;
  buildingName: string;
  address: string;
  roomNumber: string;
  bedNumber: string;
  rentAmount: number;
  joiningDate: string;
  outstandingAmount: number;
  policeVerified: boolean;
  kycAadhaar?: string;
  kycPan?: string;
}

interface Invoice {
  id: string;
  amount: number;
  paymentType: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  billingPeriod: string;
  invoiceNumber: string;
  receiptNumber?: string;
  paymentDate?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: string;
  messages: { sender: string; message: string; timestamp: string }[];
  createdAt: string;
}

export default function UserDashboard() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold tracking-wider">Loading dashboard desk...</span>
      </div>
    }>
      <UserDashboardComponent />
    </React.Suspense>
  );
}

function UserDashboardComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [user, setUser] = useState<UserData | null>(null);
  const [stay, setStay] = useState<UserStay | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  const [activeTab, setActiveTab] = useState<'stay' | 'kyc' | 'helpdesk' | 'search' | 'matcher'>('stay');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validTabs = ['stay', 'kyc', 'helpdesk', 'search', 'matcher'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [tab]);

  // Explore Rooms inline search states
  const [searchCity, setSearchCity] = useState('');
  const [minRent, setMinRent] = useState(0);
  const [maxRent, setSearchMaxRent] = useState(25000);
  const [gender, setGender] = useState('');
  const [sharing, setSharing] = useState(0);
  const [wifi, setWifi] = useState(false);
  const [food, setFood] = useState(false);
  const [ac, setAc] = useState(false);
  const [washroom, setWashroom] = useState(false);
  const [parking, setParking] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchSearchListingResults = async () => {
    setSearchLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchCity) q.set('city', searchCity);
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
        setSearchResults(data.buildings);
      }
    } catch (e) {
      console.error('Error fetching buildings', e);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'search') {
      fetchSearchListingResults();
    }
  }, [activeTab, searchCity, minRent, maxRent, gender, sharing, wifi, food, ac, washroom, parking]);

  // Modal / Action states
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [paymentProof, setPaymentProof] = useState('');
  const [txnId, setTxnId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New ticket state
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Maintenance');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketDesc, setTicketDesc] = useState('');

  // Ticket Chat state
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveRating, setResolveRating] = useState(5);
  const [resolveComment, setResolveComment] = useState('');

  // KYC upload simulator states
  const [kycAadhaarUrl, setKycAadhaarUrl] = useState('');
  const [kycPanUrl, setKycPanUrl] = useState('');

  // Roommate Compatibility Profile states
  const [compatDiet, setCompatDiet] = useState<'VEG' | 'NON_VEG' | 'ANY'>('ANY');
  const [compatSleep, setCompatSleep] = useState<'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE'>('FLEXIBLE');
  const [compatOccupation, setCompatOccupation] = useState<'STUDENT' | 'PROFESSIONAL' | 'OTHER'>('OTHER');
  const [compatHobbies, setCompatHobbies] = useState('');
  const [compatLoading, setCompatLoading] = useState(false);
  const [compatSuccess, setCompatSuccess] = useState(false);
  const [compatError, setCompatError] = useState('');

  const loadDashboardData = async () => {
    try {
      // 1. Fetch user session
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meRes.ok || !meData.authenticated) {
        router.push('/login');
        return;
      }
      setUser(meData.user);

      // 2. Fetch stay & resident details
      const resRoster = await fetch('/api/owner/residents');
      const rosterData = await resRoster.json();
      if (rosterData.success && rosterData.residents.length > 0) {
        const myStay = rosterData.residents.find((r: any) => r.email === meData.user.email);
        if (myStay) {
          setStay({
            residentId: myStay.id,
            buildingName: myStay.buildingName,
            address: myStay.address,
            roomNumber: myStay.roomNumber,
            bedNumber: myStay.bedNumber,
            rentAmount: myStay.rentAmount,
            joiningDate: myStay.joiningDate,
            outstandingAmount: myStay.outstandingAmount,
            policeVerified: myStay.policeVerified,
            kycAadhaar: myStay.kycDocAadhaar,
            kycPan: myStay.kycDocPan,
          });
          if (myStay.kycDocAadhaar) setKycAadhaarUrl(myStay.kycDocAadhaar);
          if (myStay.kycDocPan) setKycPanUrl(myStay.kycDocPan);
        }
      }

      // 3. Fetch Invoices
      const payRes = await fetch('/api/owner/payments');
      const payData = await payRes.json();
      if (payData.success) {
        setInvoices(payData.payments);
      }

      // 4. Fetch Support Tickets
      const tktRes = await fetch('/api/tickets');
      const tktData = await tktRes.json();
      if (tktData.success) {
        setTickets(tktData.tickets);
      }

      // 5. Fetch Compatibility Profile
      try {
        const compatRes = await fetch('/api/user/compatibility');
        if (compatRes.ok) {
          const compatData = await compatRes.json();
          if (compatData.success && compatData.compatibilityProfile) {
            const profile = compatData.compatibilityProfile;
            setCompatDiet(profile.diet || 'ANY');
            setCompatSleep(profile.sleep || 'FLEXIBLE');
            setCompatOccupation(profile.occupation || 'OTHER');
            setCompatHobbies(profile.hobbies || '');
          }
        }
      } catch (err) {
        console.error('Error fetching compatibility settings', err);
      }

    } catch (e) {
      console.error('Failed to load user dashboard analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  const handleInvoicePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/owner/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payInvoice.id,
          status: 'PAID', // owner will confirm, but we update to PAID for client demo
          proofUrl: paymentProof || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
          notes: `Tenant paid online via UPI. Txn ID: ${txnId}`,
        }),
      });

      if (res.ok) {
        setPayInvoice(null);
        setPaymentProof('');
        setTxnId('');
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          description: ticketDesc,
          category: ticketCategory,
          priority: ticketPriority,
        }),
      });

      if (res.ok) {
        setShowNewTicket(false);
        setTicketSubject('');
        setTicketDesc('');
        await loadDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !chatMessage.trim()) return;

    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: chatMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        setChatMessage('');
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: 'RESOLVED',
          rating: resolveRating,
          message: resolveComment ? `Ticket closed by resident. Feedback: ${resolveComment}` : `Ticket marked as RESOLVED by resident. Rating: ${resolveRating} Stars.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowResolveModal(false);
        setSelectedTicket(data.ticket);
        setResolveComment('');
        setResolveRating(5);
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadKyc = async (docType: 'aadhaar' | 'pan') => {
    // Simulated upload trigger
    const mockUrl = `/kyc/${user?.id}_${docType}.pdf`;
    if (docType === 'aadhaar') {
      setKycAadhaarUrl(mockUrl);
    } else {
      setKycPanUrl(mockUrl);
    }
    
    // Trigger manual KYC update call
    try {
      await fetch(`/api/owner/residents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stay?.residentId,
          kycDocAadhaar: docType === 'aadhaar' ? mockUrl : kycAadhaarUrl,
          kycDocPan: docType === 'pan' ? mockUrl : kycPanUrl,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCompatibilityProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompatLoading(true);
    setCompatError('');
    setCompatSuccess(false);

    try {
      const res = await fetch('/api/user/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diet: compatDiet,
          sleep: compatSleep,
          occupation: compatOccupation,
          hobbies: compatHobbies,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompatSuccess(true);
        await loadDashboardData();
      } else {
        setCompatError(data.error || 'Failed to update compatibility profile.');
      }
    } catch (err) {
      setCompatError('Network error saving profile settings.');
    } finally {
      setCompatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-bold">Configuring tenant desk...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {user && <Sidebar user={user} />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white">Tenant Portal</h1>
            <p className="text-xs text-zinc-500 mt-1">Review active lease agreements, invoices, and KYC checklists.</p>
          </div>
          
          <div className="flex bg-zinc-150 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-850/50">
            {[
              { id: 'stay', label: 'My Accommodation' },
              { id: 'search', label: 'Explore Rooms' },
              { id: 'kyc', label: 'Document Locker' },
              { id: 'helpdesk', label: 'Support Desk' },
              { id: 'matcher', label: 'Living Matcher' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Tab 4: EXPLORE ROOMS SEARCH LISTINGS INLINE */}
          {activeTab === 'search' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              {/* Sidebar filter controls */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto sticky top-28">
                <div className="flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-4">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-extrabold text-sm">Advanced Search Filters</h3>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 block">Select City</label>
                  <select
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="">All Cities</option>
                    <option value="Noida">Noida (Sector 62)</option>
                    <option value="Bangalore">Bangalore (Koramangala)</option>
                    <option value="Pune">Pune (Viman Nagar)</option>
                  </select>
                </div>

                {/* Gender */}
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
                        type="button"
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

                {/* Budget */}
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
                    onChange={(e) => setSearchMaxRent(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sharing */}
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

                {/* Core Amenities */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-zinc-500 block">Core Amenities</label>
                  {[
                    { label: 'High-speed Wi-Fi', state: wifi, set: setWifi },
                    { label: 'Meals / Food Included', state: food, set: setFood },
                    { label: 'Air Conditioning (AC)', state: ac, set: setAc },
                    { label: 'Attached Washroom', state: washroom, set: setWashroom },
                    { label: 'Parking Lot', state: parking, set: setParking },
                  ].map((amenity) => (
                    <label key={amenity.label} className="flex items-center gap-3 cursor-pointer group select-none">
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
                      <span className="text-xs text-zinc-650 dark:text-zinc-400 font-semibold group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                        {amenity.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Listings Result Grid */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-6 py-4 rounded-2xl shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Search Results</span>
                    <h3 className="font-extrabold text-sm text-zinc-850 dark:text-white font-sans">
                      {searchLoading ? 'Scanning network...' : `Found ${searchResults.length} verified listings`}
                    </h3>
                  </div>
                </div>

                {searchLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs text-zinc-400 font-semibold">Filtering coliving layouts...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                    <p className="text-sm text-zinc-400 font-bold">No PG accommodations match your current filter parameters.</p>
                    <p className="text-xs text-zinc-500">Try widening your maximum budget range or clearing search features.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map((b) => (
                      <div 
                        key={b.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-700 transition-all group"
                      >
                        <div className="h-44 relative bg-zinc-200 overflow-hidden shrink-0">
                          <img 
                            src={b.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'} 
                            alt={b.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-3 right-3 px-2 py-1 rounded bg-zinc-950/80 backdrop-blur text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                            ₹{b.baseRent.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">{b.name}</h4>
                            <p className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                              📍 {b.area}, {b.city}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {b.amenities.slice(0, 3).map((a: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black uppercase text-zinc-500 tracking-wide">
                                {a}
                              </span>
                            ))}
                          </div>

                          <Link 
                            href={`/pg/${b.id}`}
                            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-center text-xs font-bold shadow-sm transition-all block"
                          >
                            View Live Beds &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 1: STAY & LEASE DETAILS */}
          {activeTab === 'stay' && (
            <div className="space-y-8 animate-fade-in">
              {/* Stay Header */}
              {stay ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* PG Card */}
                  <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <Building className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg">{stay.buildingName}</h3>
                      <p className="text-xs text-zinc-500">{stay.address}</p>
                      <div className="flex gap-4 pt-3 text-xs font-semibold">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Room Number</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{stay.roomNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assigned Bed</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{stay.bedNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Joined On</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{stay.joiningDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rent Due Widget */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Lease Rent Price</span>
                      <h3 className="text-2xl font-black text-indigo-500">₹{stay.rentAmount.toLocaleString('en-IN')}/mo</h3>
                    </div>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">Outstanding Balance</span>
                        <span className={`text-xs font-bold ${stay.outstandingAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          ₹{stay.outstandingAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {stay.outstandingAmount > 0 && (
                        <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-wide">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
                  <Building className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-300">No Active Lease Found</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto">
                    You are not currently checked into any HomiePG buildings. Visit our room selector to search PGs.
                  </p>
                  <Link href="/search" className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow">
                    Find Accommodations &rarr;
                  </Link>
                </div>
              )}

              {/* Invoices Ledger Table */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
                  <h3 className="font-bold text-base">Lease Invoices & Receipts</h3>
                  <p className="text-xs text-zinc-500 mt-1">Audit statements of billing cycles.</p>
                </div>
                
                {invoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">No transaction records generated.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Invoice #</th>
                          <th className="p-4">Period</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                            <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">{inv.invoiceNumber}</td>
                            <td className="p-4">{inv.billingPeriod}</td>
                            <td className="p-4 text-indigo-500">₹{inv.amount.toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                {inv.paymentType}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                inv.status === 'PAID' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {inv.status === 'PENDING' ? (
                                <button
                                  onClick={() => setPayInvoice(inv)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                                >
                                  Submit Receipt
                                </button>
                              ) : (
                                <button
                                  onClick={() => setViewInvoice({
                                    ...inv,
                                    residentName: user?.name || 'Tenant',
                                    residentPhone: user?.phone || '',
                                    buildingName: stay?.buildingName || 'HomiePG Home',
                                    roomNumber: stay?.roomNumber || '',
                                    bedNumber: stay?.bedNumber || '',
                                  })}
                                  className="text-[10px] text-indigo-500 hover:underline font-bold"
                                >
                                  Print Receipt / PDF
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: DIGITAL KYC LOCKER */}
          {activeTab === 'kyc' && (
            <div className="space-y-8 animate-fade-in max-w-4xl">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Digital Verification Locker</h3>
                    <p className="text-xs text-zinc-500">Submit legal files to complete police verification checks.</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800"></div>

                {/* KYC statuses grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Aadhaar */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950/40 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-xs">National ID (Aadhaar Card)</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Required for identity checks.</p>
                      </div>
                      {kycAadhaarUrl ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider rounded">
                          Uploaded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider rounded">
                          Action Needed
                        </span>
                      )}
                    </div>
                    {kycAadhaarUrl ? (
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-semibold bg-white dark:bg-zinc-950 border rounded p-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span className="truncate">aadhaar_verified_locker.pdf</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadKyc('aadhaar')}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Aadhaar PDF
                      </button>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950/40 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-xs">Income Tax ID (PAN Card)</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Required for financial ledger records.</p>
                      </div>
                      {kycPanUrl ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider rounded">
                          Uploaded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider rounded">
                          Action Needed
                        </span>
                      )}
                    </div>
                    {kycPanUrl ? (
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-semibold bg-white dark:bg-zinc-950 border rounded p-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span className="truncate">pan_card_locker.pdf</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadKyc('pan')}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload PAN PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Info Checklist */}
                <div className="border border-zinc-250 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 font-bold">
                    i
                  </div>
                  <div className="leading-relaxed font-semibold">
                    <span className="text-zinc-800 dark:text-zinc-200 block">Verification Status: {stay?.policeVerified ? 'Police Verified' : 'Pending Verification'}</span>
                    <span className="text-zinc-500 text-[10px] block mt-0.5">
                      {stay?.policeVerified 
                        ? 'Your files have been reviewed by local authorities. Rent agreement is finalized.' 
                        : 'Your files are uploaded. Verification usually takes 48 hours.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: HELPDESK & SUPPORT TICKETS */}
          {activeTab === 'helpdesk' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              
              {/* Tickets list */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Grievance Tickets</h3>
                    <button
                      onClick={() => setShowNewTicket(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold shadow flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Ticket
                    </button>
                  </div>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-900"></div>

                  <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                    {tickets.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-400">No support tickets raised.</div>
                    ) : (
                      tickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            selectedTicket?.id === t.id
                              ? 'border-indigo-600 bg-indigo-500/5'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 hover:border-zinc-350 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-zinc-850 dark:text-zinc-200 leading-snug line-clamp-1 pr-2">{t.subject}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                              t.status === 'RESOLVED' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-amber-500/10 text-amber-500 animate-pulse'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1 truncate">{t.description}</p>
                          <div className="flex items-center justify-between text-[8px] font-extrabold text-zinc-400 uppercase tracking-widest mt-3.5 pt-2 border-t border-zinc-150/40 dark:border-zinc-800/40">
                            <span>ID: {t.id}</span>
                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Chat screen */}
              <div className="lg:col-span-7">
                {selectedTicket ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[500px] shadow-sm flex flex-col justify-between overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
                      <div>
                        <h4 className="font-bold text-xs leading-none">{selectedTicket.subject}</h4>
                        <span className="text-[9px] font-mono text-zinc-400 mt-1 block">Ticket ID: {selectedTicket.id}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-wide">
                        {selectedTicket.priority} Priority
                      </span>
                    </div>

                    {/* Assigned Worker Sub-Header Banner */}
                    {selectedTicket.assignedEmployee && (
                      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-900 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 font-extrabold uppercase">
                            {selectedTicket.assignedEmployee.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-800 dark:text-zinc-250 flex items-center gap-1.5 leading-none">
                              <span>{selectedTicket.assignedEmployee.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-850 text-[7px] uppercase tracking-wide font-black text-zinc-500">
                                {selectedTicket.assignedEmployee.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-550 flex items-center gap-1 mt-1 leading-none font-medium">
                              ⭐ {selectedTicket.assignedEmployee.rating || '5.0'} ({selectedTicket.assignedEmployee.ratingCount || 1} feedback)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${selectedTicket.assignedEmployee.phone}`}
                            className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:text-indigo-600 rounded-lg text-[9px] font-bold shadow-sm"
                          >
                            ☎️ Call Worker
                          </a>
                          {selectedTicket.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setResolveRating(5);
                                setResolveComment('');
                                setShowResolveModal(true);
                              }}
                              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold shadow-sm cursor-pointer"
                            >
                              Resolve Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                      {selectedTicket.messages.map((msg: any, idx: number) => {
                        const isMe = msg.sender === user?.name;
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`p-3 rounded-2xl max-w-[80%] text-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                            }`}>
                              <p className="leading-relaxed font-medium">{msg.message}</p>
                            </div>
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wide mt-1 px-1">
                              {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Input message form */}
                    {selectedTicket.status !== 'RESOLVED' ? (
                      <form onSubmit={handleSendChatMessage} className="p-4 border-t border-zinc-150 dark:border-zinc-900 flex gap-2 items-center bg-zinc-50 dark:bg-zinc-950/40">
                        <input
                          type="text"
                          required
                          placeholder="Reply to caretaker or admin support..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-600 font-semibold"
                        />
                        <button
                          type="submit"
                          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100">
                        This query has been marked as <b>RESOLVED</b>.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[500px] shadow-sm flex items-center justify-center text-center p-6 select-none">
                    <div className="space-y-2">
                      <MessageSquare className="w-12 h-12 text-zinc-400 mx-auto" />
                      <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Open Complaint Logs</h4>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                        Click on any ticket in the grid list to view messages log and chat directly with staff members.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Tab 5: LIVING MATCHER COMPATIBILITY PROFILE */}
          {activeTab === 'matcher' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 rounded-2xl space-y-6 max-w-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">Living Matcher Profile</h3>
                  <p className="text-xs text-zinc-500">Set compatibility answers to find optimal roommate cohorts.</p>
                </div>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800"></div>

              {compatSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 font-extrabold" />
                  <span>Your roommate compatibility questionnaire has been saved successfully!</span>
                </div>
              )}

              {compatError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {compatError}
                </div>
              )}

              <form onSubmit={handleSaveCompatibilityProfile} className="space-y-5 text-xs">
                {/* Diet preference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 block">Dietary Habit</label>
                  <select
                    value={compatDiet}
                    onChange={(e) => setCompatDiet(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 font-semibold outline-none focus:border-indigo-600 text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="VEG">Strictly Vegetarian (Veg)</option>
                    <option value="NON_VEG">Non-Vegetarian / Anything</option>
                    <option value="ANY">No Food Cohort Preference</option>
                  </select>
                </div>

                {/* Sleep schedule */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 block">Daily Sleep Cycle</label>
                  <select
                    value={compatSleep}
                    onChange={(e) => setCompatSleep(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 font-semibold outline-none focus:border-indigo-600 text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="EARLY_BIRD">Early Bird (Sleeps before 10 PM)</option>
                    <option value="NIGHT_OWL">Night Owl (Sleeps late after 12 AM)</option>
                    <option value="FLEXIBLE">Flexible / Adaptable schedule</option>
                  </select>
                </div>

                {/* Profession */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 block">Occupation / Profession</label>
                  <select
                    value={compatOccupation}
                    onChange={(e) => setCompatOccupation(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 font-semibold outline-none focus:border-indigo-600 text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="STUDENT">Active Student (College/School)</option>
                    <option value="PROFESSIONAL">Working Corporate Professional</option>
                    <option value="OTHER">Other Occupations</option>
                  </select>
                </div>

                {/* Hobbies / Custom tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 block">Living Hobbies & Interests</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gaming, Football, Silent Reading, Guitar playing"
                    value={compatHobbies}
                    onChange={(e) => setCompatHobbies(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400 text-zinc-800 dark:text-zinc-100"
                  />
                  <span className="text-[10px] text-zinc-450 block font-medium">Use commas to separate multiple keywords. This will be visible anonymized to other prospective bed bookers.</span>
                </div>

                <button
                  type="submit"
                  disabled={compatLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-650 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {compatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Compatibility Settings'
                  )}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: TICKET RESOLUTION & RATING STAFF */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-5 animate-fade-in text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-base text-zinc-900 dark:text-white">Resolve Grievance</h3>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Please rate the caretaker's support.</span>
              </div>
              <button 
                onClick={() => setShowResolveModal(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleResolveTicketSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 block">Performance Rating</label>
                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setResolveRating(star)}
                      className={`text-2xl transition-all cursor-pointer ${
                        resolveRating >= star ? 'text-amber-400 scale-110' : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="text-center font-bold text-zinc-650 text-[10px] uppercase">
                  {resolveRating === 5 ? 'Exceptional Work' : resolveRating === 4 ? 'Very Satisfied' : resolveRating === 3 ? 'Average Support' : resolveRating === 2 ? 'Unsatisfying' : 'Poor Care'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Closing Comments (Optional)</label>
                <textarea
                  placeholder="Tell us what went well or how they can improve..."
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-indigo-600 placeholder-zinc-400 font-semibold text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-650 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Resolution & Submit Rating'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT INVOICE RECEIPT */}
      {payInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-base">Verify Monthly Bill</h3>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Invoice: {payInvoice.invoiceNumber}</span>
              </div>
              <button 
                onClick={() => setPayInvoice(null)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleInvoicePaymentSubmit} className="space-y-4">
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs flex justify-between font-semibold">
                <span className="text-zinc-500">{payInvoice.paymentType} • {payInvoice.billingPeriod}</span>
                <span className="text-indigo-500 font-bold">₹{payInvoice.amount.toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">UPI Transaction / Ref ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI88776655"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 block">Upload Transfer Proof</label>
                {!paymentProof ? (
                  <button
                    type="button"
                    onClick={() => setPaymentProof('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80')}
                    className="w-full py-4 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500">Tap to upload receipt image</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-zinc-500 font-semibold truncate">payment_receipt.jpg</span>
                    <button 
                      type="button" 
                      onClick={() => setPaymentProof('')}
                      className="text-[9px] font-black text-rose-500 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Payment Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SUPPORT TICKET */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-base">File Grievance Ticket</h3>
              <button 
                onClick={() => setShowNewTicket(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Ticket Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi router keeps disconnecting"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="Internet / Wi-Fi">Internet / Wi-Fi</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Electricity / AC">Electricity / AC</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Food & Catering">Food & Catering</option>
                    <option value="Security / Access">Security / Access</option>
                    <option value="Billing / Rent Invoice">Billing / Rent Invoice</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Describe the issue</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide precise details, e.g. floor number, router placement, or exact time..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Raise Support Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable PDF Modal */}
      {viewInvoice && (
        <InvoiceModal 
          invoice={viewInvoice} 
          onClose={() => setViewInvoice(null)} 
        />
      )}

    </div>
  );
}
