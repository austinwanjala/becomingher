'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Sparkles, User, LogOut, BookOpen, Calendar, CreditCard } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';
import { performClientSignOut } from '@/lib/auth/session';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    const handleAuthEvent = (e: CustomEvent) => {
      setUser(e.detail?.user || null);
    };
    window.addEventListener('becoming_her_auth_changed' as any, handleAuthEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('becoming_her_auth_changed' as any, handleAuthEvent);
    };
  }, []);

  const handleSignOut = async () => {
    await performClientSignOut('/login?message=' + encodeURIComponent('You have been signed out successfully. Please sign in to access your Customer Portal.'));
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Member';

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-stone-50/80 border-b border-stone-200/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo href="/" size="md" variant="light" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-rose-900 ${
                  isActive ? 'text-rose-950 font-semibold border-b-2 border-rose-900 pb-0.5' : 'text-stone-600'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100/70 border border-rose-200 text-rose-950 hover:bg-rose-100 text-xs font-semibold transition shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-rose-950 text-amber-100 flex items-center justify-center text-[10px] font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span>Customer Portal</span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 text-stone-500 hover:text-rose-950 hover:bg-stone-100 rounded-full transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login?redirect=/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/70 text-stone-800 hover:text-rose-950 text-xs font-semibold transition shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-rose-800" />
                <span>Customer Portal</span>
              </Link>
              <Link
                href="/login"
                className="text-xs font-medium text-stone-700 hover:text-rose-900 transition px-2 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-950 hover:bg-rose-200 transition"
              >
                Create Account
              </Link>
            </div>
          )}

          <Link
            href="/services/interpersonal-coaching"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 text-amber-50 hover:bg-rose-950 transition shadow-sm"
          >
            Book a Session
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-stone-700 hover:text-stone-950"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-stone-700 hover:text-rose-900 py-1"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 text-center text-sm font-semibold text-rose-950 bg-rose-100/80 rounded-xl"
                >
                  My Customer Portal ({userName})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2 text-center text-xs text-stone-600 hover:text-rose-950"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login?redirect=/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-center text-sm font-semibold text-rose-950 bg-rose-100/90 hover:bg-rose-100 rounded-xl transition"
                >
                  <User className="w-4 h-4 text-rose-800" />
                  <span>Customer Portal</span>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-medium text-stone-800 bg-stone-100 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-semibold bg-stone-900 text-amber-50 hover:bg-rose-950 rounded-xl transition"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-medium bg-stone-900 text-amber-50 rounded-xl shadow"
            >
              Explore Coaching Pathways
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
