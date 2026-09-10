'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Calendar,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Home
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Programmes', href: '/dashboard/programmes', icon: BookOpen },
    { name: 'AI Coaching & Goals', href: '/dashboard/coaching', icon: Sparkles },
    { name: 'My Sessions', href: '/dashboard/sessions', icon: Calendar },
    { name: 'Purchases & Receipts', href: '/dashboard/purchases', icon: CreditCard },
    { name: 'My Profile', href: '/dashboard/profile', icon: User },
  ];

  const displayName = currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Beloved Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF8F5] text-stone-900">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-950 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <span className="font-serif font-semibold text-lg text-stone-900">Becoming Her</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-stone-700"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-white border-r border-stone-200 flex-shrink-0 z-40 md:min-h-screen`}
      >
        <div className="p-6 border-b border-stone-100 hidden md:flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-rose-950 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <span className="font-serif font-semibold text-lg text-stone-900 block leading-tight group-hover:text-rose-950 transition">
                Becoming Her
              </span>
              <span className="text-[10px] text-rose-800 font-semibold uppercase tracking-widest">
                Customer Portal
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-950 text-amber-100 flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-sm">
            {initial}
          </div>
          <div className="truncate flex-1">
            <h4 className="text-xs font-semibold text-stone-900 truncate">{displayName}</h4>
            <span className="text-[10px] text-emerald-700 font-medium block truncate">
              {currentUser?.email || 'Verified Member'}
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="px-4 py-2 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-rose-950 text-amber-50 shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-stone-500'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-200/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 space-y-2 mt-auto">
          <Link
            href="/services"
            className="flex items-center gap-2 text-xs font-medium text-rose-900 hover:text-rose-950 p-2 rounded-lg hover:bg-rose-50 transition"
          >
            <Sparkles className="w-4 h-4 text-rose-700" />
            <span>Explore Coaching Services</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-stone-600 hover:text-stone-900 p-2 rounded-lg hover:bg-stone-50 transition"
          >
            <Home className="w-4 h-4 text-stone-500" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-xs text-rose-800 hover:text-rose-950 p-2 rounded-lg hover:bg-rose-50 transition text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
