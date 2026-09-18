import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  FileText,
  Calendar,
  Moon,
  Globe,
  Tag,
  BookOpen,
  History,
  Brain,
  MessageSquare
} from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { AdminUserBadge } from '@/components/AdminUserBadge';
import { getUserRole, isAdminRole } from '@/lib/auth/roles';
import { BrandLogo } from '@/components/BrandLogo';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';

  // If viewing the admin login page, bypass layout shell and auth requirement
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Enforce account login requirement on the server
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/admin/login?redirect=' +
        encodeURIComponent(pathname || '/admin') +
        '&message=' +
        encodeURIComponent('Please sign in with your administrative account to access the console.')
    );
  }

  // Strict Role-Based Access Control: Deny customers from accessing administrative portal
  const role = await getUserRole(user, supabase);
  if (!isAdminRole(role)) {
    redirect(
      '/admin/login?message=' +
        encodeURIComponent(
          "You don't have access rights"
        )
    );
  }

  const adminName = user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator';
  const adminEmail = user.email || 'admin@becomingher.co.ke';

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'WhatsApp Assistant', href: '/admin/whatsapp', icon: MessageSquare },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Services Catalog', href: '/admin/services', icon: FileText },
    { name: 'Curriculum & Modules', href: '/admin/programmes', icon: BookOpen },
    { name: 'Bookings & Calendar', href: '/admin/bookings', icon: Calendar },
    { name: 'Payments & Selar', href: '/admin/payments', icon: CreditCard },
    { name: 'Website CMS', href: '/admin/cms', icon: Globe },
    { name: 'Sanctuary Knowledge Base', href: '/admin/knowledge-base', icon: Brain },
    { name: 'Coupons & Discounts', href: '/admin/coupons', icon: Tag },
    { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#FAF8F5] text-stone-900">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-r border-stone-200 bg-white flex-shrink-0 z-30">
        <div className="flex h-20 items-center justify-between border-b border-stone-100 px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <BrandLogo size="sm" variant="light" showText={false} />
            <div>
              <span className="font-serif font-bold text-base text-stone-900 leading-none block">
                Becoming Her
              </span>
              <span className="text-[10px] text-rose-800 font-semibold uppercase tracking-widest">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Authenticated Admin Badge with Live User Account Details */}
        <AdminUserBadge name={adminName} email={adminEmail} role={role} />

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
            >
              <item.icon className="h-4 w-4 text-rose-850 text-stone-500" />
              <span>{item.name}</span>
            </Link>
          ))}

          <div className="pt-4 mt-2 border-t border-stone-100 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              <Moon className="h-4 w-4 text-rose-800" />
              <span>Switch to Customer View</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Exit to Public Website</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
