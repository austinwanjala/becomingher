import { createClient } from '@/utils/supabase/client';

/**
 * Robustly terminates both client-side and server-side Supabase sessions.
 * Clears localStorage, revokes server cookies, and redirects cleanly.
 */
export async function performClientSignOut(
  redirectUrl: string = '/login'
) {
  try {
    const supabase = createClient();
    // 1. Clear client browser session and localStorage tokens
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Client signout error:', err);
  }

  try {
    // 2. Call server route to clear server cookies and Next.js cookie store
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Server signout fetch error:', err);
  }

  // 3. Clear any lingering session markers
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
      // Dispatch event to inform any active components
      window.dispatchEvent(new CustomEvent('becoming_her_auth_changed', { detail: { user: null } }));
    } catch (_) {}

    // 4. Perform a hard navigation to bust client router cache completely
    window.location.href = redirectUrl;
  }
}
