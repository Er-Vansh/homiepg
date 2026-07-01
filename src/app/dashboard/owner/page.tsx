'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, UserCheck, Receipt, CreditCard, Users, UsersRound, TrendingUp, 
  Plus, Check, X, ShieldAlert, Award, Calendar, ChevronRight, FileText, Loader2, Sparkles, Zap
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import AnalyticsChart from '@/components/analytics-chart';
import InvoiceModal from '@/components/invoice-modal';

// Interfaces mapping
interface UserData {
  name: string;
  email: string;
  role: 'USER' | 'OWNER' | 'SUPER_ADMIN';
}

interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  baseRent: number;
  baseDeposit: number;
  amenities: string[];
  electricityCharges?: number;
  waterCharges?: number;
  wifiCharges?: number;
  laundryCharges?: number;
  parkingCharges?: number;
  housekeepingCharges?: number;
  foodCharges?: number;
}

interface Booking {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  buildingName: string;
  roomNumber: string;
  bedNumber: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  paymentProofUrl?: string;
  transactionId?: string;
  createdAt: string;
}

interface Resident {
  id: string;
  name: string;
  phone: string;
  email: string;
  buildingId: string;
  roomId: string;
  buildingName: string;
  roomNumber: string;
  bedNumber: string;
  rentAmount: number;
  outstandingAmount: number;
  policeVerified: boolean;
  kycDocAadhaar?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

interface Payment {
  id: string;
  residentName: string;
  buildingName: string;
  amount: number;
  paymentType: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  billingPeriod: string;
  invoiceNumber: string;
}

interface Expense {
  id: string;
  buildingName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  attendance: { [month: string]: number };
}

interface AIInsights {
  occupancyForecast: { month: string; rate: number }[];
  expectedVacancies: { bedId: string; roomNumber: string; buildingName: string; date: string; residentName: string }[];
  priceRecommendations: { buildingId: string; buildingName: string; currentRent: number; recommendedRent: number; reason: string }[];
  expenseOptimization: { category: string; potentialSavings: number; tips: string[] };
}

export default function OwnerDashboard() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold tracking-wider">Loading ERP dashboard...</span>
      </div>
    }>
      <OwnerDashboardComponent />
    </React.Suspense>
  );
}

function OwnerDashboardComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'buildings' | 'bookings' | 'residents' | 'ledger' | 'expenses' | 'staff' | 'ai'>('analytics');

  useEffect(() => {
    const validTabs = ['analytics', 'buildings', 'bookings', 'residents', 'ledger', 'expenses', 'staff', 'ai'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [tab]);
  
  // Data lists
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [showCreateBuilding, setShowCreateBuilding] = useState(false);
  const [newBldName, setNewBldName] = useState('');
  const [newBldAddress, setNewBldAddress] = useState('');
  const [newBldCity, setNewBldCity] = useState('Noida');
  const [newBldArea, setNewBldArea] = useState('');
  const [newBldRent, setNewBldRent] = useState('');

  // Manual payment state
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [collectResidentId, setCollectResidentId] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectType, setCollectType] = useState('RENT');

  // Manual expense state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expBuildingId, setExpBuildingId] = useState('');
  const [expCategory, setExpCategory] = useState('FOOD');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Manual staff state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('CARETAKER');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSalary, setStaffSalary] = useState('');
  const [staffBldId, setStaffBldId] = useState('');
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);

  // Proof screenshot viewer
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Visual Layout Designer states
  const [showLayoutDesigner, setShowLayoutDesigner] = useState(false);
  const [designerLoading, setDesignerLoading] = useState(false);
  const [designerBuildingId, setDesignerBuildingId] = useState('');
  const [designerBuildingName, setDesignerBuildingName] = useState('');
  const [designerRooms, setDesignerRooms] = useState<any[]>([]);
  const [designerError, setDesignerError] = useState('');

  // Sub-Meter Utility Billing states
  const [showGenerateBills, setShowGenerateBills] = useState(false);
  const [billingBldId, setBillingBldId] = useState('');
  const [billingMonth, setBillingMonth] = useState('July 2026');
  const [billingUnits, setBillingUnits] = useState<{ [roomId: string]: number }>({});
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');

  const fetchERPData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meRes.ok || !meData.authenticated || meData.user.role !== 'OWNER') {
        router.push('/pgowner');
        return;
      }
      setUser(meData.user);

      // Parallel fetch ERP listings
      const [bldsRes, bkgsRes, resRes, payRes, expRes, empRes, aiRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/owner/bookings'),
        fetch('/api/owner/residents'),
        fetch('/api/owner/payments'),
        fetch('/api/owner/expenses'),
        fetch('/api/owner/employees'),
        fetch('/api/admin/ai-insights?scope=owner'),
      ]);

      const [blds, bkgs, residentsData, pays, exps, emps, aiData] = await Promise.all([
        bldsRes.json(),
        bkgsRes.json(),
        resRes.json(),
        payRes.json(),
        expRes.json(),
        empRes.json(),
        aiRes.json(),
      ]);

      if (blds.success) {
        // Filter buildings that belong to this owner (the list API returns all)
        setBuildings(blds.buildings.filter((b: any) => b.ownerId === meData.user.id));
      }
      if (bkgs.success) setBookings(bkgs.bookings);
      if (residentsData.success) setResidents(residentsData.residents);
      if (pays.success) setPayments(pays.payments);
      if (exps.success) setExpenses(exps.expenses);
      if (emps.success) setEmployees(emps.employees);
      if (aiData.success) setAiInsights(aiData.insights);

    } catch (e) {
      console.error('Failed to compile PG Owner ERP information', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchERPData();
  }, [router]);

  // Actions
  const handleBookingAction = async (bookingId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/owner/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      if (res.ok) {
        await fetchERPData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBldName,
          address: newBldAddress,
          city: newBldCity,
          area: newBldArea || 'Local Suburb',
          baseRent: parseFloat(newBldRent),
        }),
      });

      if (res.ok) {
        setShowCreateBuilding(false);
        setNewBldName('');
        setNewBldAddress('');
        setNewBldArea('');
        setNewBldRent('');
        await fetchERPData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmInvoicePayment = async (paymentId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/owner/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status: 'PAID' }),
      });
      if (res.ok) {
        await fetchERPData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualPaymentCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectResidentId) return;
    setActionLoading(true);

    const resident = residents.find(r => r.id === collectResidentId);
    const bld = buildings.find(b => b.name === resident?.buildingName);

    try {
      const res = await fetch('/api/owner/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: collectResidentId,
          buildingId: bld?.id || buildings[0]?.id,
          amount: parseFloat(collectAmount),
          paymentType: collectType,
          status: 'PAID',
          notes: 'Rent logged manually at the counter.',
        }),
      });

      if (res.ok) {
        setShowCollectPayment(false);
        setCollectAmount('');
        await fetchERPData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expBuildingId) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/owner/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: expBuildingId,
          category: expCategory,
          amount: parseFloat(expAmount),
          date: new Date().toISOString(),
          description: expDesc,
        }),
      });

      if (res.ok) {
        setShowAddExpense(false);
        setExpAmount('');
        setExpDesc('');
        await fetchERPData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffBldId) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/owner/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          role: staffRole,
          phone: staffPhone,
          salary: parseFloat(staffSalary),
          buildingId: staffBldId,
        }),
      });

      if (res.ok) {
        setShowAddStaff(false);
        setStaffName('');
        setStaffPhone('');
        setStaffSalary('');
        await fetchERPData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Visual Floor Layout Configurator Actions
  const handleOpenLayoutDesigner = async (bldId: string, bldName: string) => {
    setDesignerBuildingId(bldId);
    setDesignerBuildingName(bldName);
    setDesignerLoading(true);
    setDesignerError('');
    setShowLayoutDesigner(true);
    try {
      const res = await fetch(`/api/buildings/${bldId}`);
      const data = await res.json();
      if (data.success) {
        setDesignerRooms(data.building.rooms || []);
      } else {
        setDesignerError(data.error || 'Failed to load layout blueprint.');
      }
    } catch (e) {
      setDesignerError('Error fetching building configuration.');
    } finally {
      setDesignerLoading(false);
    }
  };

  const handleUpdateRoom = (idx: number, fields: any) => {
    const updated = [...designerRooms];
    const currentRoom = { ...updated[idx] };
    
    if (fields.sharingType !== undefined) {
      const newSharing = parseInt(fields.sharingType);
      let currentBeds = [...(currentRoom.beds || [])];
      if (currentBeds.length < newSharing) {
        for (let i = currentBeds.length; i < newSharing; i++) {
          const letter = String.fromCharCode(65 + i);
          currentBeds.push({ bedNumber: `${currentRoom.roomNumber}-${letter}`, status: 'AVAILABLE' });
        }
      } else if (currentBeds.length > newSharing) {
        const bedsToRemove = currentBeds.slice(newSharing);
        const hasActive = bedsToRemove.some(b => b.status === 'OCCUPIED' || b.status === 'RESERVED');
        if (hasActive) {
          alert("Cannot reduce sharing capacity below the number of occupied or reserved beds.");
          return;
        }
        currentBeds = currentBeds.slice(0, newSharing);
      }
      currentRoom.sharingType = newSharing;
      currentRoom.beds = currentBeds;
    }

    if (fields.roomNumber !== undefined) {
      const newRoomNo = fields.roomNumber;
      currentRoom.roomNumber = newRoomNo;
      if (currentRoom.beds) {
        currentRoom.beds = currentRoom.beds.map((b: any, index: number) => {
          const letter = String.fromCharCode(65 + index);
          return { ...b, bedNumber: `${newRoomNo}-${letter}` };
        });
      }
    }
    
    updated[idx] = { ...currentRoom, ...fields };
    setDesignerRooms(updated);
  };

  const handleDeleteRoom = (idx: number) => {
    const room = designerRooms[idx];
    if (room.beds && room.beds.some((b: any) => b.status === 'OCCUPIED' || b.status === 'RESERVED')) {
      alert("Cannot delete this room because it contains active occupants or reservations.");
      return;
    }
    const updated = [...designerRooms];
    updated.splice(idx, 1);
    setDesignerRooms(updated);
  };

  const handleSaveLayout = async () => {
    setDesignerLoading(true);
    setDesignerError('');
    try {
      const res = await fetch(`/api/buildings/${designerBuildingId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: designerRooms }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowLayoutDesigner(false);
        await fetchERPData();
      } else {
        setDesignerError(data.error || 'Failed to save layout configuration.');
      }
    } catch (e) {
      setDesignerError('Network error saving layout config.');
    } finally {
      setDesignerLoading(false);
    }
  };

  // Utility Bill Generator Action
  const handleGenerateUtilityBills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingBldId) return;
    setBillingLoading(true);
    setBillingError('');
    setBillingSuccess('');

    try {
      const bld = buildings.find(b => b.id === billingBldId);
      if (!bld) throw new Error('Building details not found.');

      const bldFullRes = await fetch(`/api/buildings/${billingBldId}`);
      const bldFullData = await bldFullRes.json();
      const bldFull = bldFullData.success ? bldFullData.building : bld;

      const activeResidents = residents.filter(r => r.buildingId === billingBldId && r.status === 'ACTIVE');
      if (activeResidents.length === 0) {
        setBillingError('No active residents in this building.');
        setBillingLoading(false);
        return;
      }

      let createdCount = 0;
      for (const resItem of activeResidents) {
        const units = billingUnits[resItem.roomId] || 0;
        
        const electricityCost = units * (bldFull.electricityCharges || 0);
        const waterCost = bldFull.waterCharges || 0;
        const wifiCost = bldFull.wifiCharges || 0;
        const laundryCost = bldFull.laundryCharges || 0;
        const parkingCost = bldFull.parkingCharges || 0;
        const housekeepingCost = bldFull.housekeepingCharges || 0;
        const foodCost = bldFull.foodCharges || 0;

        const totalBill = resItem.rentAmount + electricityCost + waterCost + wifiCost + laundryCost + parkingCost + housekeepingCost + foodCost;

        const breakdownNotes = `Monthly Combined Invoice. Base Rent: ₹${resItem.rentAmount.toLocaleString('en-IN')}, Electricity: ₹${electricityCost.toLocaleString('en-IN')} (${units} units at ₹${bldFull.electricityCharges}/unit), Wi-Fi: ₹${wifiCost}, Food: ₹${foodCost}, Water: ₹${waterCost}, Housekeeping: ₹${housekeepingCost + laundryCost}, Parking: ₹${parkingCost}`;

        const postRes = await fetch('/api/owner/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            residentId: resItem.id,
            buildingId: billingBldId,
            amount: totalBill,
            paymentType: 'RENT',
            status: 'PENDING',
            billingPeriod: billingMonth,
            notes: breakdownNotes,
          }),
        });

        if (postRes.ok) {
          createdCount++;
        }
      }

      setBillingSuccess(`Successfully generated ${createdCount} monthly invoices and updated resident ledgers.`);
      setBillingUnits({});
      await fetchERPData();
    } catch (err: any) {
      setBillingError(err.message || 'Error occurred during bill generation.');
    } finally {
      setBillingLoading(false);
    }
  };

  // Compile calculations for Analytics cards
  const totalBeds = residents.length + 10; // Demo offset
  const occupiedBeds = residents.length;
  const vacantBeds = totalBeds - occupiedBeds;
  const totalRevenue = residents.reduce((sum, r) => sum + r.rentAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const outstandingBal = residents.reduce((sum, r) => sum + r.outstandingAmount, 0);

  // Compile Chart point matrices
  const monthlyRevenueChartData = [
    { label: 'Jan', value: totalRevenue * 0.9 },
    { label: 'Feb', value: totalRevenue * 0.95 },
    { label: 'Mar', value: totalRevenue * 1.0 },
    { label: 'Apr', value: totalRevenue * 0.98 },
    { label: 'May', value: totalRevenue * 1.02 },
    { label: 'Jun', value: totalRevenue },
  ];

  const categoryExpensesChartData = [
    { label: 'Food', value: expenses.filter(e => e.category === 'FOOD').reduce((s, e) => s + e.amount, 0) || 5000 },
    { label: 'Utility', value: expenses.filter(e => e.category === 'ELECTRICITY' || e.category === 'WATER').reduce((s, e) => s + e.amount, 0) || 4500 },
    { label: 'Salaries', value: expenses.filter(e => e.category === 'SALARY').reduce((s, e) => s + e.amount, 0) || 8000 },
    { label: 'Repairs', value: expenses.filter(e => e.category === 'REPAIRS' || e.category === 'MAINTENANCE').reduce((s, e) => s + e.amount, 0) || 3000 },
    { label: 'Misc', value: expenses.filter(e => e.category === 'MISCELLANEOUS' || e.category === 'GAS' || e.category === 'INTERNET').reduce((s, e) => s + e.amount, 0) || 2000 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-bold">Synchronizing ERP data engines...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {user && <Sidebar user={user} />}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header Tabs Navigation */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white">ERP Control Panel</h1>
            <p className="text-xs text-zinc-500 mt-1">Elite Living Spaces Co. System Ledger</p>
          </div>

          <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-250/50 dark:border-zinc-800/40">
            {[
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'buildings', label: 'Buildings', icon: Building },
              { id: 'bookings', label: 'Approvals', icon: UserCheck },
              { id: 'residents', label: 'Residents', icon: Users },
              { id: 'ledger', label: 'Ledger', icon: Receipt },
              { id: 'expenses', label: 'Expenses', icon: CreditCard },
              { id: 'staff', label: 'Staff', icon: UsersRound },
              { id: 'ai', label: 'AI Predictor', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in">
              {/* Telemetry Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Occupied Beds', value: `${occupiedBeds}/${totalBeds}`, desc: `${vacantBeds} beds vacant` },
                  { label: 'Monthly Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, desc: 'Rent invoices realized' },
                  { label: 'Outflow Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, desc: 'Bills & salaries paid' },
                  { label: 'Outstanding Balance', value: `₹${outstandingBal.toLocaleString('en-IN')}`, desc: 'Rent collection pending', alert: outstandingBal > 0 },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">{card.label}</span>
                    <h3 className={`text-2xl font-black mt-2 ${card.alert ? 'text-rose-500' : 'text-zinc-900 dark:text-white'}`}>{card.value}</h3>
                    <p className="text-[10px] text-zinc-500 mt-2 font-medium">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">Revenue Growth Trend</h4>
                  <AnalyticsChart data={monthlyRevenueChartData} type="line" color="#6366f1" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">Expenses Distribution</h4>
                  <AnalyticsChart data={categoryExpensesChartData} type="bar" color="#ec4899" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUILDINGS MANAGEMENT */}
          {activeTab === 'buildings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base">My Managed PGs</h3>
                  <p className="text-xs text-zinc-500">Configure buildings and automatic floor blueprints.</p>
                </div>
                <button
                  onClick={() => setShowCreateBuilding(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Property
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildings.map((b) => (
                  <div key={b.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Building className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-base leading-tight mt-3">{b.name}</h4>
                      <p className="text-xs text-zinc-500">{b.address}, {b.city}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                      <div>
                        <span className="text-[8px] uppercase font-bold text-zinc-400 block">Base Rent</span>
                        <span className="text-xs font-bold text-indigo-500">₹{b.baseRent.toLocaleString('en-IN')}/mo</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenLayoutDesigner(b.id, b.name)}
                          className="text-[10px] font-black text-indigo-650 hover:underline cursor-pointer"
                        >
                          Configure Layout
                        </button>
                        <Link 
                          href={`/pg/${b.id}`} 
                          className="text-[10px] font-black text-zinc-500 hover:underline flex items-center gap-0.5"
                        >
                          Public page <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BOOKINGS APPROVALS */}
          {activeTab === 'bookings' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="font-bold text-base">Lease Approvals Queue</h3>
                <p className="text-xs text-zinc-500 mt-1">Review transaction references and unlock occupant spaces.</p>
              </div>

              {bookings.filter(b => b.status === 'PENDING').length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400">All pending bed reservations processed.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Tenant Details</th>
                        <th className="p-4">PG Allocation</th>
                        <th className="p-4">Transaction ID</th>
                        <th className="p-4">Proof Receipt</th>
                        <th className="p-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                      {bookings.filter(b => b.status === 'PENDING').map((b) => (
                        <tr key={b.id}>
                          <td className="p-4">
                            <span className="font-bold block text-zinc-850 dark:text-zinc-200">{b.tenantName}</span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{b.tenantEmail} | {b.tenantPhone}</span>
                          </td>
                          <td className="p-4">
                            <span className="block">{b.buildingName}</span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">Room {b.roomNumber} • Bed {b.bedNumber}</span>
                          </td>
                          <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">{b.transactionId || 'None'}</td>
                          <td className="p-4">
                            {b.paymentProofUrl ? (
                              <button
                                onClick={() => setViewProofUrl(b.paymentProofUrl!)}
                                className="text-indigo-500 hover:text-indigo-400 underline font-bold"
                              >
                                View Screenshot
                              </button>
                            ) : (
                              <span className="text-zinc-400">No Proof Uploaded</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleBookingAction(b.id, 'APPROVE')}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleBookingAction(b.id, 'REJECT')}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESIDENTS ROSTER */}
          {activeTab === 'residents' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="font-bold text-base">Active Tenants Directory</h3>
                <p className="text-xs text-zinc-500 mt-1">Audit Aadhaar locker and police verification statuses.</p>
              </div>

              {residents.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400">No active tenants registered.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Resident</th>
                        <th className="p-4">Allocation</th>
                        <th className="p-4">KYC Aadhaar</th>
                        <th className="p-4">Police Status</th>
                        <th className="p-4">Outstanding Bal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                      {residents.map((r) => (
                        <tr key={r.id}>
                          <td className="p-4">
                            <span className="font-bold block text-zinc-850 dark:text-zinc-200">{r.name}</span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{r.phone} | {r.email}</span>
                          </td>
                          <td className="p-4">
                            <span className="block">{r.buildingName}</span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">Room {r.roomNumber} • Bed {r.bedNumber}</span>
                          </td>
                          <td className="p-4">
                            {r.kycDocAadhaar ? (
                              <span className="text-emerald-500 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Locker File
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold">Unsubmitted</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              r.policeVerified 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {r.policeVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={r.outstandingAmount > 0 ? 'text-rose-500 font-bold' : 'text-zinc-500'}>
                              ₹{r.outstandingAmount.toLocaleString('en-IN')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LEDGER & PAYMENTS */}
          {activeTab === 'ledger' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base">Revenue & Rent Ledger</h3>
                  <p className="text-xs text-zinc-500">Collect manual offline cash rents and audit digital transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBillingBldId('');
                      setBillingSuccess('');
                      setBillingError('');
                      setShowGenerateBills(true);
                    }}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-500" /> Utility Sub-Meter
                  </button>
                  <button
                    onClick={() => setShowCollectPayment(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Collect Rent
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                {payments.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-400">No payment invoices logged.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Invoice #</th>
                          <th className="p-4">Resident</th>
                          <th className="p-4">PG Building</th>
                          <th className="p-4">Billing Month</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">State</th>
                          <th className="p-4 text-right">Confirm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">{p.invoiceNumber}</td>
                            <td className="p-4">{p.residentName}</td>
                            <td className="p-4">{p.buildingName}</td>
                            <td className="p-4">{p.billingPeriod}</td>
                            <td className="p-4 text-indigo-500">₹{p.amount.toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                p.status === 'PAID' 
                                  ? 'bg-emerald-500/10 text-emerald-500' 
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {p.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleConfirmInvoicePayment(p.id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const res = residents.find(r => r.name === p.residentName);
                                    setViewInvoice({
                                      ...p,
                                      residentPhone: res?.phone || '',
                                      roomNumber: res?.roomNumber || '',
                                      bedNumber: res?.bedNumber || '',
                                    });
                                  }}
                                  className="text-[10px] text-indigo-500 hover:underline font-bold"
                                >
                                  Print / Receipt
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

          {/* TAB 6: EXPENSES LEDGER */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base">Operational Outflow Expenses</h3>
                  <p className="text-xs text-zinc-500">Log utility invoices, grocery items, and caretaker wages.</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                {expenses.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-400">No expense outflows logged.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="p-4">PG Property</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Outflow Amount</th>
                          <th className="p-4">Logged Date</th>
                          <th className="p-4">Statement description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                        {expenses.map((e) => (
                          <tr key={e.id}>
                            <td className="p-4 font-bold">{e.buildingName}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                {e.category}
                              </span>
                            </td>
                            <td className="p-4 text-rose-500">₹{e.amount.toLocaleString('en-IN')}</td>
                            <td className="p-4">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="p-4 text-zinc-500 leading-relaxed max-w-xs truncate">{e.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: STAFF ROSTER */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base">Property Staff & Payroll</h3>
                  <p className="text-xs text-zinc-500">Record wages, caretaker attendance, and cleaner ratings.</p>
                </div>
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Recruit Worker
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                {employees.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-400">No staff workers recruited.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">ERP Role</th>
                          <th className="p-4">Phone contact</th>
                          <th className="p-4">Wages / Salary</th>
                          <th className="p-4">June Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                        {employees.map((emp) => (
                          <tr key={emp.id}>
                            <td className="p-4 font-bold">{emp.name}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                {emp.role}
                              </span>
                            </td>
                            <td className="p-4 font-mono">{emp.phone}</td>
                            <td className="p-4 text-indigo-500">₹{emp.salary.toLocaleString('en-IN')}/mo</td>
                            <td className="p-4">{emp.attendance['2026-06'] !== undefined ? `${emp.attendance['2026-06']}/30 days` : 'Not Logged'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: AI PREDICTIONS FORECAST */}
          {activeTab === 'ai' && (
            <div className="space-y-8 animate-fade-in max-w-4xl">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">AI Pricing & Vacancy Insights</h3>
                    <p className="text-xs text-zinc-500">Predictive occupancy optimization analysis.</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800"></div>

                {aiInsights ? (
                  <div className="space-y-8">
                    {/* Price recommendations */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">Price recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiInsights.priceRecommendations.map((rec, idx) => (
                          <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950/40 space-y-3">
                            <span className="text-[10px] font-bold text-zinc-500 block">{rec.buildingName}</span>
                            <div className="flex justify-between items-baseline pt-1">
                              <span className="text-zinc-400 text-xs">Current: ₹{rec.currentRent}</span>
                              <span className="text-indigo-500 font-extrabold text-sm flex items-center gap-1">
                                Recommended: ₹{rec.recommendedRent} <TrendingUp className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2 font-medium">
                              {rec.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational tip card */}
                    <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-xl space-y-3">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider block">AI Operational Tips</span>
                      <ul className="space-y-2">
                        {aiInsights.expenseOptimization.tips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-400">Loading AI heuristics forecasts...</div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: VIEW UPI PROOF SCREENSHOT */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs">Verification UPI Receipt Screenshot</h3>
              <button 
                onClick={() => setViewProofUrl(null)}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <div className="w-full h-80 rounded-xl overflow-hidden bg-zinc-950">
              <img src={viewProofUrl} alt="Transaction screenshot proof" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUAL LAYOUT BLUEPRINT DESIGNER */}
      {showLayoutDesigner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-zinc-900 dark:text-white">Visual Floor Blueprint & Room Designer</h3>
                <p className="text-xs text-zinc-500">{designerBuildingName}</p>
              </div>
              <button 
                onClick={() => setShowLayoutDesigner(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            {designerError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
                {designerError}
              </div>
            )}

            {designerLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-500 font-bold">Saving changes to building layout engine...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(new Set(designerRooms.map(r => r.floorNumber || 1))).sort((a, b) => a - b).map(floorNum => {
                  const floorRooms = designerRooms.filter(r => (r.floorNumber || 1) === floorNum);
                  return (
                    <div key={floorNum} className="space-y-3 border-t border-zinc-150 dark:border-zinc-800 pt-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Floor {floorNum}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newRoomNumber = `${floorNum}${String(floorRooms.length + 1).padStart(2, '0')}`;
                            const baseRent = buildings.find(b => b.id === designerBuildingId)?.baseRent || 10000;
                            const newRoom = {
                              floorNumber: floorNum,
                              roomNumber: newRoomNumber,
                              sharingType: 2,
                              hasAC: false,
                              hasWashroom: true,
                              price: baseRent,
                              beds: [
                                { bedNumber: `${newRoomNumber}-A`, status: 'AVAILABLE' },
                                { bedNumber: `${newRoomNumber}-B`, status: 'AVAILABLE' }
                              ]
                            };
                            setDesignerRooms([...designerRooms, newRoom]);
                          }}
                          className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-850 text-zinc-650 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          + Add Room on Floor {floorNum}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {floorRooms.map((room, roomIdx) => {
                          const globalIdx = designerRooms.findIndex(r => r === room);
                          return (
                            <div key={roomIdx} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-855/60 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300">Config: Room {room.roomNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoom(globalIdx)}
                                  className="text-[10px] text-rose-500 font-extrabold hover:underline"
                                >
                                  Remove Room
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Room #</label>
                                  <input
                                    type="text"
                                    value={room.roomNumber}
                                    onChange={(e) => handleUpdateRoom(globalIdx, { roomNumber: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 outline-none font-semibold text-zinc-800 dark:text-zinc-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Price (₹)</label>
                                  <input
                                    type="number"
                                    value={room.price}
                                    onChange={(e) => handleUpdateRoom(globalIdx, { price: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 outline-none font-semibold text-zinc-800 dark:text-zinc-100"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={room.hasAC}
                                    onChange={(e) => handleUpdateRoom(globalIdx, { hasAC: e.target.checked })}
                                    className="accent-indigo-600"
                                  />
                                  <span>AC Room</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={room.hasWashroom}
                                    onChange={(e) => handleUpdateRoom(globalIdx, { hasWashroom: e.target.checked })}
                                    className="accent-indigo-600"
                                  />
                                  <span>Private Bath</span>
                                </label>

                                <div className="flex items-center gap-1">
                                  <span className="text-zinc-400">Sharing:</span>
                                  <select
                                    value={room.sharingType}
                                    onChange={(e) => handleUpdateRoom(globalIdx, { sharingType: parseInt(e.target.value) })}
                                    className="bg-transparent border-none outline-none font-extrabold text-zinc-750 dark:text-zinc-300"
                                  >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                  </select>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-zinc-200/55 dark:border-zinc-850 text-[10px] space-y-1">
                                <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Beds Structure</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {room.beds && room.beds.map((bed: any, bIdx: number) => (
                                    <span
                                      key={bIdx}
                                      className={`px-2 py-1 rounded border text-[9px] font-black ${
                                        bed.status === 'OCCUPIED' 
                                          ? 'bg-rose-500/10 text-rose-500 border-rose-500' 
                                          : bed.status === 'RESERVED' 
                                          ? 'bg-amber-500/10 text-amber-500 border-amber-500' 
                                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500'
                                      }`}
                                    >
                                      {bed.bedNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-150 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      const maxFloor = designerRooms.length > 0 ? Math.max(...designerRooms.map(r => r.floorNumber || 1)) : 0;
                      const nextFloor = maxFloor + 1;
                      const baseRent = buildings.find(b => b.id === designerBuildingId)?.baseRent || 10000;
                      const newRoomNumber = `${nextFloor}01`;
                      const newRoom = {
                        floorNumber: nextFloor,
                        roomNumber: newRoomNumber,
                        sharingType: 2,
                        hasAC: false,
                        hasWashroom: true,
                        price: baseRent,
                        beds: [
                          { bedNumber: `${newRoomNumber}-A`, status: 'AVAILABLE' },
                          { bedNumber: `${newRoomNumber}-B`, status: 'AVAILABLE' }
                        ]
                      };
                      setDesignerRooms([...designerRooms, newRoom]);
                    }}
                    className="px-4 py-2 border border-zinc-250 dark:border-zinc-700 text-zinc-650 hover:text-zinc-850 dark:hover:text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    + Add Floor
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLayout}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Save Layout Blueprint
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: UTILITY SUB-METER BILL GENERATION */}
      {showGenerateBills && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-base text-zinc-900 dark:text-white">Sub-Meter Utility Billing Console</h3>
                <p className="text-xs text-zinc-500">Calculate electricity units consumption and append local amenities costs.</p>
              </div>
              <button 
                onClick={() => setShowGenerateBills(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            {billingSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                {billingSuccess}
              </div>
            )}

            {billingError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold">
                {billingError}
              </div>
            )}

            <form onSubmit={handleGenerateUtilityBills} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Select Property</label>
                  <select
                    value={billingBldId}
                    onChange={(e) => {
                      setBillingBldId(e.target.value);
                      setBillingUnits({});
                      setBillingSuccess('');
                      setBillingError('');
                    }}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 font-semibold outline-none focus:border-indigo-600 text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">-- Choose PG Building --</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Billing Period / Month</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. July 2026"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 font-semibold outline-none focus:border-indigo-600 text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {billingBldId && (
                <div className="space-y-4">
                  <h4 className="font-extrabold uppercase tracking-wide text-zinc-400 text-[10px]">Sub-Meter Units Input Table</h4>
                  
                  {residents.filter(r => r.buildingId === billingBldId && r.status === 'ACTIVE').length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      No active residents currently checked into this property.
                    </div>
                  ) : (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Resident</th>
                            <th className="p-3">Room / Bed</th>
                            <th className="p-3">Units consumed</th>
                            <th className="p-3 text-right">Preview Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold text-zinc-700 dark:text-zinc-300">
                          {residents.filter(r => r.buildingId === billingBldId && r.status === 'ACTIVE').map(resItem => {
                            const bld = buildings.find(b => b.id === billingBldId);
                            const u = billingUnits[resItem.roomId] || 0;
                            const elecCost = u * (bld?.electricityCharges || 10);
                            const otherCost = (bld?.waterCharges || 0) + (bld?.wifiCharges || 0) + (bld?.laundryCharges || 0) + (bld?.parkingCharges || 0) + (bld?.housekeepingCharges || 0) + (bld?.foodCharges || 0);
                            const previewTotal = resItem.rentAmount + elecCost + otherCost;

                            return (
                              <tr key={resItem.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                                <td className="p-3">
                                  <div className="font-bold">{resItem.name}</div>
                                  <div className="text-[10px] text-zinc-500 font-medium">{resItem.email}</div>
                                </td>
                                <td className="p-3">Room {resItem.roomNumber} ({resItem.bedNumber})</td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={billingUnits[resItem.roomId] || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setBillingUnits({ ...billingUnits, [resItem.roomId]: val });
                                    }}
                                    className="w-20 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-2 py-1 outline-none font-bold text-zinc-800 dark:text-zinc-100 text-center"
                                  />
                                </td>
                                <td className="p-3 text-right text-indigo-500 font-extrabold">
                                  ₹{previewTotal.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {residents.filter(r => r.buildingId === billingBldId && r.status === 'ACTIVE').length > 0 && (
                    <button
                      type="submit"
                      disabled={billingLoading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-650 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {billingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Generate Invoices & Post to Ledgers'
                      )}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PROPERTY */}
      {showCreateBuilding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-base">Add New PG Listing</h3>
              <button 
                onClick={() => setShowCreateBuilding(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Property Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Luxury Residence"
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Target City</label>
                  <select
                    value={newBldCity}
                    onChange={(e) => setNewBldCity(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="Noida">Noida</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Area Sector</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Koramangala 4th Block"
                    value={newBldArea}
                    onChange={(e) => setNewBldArea(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Full Land Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 15, Near Central Park Metro Station"
                  value={newBldAddress}
                  onChange={(e) => setNewBldAddress(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Base Monthly Rent (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 12000"
                  value={newBldRent}
                  onChange={(e) => setNewBldRent(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Listing Setup'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT RENT MANUALLY */}
      {showCollectPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-base">Collect Rent Offline</h3>
              <button 
                onClick={() => setShowCollectPayment(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleManualPaymentCollect} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Select Tenant</label>
                <select
                  required
                  value={collectResidentId}
                  onChange={(e) => setCollectResidentId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                >
                  <option value="">Choose resident...</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.buildingName} - Room {r.roomNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Payment Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Collection Type</label>
                  <select
                    value={collectType}
                    onChange={(e) => setCollectType(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="RENT">Lease Rent</option>
                    <option value="DEPOSIT">Security Deposit</option>
                    <option value="UTILITIES">Utility Bills</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log Payment Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-base">Record Operational Expense</h3>
              <button 
                onClick={() => setShowAddExpense(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Select Property</label>
                <select
                  required
                  value={expBuildingId}
                  onChange={(e) => setExpBuildingId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                >
                  <option value="">Select target building...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Outflow Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Expense Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="FOOD">Food & Groceries</option>
                    <option value="ELECTRICITY">Electricity Utilities</option>
                    <option value="WATER">Water Supply Charges</option>
                    <option value="GAS">Gas / LPG Refill</option>
                    <option value="INTERNET">Internet Wi-Fi Invoice</option>
                    <option value="HOUSEKEEPING">Housekeeping Supplies</option>
                    <option value="SALARY">Employee Salary Wages</option>
                    <option value="REPAIRS">Emergency Repair Works</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Description Notes</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Caretaker daily salary or Weekly vegetable supply"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log Expense Statement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-base">Recruit Staff Personnel</h3>
              <button 
                onClick={() => setShowAddStaff(false)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bahadur Singh"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Staff Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="CARETAKER">Property Caretaker</option>
                    <option value="GUARD">Security Guard</option>
                    <option value="CLEANER">Cleaning Staff</option>
                    <option value="COOK">Cook chef</option>
                    <option value="MANAGER">Branch General Manager</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Phone contact</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +919988776655"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:border-indigo-600 placeholder-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Allocate Property</label>
                <select
                  required
                  value={staffBldId}
                  onChange={(e) => setStaffBldId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                >
                  <option value="">Select building...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Staff to Ledger'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice PDF Modal */}
      {viewInvoice && (
        <InvoiceModal 
          invoice={viewInvoice} 
          onClose={() => setViewInvoice(null)} 
        />
      )}

    </div>
  );
}
