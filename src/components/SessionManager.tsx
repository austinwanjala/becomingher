'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { performClientSignOut, SESSION_ACTIVE_KEY, TAB_CHANNEL_NAME } from '@/lib/auth/session';

/**
 * SessionManager enforces tab-level and browser-level session lifecycle:
 * 1. When the browser or tab is closed, previous session storage is lost.
 * 2. On protected routes (/dashboard or /admin), if no active tab session exists
 *    and no other sibling tab confirms an active session, the user is signed out
 *    and redirected to login.
 * 3. In-tab page navigations and reloads (F5) preserve the session seamlessly.
 * 4. Explicit logout in any tab immediately terminates sessions across all open tabs.
 */
export function SessionManager() {
  const pathname = usePathname();
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Scrub legacy persistent tokens from localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {}

    // 2. Set up cross-tab broadcast channel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(TAB_CHANNEL_NAME);
        channel.onmessage = async (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === 'PING') {
            // Sibling tab asks if we have an active session
            if (sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true') {
              try {
                channel?.postMessage({ type: 'PONG' });
              } catch (_) {}
            }
          } else if (data.type === 'LOGOUT') {
            // Sibling tab logged out; terminate session here as well
            sessionStorage.removeItem(SESSION_ACTIVE_KEY);
            const isProtected = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
            if (isProtected) {
              window.location.href = pathname?.startsWith('/admin') ? '/admin/login' : '/login';
            }
          } else if (data.type === 'LOGIN') {
            // Sibling tab successfully logged in
            sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          }
        };
      }
    } catch (_) {}

    // 3. Fallback storage event listener for older browser profiles
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bh_tab_logout') {
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        const isProtected = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
        if (isProtected) {
          window.location.href = pathname?.startsWith('/admin') ? '/admin/login' : '/login';
        }
      } else if (e.key === 'bh_tab_ping' && e.newValue) {
        if (sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true') {
          try {
            localStorage.setItem('bh_tab_pong', Date.now().toString());
            setTimeout(() => localStorage.removeItem('bh_tab_pong'), 150);
          } catch (_) {}
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Session Verification for Protected and Auth Routes
    const verifySession = async () => {
      if (isVerifyingRef.current) return;
      isVerifyingRef.current = true;

      const isProtected = pathname?.startsWith('/dashboard') || (pathname?.startsWith('/admin') && pathname !== '/admin/login');
      const isAuthPage = pathname === '/login' || pathname === '/admin/login';
      const hasActiveSession = sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';

      if (hasActiveSession) {
        // Tab session is valid and active in current tab
        isVerifyingRef.current = false;
        return;
      }

      // If no tab session is recorded, query sibling tabs to see if another tab is currently open
      let siblingResponded = false;
      if (channel) {
        const handlePong = (e: MessageEvent) => {
          if (e.data?.type === 'PONG') {
            siblingResponded = true;
          }
        };
        channel.addEventListener('message', handlePong);
        try {
          channel.postMessage({ type: 'PING' });
        } catch (_) {}

        await new Promise((resolve) => setTimeout(resolve, 120));
        channel.removeEventListener('message', handlePong);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      if (siblingResponded) {
        // Sibling tab confirmed an active session exists
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        isVerifyingRef.current = false;
        return;
      }

      // No open tab responded: all tabs or browser was closed
      if (isProtected) {
        // Redirect to login requiring re-authentication
        const targetLogin = pathname?.startsWith('/admin')
          ? '/admin/login?message=' + encodeURIComponent('Your previous session ended. Please sign in to access the Administrative Console.')
          : '/login?message=' + encodeURIComponent('Your previous session ended. Please sign in to access your dashboard.');
        await performClientSignOut(targetLogin);
      } else if (isAuthPage) {
        // Clean up any stale cookies silently on auth page
        try {
          fetch('/api/auth/signout', { method: 'POST' });
        } catch (_) {}
      }

      isVerifyingRef.current = false;
    };

    verifySession();

    // 5. Subscribe to Supabase auth events
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        try {
          channel?.postMessage({ type: 'LOGIN' });
        } catch (_) {}
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
      try {
        channel?.close();
      } catch (_) {}
    };
  }, [pathname]);

  return null;
}
