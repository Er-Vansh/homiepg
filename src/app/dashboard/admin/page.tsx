'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, Users, Building, BadgeCheck, ShieldAlert, 
  HelpCircle, Activity, TrendingUp, Send, CheckCircle2, AlertTriangle, Loader2, PlaySquare 
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import AnalyticsChart from '@/components/analytics-chart';

interface UserData {
  name: string;
  email: string;
  role: 'USER' | 'OWNER' | 'SUPER_ADMIN';
}

interface AdminMetrics {
  totalOwners: number;
  totalBuildings: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  monthlyRevenue: number;
  totalUsers: number;
  activeUsers: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  billingPlanCounts: { [key: string]: number };
}

interface OwnerListItem {
  id: string;
  name: string;
  email: string;
  companyName: string;
  isApproved: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
  documentUrls: string[];
  subscriptionPlan: string;
  buildingsCount: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: string;
  creatorName: string;
  creatorRole: string;
  buildingName: string;
  messages: { sender: string; message: string; timestamp: string }[];
}

interface AuditLog {
  id: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

interface AIInsights {
  demandForecast: { city: string; area: string; score: number; trend: string; advice: string }[];
  priceRecommendations: { buildingName: string; currentRent: number; recommendedRent: number; reason: string }[];
}

export default function SuperAdminDashboard() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold tracking-wider">Loading admin panel...</span>
      </div>
    }>
      <SuperAdminDashboardComponent />
    </React.Suspense>
  );
}

function SuperAdminDashboardComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'owners' | 'tickets' | 'audits' | 'ai'>('telemetry');

  useEffect(() => {
    const validTabs = ['telemetry', 'owners', 'tickets', 'audits', 'ai'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [tab]);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [owners, setOwners] = useState<OwnerListItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Helpdesk Ticket Chat state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  const loadAdminTelemetry = async () => {
    try {
      const meRes = await fetch('/api/admin/auth/me');
      const meData = await meRes.json();
      if (!meRes.ok || !meData.success || meData.user.role !== 'SUPER_ADMIN') {
        router.push('/admin');
        return;
      }
      setUser(meData.user);

      // Parallel fetch admin control items
      const [metRes, ownRes, tktRes, logRes, aiRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/owners'),
        fetch('/api/tickets'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/ai-insights'),
      ]);

      const [met, owns, tkts, auditsData, aiData] = await Promise.all([
        metRes.json(),
        ownRes.json(),
        tktRes.json(),
        logRes.json(),
        aiRes.json(),
      ]);

      if (met.success) setMetrics(met.metrics);
      if (owns.success) setOwners(owns.owners);
      if (tkts.success) setTickets(tkts.tickets);
      if (auditsData.success) setLogs(auditsData.logs);
      if (aiData.success) setAiInsights(aiData.insights);

    } catch (e) {
      console.error('Failed to load Super Admin dashboard telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminTelemetry();
  }, [router]);

  // Actions
  const handleVerifyOwner = async (ownerId: string, status: 'VERIFIED' | 'SUSPENDED') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, verificationStatus: status }),
      });
      if (res.ok) {
        await loadAdminTelemetry();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
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
        await loadAdminTelemetry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: 'RESOLVED',
          message: 'Support Ticket has been resolved by Super Admin.',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        await loadAdminTelemetry();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Compile Subscription billing plans chart Point array
  const billingPlanChartData = metrics ? [
    { label: 'Basic', value: metrics.billingPlanCounts['BASIC'] || 0 },
    { label: 'Pro', value: metrics.billingPlanCounts['PRO'] || 0 },
    { label: 'Enterprise', value: metrics.billingPlanCounts['ENTERPRISE'] || 0 },
  ] : [];

  if (loading) {
    return (
      <div className="dark min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-bold">Unlocking administrative vaults...</span>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-zinc-50 dark:bg-zinc-950 flex text-zinc-900 dark:text-zinc-100">
      {user && <Sidebar user={user} />}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-zinc-950/20">
        
        {/* Secure Top Diagnostic Banner */}
        <div className="bg-zinc-950 border-b border-zinc-900/80 px-6 py-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-500 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-zinc-300 font-extrabold uppercase tracking-wider">Super Admin Security Vault</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span>IP PROTOCOL: <b>SECURE GATEWAY</b></span>
            <span>TOKEN ROTATION: <b>ACTIVE (JWT+REFRESH)</b></span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-black">SYSTEM OWNER ACTIVE</span>
          </div>
        </div>
        
        {/* Header Tabs */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white">Admin Platform Desk</h1>
            <p className="text-xs text-zinc-500 mt-1">Super Admin platform-wide oversight desk</p>
          </div>

          <div className="flex bg-zinc-150 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-250/50 dark:border-zinc-800/40">
            {[
              { id: 'telemetry', label: 'Telemetry', icon: Activity },
              { id: 'owners', label: 'Verify Owners', icon: Users },
              { id: 'tickets', label: 'Helpdesk', icon: HelpCircle },
              { id: 'audits', label: 'Security Logs', icon: Activity },
              { id: 'ai', label: 'AI Analytics', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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

        {/* Dashboards Panel Grid */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: TELEMETRY */}
          {activeTab === 'telemetry' && metrics && (
            <div className="space-y-8 animate-fade-in">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Global PG Owners', value: metrics.totalOwners, desc: 'Registered businesses' },
                  { label: 'Active Buildings', value: metrics.totalBuildings, desc: `${metrics.totalRooms} rooms total` },
                  { label: 'Occupancy Beds', value: `${metrics.occupiedBeds}/${metrics.totalBeds}`, desc: `${metrics.vacantBeds} vacant beds` },
                  { label: 'Cumulative Revenue', value: `₹${metrics.monthlyRevenue.toLocaleString('en-IN')}`, desc: 'Platform monthly cash-flow' },
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">{kpi.label}</span>
                    <h3 className="text-2xl font-black mt-2 text-zinc-900 dark:text-white">{kpi.value}</h3>
                    <p className="text-[10px] text-zinc-500 mt-2 font-medium">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Subscription distributions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">Subscriptions Distribution</h4>
                  <AnalyticsChart data={billingPlanChartData} type="bar" color="#6366f1" height={220} prefix="" />
                </div>
                {/* Bookings Stat Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                  <h4 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">Reservations Analytics</h4>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Pending Approvals</span>
                      <span className="font-black text-amber-500">{metrics.pendingBookings}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Approved Residents</span>
                      <span className="font-black text-emerald-500">{metrics.completedBookings}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Rejections / Cancellations</span>
                      <span className="font-black text-rose-500">{metrics.cancelledBookings}</span>
                    </div>
                  </div>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-850 my-2"></div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                    The platform occupancy rate is calculated at <b>{Math.round((metrics.occupiedBeds / (metrics.totalBeds || 1)) * 100)}%</b> based on active beds allocations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFY OWNERS */}
          {activeTab === 'owners' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="font-bold text-base">Owners Verification Desk</h3>
                <p className="text-xs text-zinc-500 mt-1">Review deeds and verify PG listing permissions.</p>
              </div>

              {owners.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400">No PG Owners registered on the platform.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Owner Profile</th>
                        <th className="p-4">Company Name</th>
                        <th className="p-4">Billing Plan</th>
                        <th className="p-4">Listings</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4 text-right">Administrative Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                      {owners.map((owner) => (
                        <tr key={owner.id}>
                          <td className="p-4">
                            <span className="font-bold block text-zinc-850 dark:text-zinc-200">{owner.name}</span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{owner.email}</span>
                          </td>
                          <td className="p-4 text-zinc-650 dark:text-zinc-350">{owner.companyName}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-indigo-500 uppercase tracking-wide">
                              {owner.subscriptionPlan}
                            </span>
                          </td>
                          <td className="p-4">{owner.buildingsCount} PGs</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              owner.verificationStatus === 'VERIFIED' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : owner.verificationStatus === 'SUSPENDED'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {owner.verificationStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {owner.verificationStatus !== 'VERIFIED' && (
                                <button
                                  onClick={() => handleVerifyOwner(owner.id, 'VERIFIED')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                                >
                                  Verify / Approve
                                </button>
                              )}
                              {owner.verificationStatus !== 'SUSPENDED' && (
                                <button
                                  onClick={() => handleVerifyOwner(owner.id, 'SUSPENDED')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                                >
                                  Suspend
                                </button>
                              )}
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

          {/* TAB 3: SUPPORT HELPDESK */}
          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              {/* Ticket Grid */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-sm">Grievance Ticket Logs</h3>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-900"></div>

                  <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                    {tickets.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-400">No support tickets generated on the platform.</div>
                    ) : (
                      tickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            selectedTicket?.id === t.id
                              ? 'border-indigo-600 bg-indigo-500/5'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-zinc-850 dark:text-zinc-200 leading-snug line-clamp-1 pr-2">{t.subject}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                              t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1.5">Category: {t.buildingName}</p>
                          <div className="flex items-center justify-between text-[8px] font-extrabold text-zinc-400 uppercase tracking-widest mt-3 pt-2 border-t border-zinc-150/40 dark:border-zinc-850/40">
                            <span>By: {t.creatorName} ({t.creatorRole})</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Chat panel */}
              <div className="lg:col-span-7">
                {selectedTicket ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[500px] shadow-sm flex flex-col justify-between overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
                      <div>
                        <h4 className="font-bold text-xs leading-none">{selectedTicket.subject}</h4>
                        <span className="text-[9px] text-zinc-400 mt-1 block">Sender: {selectedTicket.creatorName} ({selectedTicket.creatorRole})</span>
                      </div>
                      <div className="flex gap-2">
                        {selectedTicket.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolveTicket(selectedTicket.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold shadow-sm"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <span className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-wide">
                          {selectedTicket.priority}
                        </span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                      {selectedTicket.messages.map((msg, idx) => {
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

                    {/* Send reply */}
                    {selectedTicket.status !== 'RESOLVED' ? (
                      <form onSubmit={handleSendAdminReply} className="p-4 border-t border-zinc-150 dark:border-zinc-900 flex gap-2 items-center bg-zinc-50 dark:bg-zinc-950/40">
                        <input
                          type="text"
                          required
                          placeholder="Reply to property owner / resident ticket query..."
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
                        This administrative ticket is marked <b>RESOLVED</b>.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[500px] shadow-sm flex items-center justify-center text-center p-6 select-none">
                    <div className="space-y-2">
                      <HelpCircle className="w-12 h-12 text-zinc-400 mx-auto" />
                      <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Resolve Complaint Tickets</h4>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                        Click on any ticket in the grid list to view the support log thread.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADMINISTRATIVE SECURITY LOGS */}
          {activeTab === 'audits' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="font-bold text-base">Administrative Security Trail</h3>
                <p className="text-xs text-zinc-500 mt-1">Audit log of system actions.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Logged Time</th>
                      <th className="p-4">Security User</th>
                      <th className="p-4">Action tag</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Log Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                        <td className="p-4 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4">
                          <span className="font-bold block text-zinc-800 dark:text-zinc-200">{log.userName}</span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">{log.userEmail}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-zinc-500">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="p-4 text-zinc-500 leading-relaxed max-w-xs truncate">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AI PLATFORM ANALYTICS */}
          {activeTab === 'ai' && (
            <div className="space-y-8 animate-fade-in max-w-4xl">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-250 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">AI Platform Demand Geolocation Insights</h3>
                    <p className="text-xs text-zinc-500">Heuristics predictive analysis of active city markets.</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800"></div>

                {aiInsights ? (
                  <div className="space-y-8">
                    {/* Demand forecast cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {aiInsights.demandForecast.map((loc, idx) => (
                        <div key={idx} className="border border-zinc-200 dark:border-zinc-850 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-950/40 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs">{loc.city} ({loc.area})</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              loc.trend === 'UP' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-zinc-200 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-350'
                            }`}>
                              Demand Index: {loc.score}%
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                            {loc.advice}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-400">Loading AI predictive algorithms...</div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
