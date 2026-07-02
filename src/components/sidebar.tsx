'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Logo } from './logo';
import { 
  LayoutDashboard, Building2, Users, Receipt, CreditCard, 
  Settings, LogOut, Search, UserCheck, HelpCircle, 
  Activity, TrendingUp, ShieldAlert, BadgeInfo, FileCheck, UsersRound
} from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: 'USER' | 'OWNER' | 'SUPER_ADMIN';
  };
}

export default function Sidebar({ user }: SidebarProps) {
  return (
    <React.Suspense fallback={
      <div className="w-64 bg-white border-r border-zinc-200 text-zinc-400 p-6">
        Loading nav desk...
      </div>
    }>
      <SidebarContent user={user} />
    </React.Suspense>
  );
}

function SidebarContent({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const handleLogout = async () => {
    try {
      const endpoint = user.role === 'SUPER_ADMIN' ? '/api/admin/auth/logout' : '/api/auth/logout';
      const redirectPath = user.role === 'SUPER_ADMIN' 
        ? '/admin' 
        : user.role === 'OWNER' 
          ? '/pgowner' 
          : '/login';
      
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const getLinks = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard Telemetry', href: '/dashboard/admin?tab=telemetry', icon: LayoutDashboard },
          { name: 'Verify PG Owners', href: '/dashboard/admin?tab=owners', icon: UserCheck },
          { name: 'Platform Support', href: '/dashboard/admin?tab=tickets', icon: HelpCircle },
          { name: 'Security Audit Logs', href: '/dashboard/admin?tab=audits', icon: Activity },
          { name: 'AI Geolocation Insights', href: '/dashboard/admin?tab=ai', icon: TrendingUp },
        ];
      case 'OWNER':
        return [
          { name: 'Analytics Summary', href: '/dashboard/owner?tab=analytics', icon: LayoutDashboard },
          { name: 'My PG Properties', href: '/dashboard/owner?tab=buildings', icon: Building2 },
          { name: 'Lease Approvals', href: '/dashboard/owner?tab=bookings', icon: UserCheck },
          { name: 'Residents Roster', href: '/dashboard/owner?tab=residents', icon: Users },
          { name: 'Rent Ledger', href: '/dashboard/owner?tab=ledger', icon: Receipt },
          { name: 'Outflow Expenses', href: '/dashboard/owner?tab=expenses', icon: CreditCard },
          { name: 'Staff & Payroll', href: '/dashboard/owner?tab=staff', icon: UsersRound },
          { name: 'AI Price recommendations', href: '/dashboard/owner?tab=ai', icon: TrendingUp },
        ];
      case 'USER':
        return [
          { name: 'Accommodation Lease', href: '/dashboard/user?tab=stay', icon: LayoutDashboard },
          { name: 'Explore Rooms / PGs', href: '/dashboard/user?tab=search', icon: Search },
          { name: 'Digital KYC Locker', href: '/dashboard/user?tab=kyc', icon: FileCheck },
          { name: 'Support Helpdesk', href: '/dashboard/user?tab=helpdesk', icon: HelpCircle },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 text-zinc-600 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Logo */}
      <div className="p-4 border-b border-zinc-200">
        <Link href="/" className="block">
          <Logo className="w-8 h-8" showText={true} darkText={true} />
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          
          // Compute active state based on pathname and tab parameter
          const linkUrl = new URL(link.href, 'http://localhost');
          const linkTab = linkUrl.searchParams.get('tab');
          const isMainMatch = pathname === linkUrl.pathname;
          
          // Special fallback case: if tab parameter is not set in URL, assume the default tab is active
          const isTabMatch = linkTab 
            ? currentTab === linkTab 
            : (!currentTab || currentTab === 'stay' || currentTab === 'analytics' || currentTab === 'telemetry');
            
          const isActive = isMainMatch && isTabMatch;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs uppercase border border-indigo-200">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-800 truncate">{user.name}</p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-200 tracking-wider">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-rose-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout Session
        </button>
      </div>
    </aside>
  );
}
