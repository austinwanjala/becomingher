import { createClient } from '@/utils/supabase/client';

export const TAB_CHANNEL_NAME = 'becoming_her_tab_session';
export const SESSION_ACTIVE_KEY = 'bh_session_active';

/**
 * Robustly terminates both client-side and server-side Supabase sessions.
 * Clears sessionStorage, scrubs localStorage, broadcasts logout to other tabs,
 * revokes server cookies, and redirects cleanly.
 */
export async function performClientSignOut(
  redirectUrl: string = '/login'
) {
  // 1. Broadcast logout to all other open tabs immediately
  if (typeof window !== 'undefined') {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(TAB_CHANNEL_NAME);
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
      }
      localStorage.setItem('bh_tab_logout', Date.now().toString());
      setTimeout(() => localStorage.removeItem('bh_tab_logout'), 200);
    } catch (_) {}

    try {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      sessionStorage.clear();
      // Remove any lingering Supabase auth keys from localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
      // Dispatch event to inform any active components in this window
      window.dispatchEvent(new CustomEvent('becoming_her_auth_changed', { detail: { user: null } }));
    } catch (_) {}
  }

  try {
    const supabase = createClient();
    // 2. Clear client Supabase session
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Client signout error:', err);
  }

  try {
    // 3. Call server route to clear server cookies and Next.js cookie store
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Server signout fetch error:', err);
  }

  // 4. Perform a hard navigation to bust client router cache completely
  if (typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
}
