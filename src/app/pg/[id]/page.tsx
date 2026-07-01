'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building, MapPin, ShieldCheck, Wifi, IndianRupee, Heart, 
  Map, Calendar, Upload, AlertCircle, ArrowLeft, PlayCircle, Eye, Info, CheckCircle2, ShieldQuestion, Loader2 
} from 'lucide-react';
import { Logo } from '@/components/logo';
import BedGrid, { Bed, Room } from '@/components/bed-grid';

interface BuildingDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  description: string;
  amenities: string[];
  rules: string[];
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  baseRent: number;
  baseDeposit: number;
  foodCharges: number;
  electricityCharges: number;
  waterCharges: number;
  wifiCharges: number;
  laundryCharges: number;
  parkingCharges: number;
  housekeepingCharges: number;
  nearbyColleges: string[];
  nearbyCompanies: string[];
  nearbyMetro: string[];
  rooms: Room[];
}

export default function PGDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [bld, setBld] = useState<BuildingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video' | 'virtual'>('photos');
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Booking Form states
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  const [moveInDate, setMoveInDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  const fetchBuilding = async () => {
    try {
      const res = await fetch(`/api/buildings/${id}`);
      const data = await res.json();
      if (data.success) {
        setBld(data.building);
      }
    } catch (e) {
      console.error('Error fetching building detail', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilding();
  }, [id]);

  const handleSelectBed = (bed: Bed, room: Room) => {
    setSelectedBed(bed);
    setSelectedRoom(room);
    setBookingError('');
    setBookingSuccess(false);
  };

  // Mock file proof uploader helper
  const handleUploadProof = () => {
    // Generate a mock URL representing uploaded screenshot
    setProofUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(false);
    setBookingLoading(true);

    if (!selectedBed || !selectedRoom || !bld) {
      setBookingError('Please select a bed first.');
      setBookingLoading(false);
      return;
    }

    if (!moveInDate) {
      setBookingError('Please pick your move-in date.');
      setBookingLoading(false);
      return;
    }

    if (!transactionId || !proofUrl) {
      setBookingError('Payment details and UPI verification proof screenshot are required.');
      setBookingLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: bld.id,
          roomId: selectedRoom.id,
          bedId: selectedBed.id,
          moveInDate,
          amount: selectedRoom.price - discount,
          paymentMethod,
          transactionId,
          paymentProofUrl: proofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Booking reservation failed');
      }

      setBookingSuccess(true);
      // Refresh building structure state to mark bed as RESERVED (Yellow)
      await fetchBuilding();
      
      // Reset selection
      setSelectedBed(null);
      setSelectedRoom(null);

    } catch (e: any) {
      setBookingError(e.message || 'Verification connection failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold">Loading property map and availability...</span>
      </div>
    );
  }

  if (!bld) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold">Property Not Found</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">The listing ID is invalid or has been unpublished by the owner.</p>
        <Link href="/search" className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow">
          Back to Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col pb-16">
      
      {/* Header navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4 flex items-center justify-between">
        <Link href="/search" className="flex items-center gap-1.5 text-xs font-bold hover:text-indigo-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to PG search
        </Link>
        <Link href="/" className="block">
          <Logo className="w-7 h-7" showText={true} darkText={true} />
        </Link>
      </header>

      {/* Main Detail Grid Layout */}
      <main className="max-w-7xl mx-auto w-full px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Columns (Gallery, Amenities, Rules, Layouts) */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Title & Metadata Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{bld.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-zinc-400" /> {bld.address}, {bld.area}, {bld.city}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold uppercase text-[9px] tracking-wide">
                Verified Listing
              </span>
            </div>
          </div>

          {/* Media Section (Images, video player, virtual tour tabs) */}
          <div className="border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            {/* Tabs */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-900 p-2 gap-1 bg-zinc-50 dark:bg-zinc-950/40">
              {[
                { id: 'photos', label: 'Photos Gallery', icon: Building },
                { id: 'video', label: 'Video Walkthrough', icon: PlayCircle },
                { id: 'virtual', label: 'Virtual VR Tour', icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMediaTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeMediaTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content area */}
            <div className="p-4 bg-zinc-900/10 dark:bg-zinc-950/40">
              {activeMediaTab === 'photos' && (
                <div className="space-y-4">
                  <div className="w-full h-80 sm:h-96 relative rounded-xl overflow-hidden bg-zinc-950">
                    <img 
                      src={bld.images[activeImgIdx]} 
                      alt="Property view" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Thumbnails list */}
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {bld.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImgIdx(idx)}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activeImgIdx === idx ? 'border-indigo-500 scale-[1.03]' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="Thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMediaTab === 'video' && (
                <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-zinc-950 relative flex items-center justify-center">
                  {bld.videoUrl ? (
                    <video 
                      src={bld.videoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <PlayCircle className="w-12 h-12 text-zinc-600 mx-auto" />
                      <h4 className="font-bold text-zinc-400">Video Walkthrough Unconfigured</h4>
                      <p className="text-[10px] text-zinc-500 max-w-xs">The owner has not uploaded an official walkthrough video file for this property yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeMediaTab === 'virtual' && (
                <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-zinc-950 relative flex items-center justify-center">
                  {bld.virtualTourUrl ? (
                    <iframe 
                      src={bld.virtualTourUrl} 
                      className="w-full h-full border-none"
                      title="Virtual VR Tour"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Eye className="w-12 h-12 text-zinc-600 mx-auto" />
                      <h4 className="font-bold text-zinc-400">Virtual Tour Offline</h4>
                      <p className="text-[10px] text-zinc-500 max-w-xs">3D/VR Virtual Reality tour links are only available for Premium listings.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description & Overview */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-black text-lg text-zinc-900 dark:text-white">Property Description</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{bld.description}</p>
          </div>

          {/* Core Amenities */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-black text-lg text-zinc-900 dark:text-white">PG Amenities & Facilities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {bld.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850/40">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Wifi className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby places */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-black text-lg text-zinc-900 dark:text-white">Locality & Connectivity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">Colleges Nearby</span>
                <ul className="space-y-1.5">
                  {bld.nearbyColleges.map((c, idx) => (
                    <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">Corporate Parks</span>
                <ul className="space-y-1.5">
                  {bld.nearbyCompanies.map((c, idx) => (
                    <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">Transit Metro/Bus</span>
                <ul className="space-y-1.5">
                  {bld.nearbyMetro.map((c, idx) => (
                    <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Live Bed grid Booking layout */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-zinc-900 dark:text-white">Live Bed Availability Matrix</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Explore individual rooms by floor. Select any green indicator box to begin checking out and confirming your bed.
              </p>
            </div>
            
            <BedGrid 
              rooms={bld.rooms} 
              selectedBedId={selectedBed?.id}
              onSelectBed={handleSelectBed}
            />
          </div>

        </section>

        {/* Right Column - Booking Panel Checkout */}
        <aside className="lg:col-span-4 space-y-6">
          {/* General pricing matrix card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm border-b border-zinc-100 dark:border-zinc-900 pb-3">Bill Breakdown Estimator</h3>
            <ul className="space-y-3">
              {[
                { label: 'Security Deposit (Refundable)', value: `₹${bld.baseDeposit.toLocaleString('en-IN')}` },
                { label: 'Monthly Base Food Charges', value: bld.foodCharges > 0 ? `₹${bld.foodCharges}/mo` : 'No Food Service' },
                { label: 'Electricity Consumption Rate', value: `₹${bld.electricityCharges}/unit` },
                { label: 'High Speed Wi-Fi Router', value: bld.wifiCharges > 0 ? `₹${bld.wifiCharges}/mo` : 'Free / Included' },
                { label: 'Housekeeping/Laundromat', value: `₹${bld.laundryCharges + bld.housekeepingCharges}/mo` },
              ].map((item, idx) => (
                <li key={idx} className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-zinc-800 dark:text-zinc-300">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout Slide-in Form Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>
            
            {!selectedBed ? (
              <div className="text-center py-12 space-y-3">
                <ShieldQuestion className="w-10 h-10 text-zinc-400 mx-auto" />
                <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Reserve a Bed</h4>
                <p className="text-[11px] text-zinc-500 max-w-[200px] mx-auto">
                  Click on an available bed (Green) in the live floor layout on the left to activate reservation panel.
                </p>
              </div>
            ) : (
              <form onSubmit={bookingLoading ? undefined : handleBookingSubmit} className="space-y-4">
                <h4 className="font-black text-sm border-b border-zinc-100 dark:border-zinc-900 pb-3">Selected Accommodation</h4>
                
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Room {selectedRoom?.roomNumber}</span>
                    <span className="block text-[10px] text-zinc-400 font-semibold">{selectedRoom?.sharingType} sharing capacity</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-indigo-500 block">
                      {discount > 0 ? (
                        <>
                          <span className="line-through text-xs text-zinc-400 mr-1.5">₹{selectedRoom?.price.toLocaleString('en-IN')}</span>
                          ₹{(selectedRoom ? selectedRoom.price - discount : 0).toLocaleString('en-IN')}/mo
                        </>
                      ) : (
                        `₹${selectedRoom?.price.toLocaleString('en-IN')}/mo`
                      )}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-400">Bed: {selectedBed.bedNumber}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                    {bookingError}
                  </div>
                )}

                {bookingSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold leading-relaxed space-y-1">
                    <span className="font-extrabold flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Booking Submitted!</span>
                    <p className="text-[10px] text-zinc-500">Your bed reservation is pending PG Owner review. Keep tracking status inside your dashboard bookings folder.</p>
                  </div>
                )}

                {/* Move in Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 block">Expected Move-in Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                    <input 
                      type="date"
                      required
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Simulated Payment Instructions */}
                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                  <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider block">Demo Payment Instructions</span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Scan Owner UPI QR code or transfer to details below to complete deposit amount of <b>₹{selectedRoom ? selectedRoom.price - discount : 0}</b>.
                  </p>
                  <div className="bg-white dark:bg-zinc-950 rounded border border-indigo-100 dark:border-zinc-900 p-2 text-center text-[10px] font-mono select-all">
                    UPI ID: <b>owner@paytm</b>
                  </div>
                </div>

                {/* Coupon System */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Promo Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Try WELCOME1000"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-600 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (couponCode.toUpperCase() === 'WELCOME1000') {
                          setDiscount(1000);
                          setCouponMsg('Promo coupon WELCOME1000 applied: ₹1,000 Off!');
                        } else {
                          setDiscount(0);
                          setCouponMsg('Invalid Coupon Code');
                        }
                      }}
                      className="px-3.5 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-650 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMsg && (
                    <span className={`text-[10px] font-bold block mt-1 ${discount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {couponMsg}
                    </span>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Transfer Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="BANK_TRANSFER">Direct IMPS Bank Transfer</option>
                    <option value="CASH">Handover Cash to Caretaker</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Reference / Transaction ID</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. TXN9988776655"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                  />
                </div>

                {/* Screenshot uploader */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 block">Upload Receipt Screenshot</label>
                  {!proofUrl ? (
                    <button
                      type="button"
                      onClick={handleUploadProof}
                      className="w-full py-4 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500">Click to upload UPI receipt</span>
                      <span className="text-[8px] text-zinc-400">PNG, JPG up to 5MB</span>
                    </button>
                  ) : (
                    <div className="p-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <img src={proofUrl} alt="Proof" className="w-8 h-8 rounded object-cover shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-500 truncate">receipt_screenshot.png</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setProofUrl('')}
                        className="text-[9px] font-black text-rose-500 hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit reservation */}
                <button
                  type="submit"
                  disabled={bookingLoading || bookingSuccess}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.01]"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Confirm Bed Booking'
                  )}
                </button>
              </form>
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}
