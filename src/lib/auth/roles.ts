import { User } from '@supabase/supabase-js';
import { UserRole } from '@/types';

/**
 * Standard administrative email addresses for Becoming Her.
 * Can be extended dynamically using the ADMIN_EMAILS environment variable
 * (comma-separated list, e.g. ADMIN_EMAILS="admin@becomingher.co.ke,zipporah@becomingher.co.ke")
 */
const DEFAULT_ADMIN_EMAILS = [
  'admin@becomingher.co.ke',
  'zipporah@becomingher.co.ke',
  'superadmin@becomingher.co.ke',
  'admin@example.com'
];

/**
 * Verifies if a given role string has administrative privileges.
 * Only 'ADMIN' and 'SUPER_ADMIN' have access to the administrative portal.
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase().trim();
  return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
}

/**
 * Resolves the authenticated user's role from all available identity sources:
 * 1. Supabase User Metadata (app_metadata / user_metadata)
 * 2. Database `public.profiles` table (`role` column)
 * 3. Environment-defined administrator whitelist
 * 
 * Always securely defaults to 'CUSTOMER' for regular registrants.
 */
export async function getUserRole(
  user: User | null | undefined,
  supabaseClient?: any
): Promise<UserRole> {
  if (!user) return 'CUSTOMER';

  // 1. Check user JWT / metadata (e.g. set by admin invite or profile creation)
  const metaRole = user.app_metadata?.role || user.user_metadata?.role;
  if (metaRole && typeof metaRole === 'string') {
    const r = metaRole.toUpperCase().trim();
    if (r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'COACH' || r === 'CUSTOMER') {
      return r as UserRole;
    }
  }

  // 2. Query the Supabase database `public.profiles` table
  if (supabaseClient && user.id) {
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        const dbRole = (profile.role as string).toUpperCase().trim();
        if (dbRole === 'SUPER_ADMIN' || dbRole === 'ADMIN' || dbRole === 'COACH' || dbRole === 'CUSTOMER') {
          return dbRole as UserRole;
        }
      }
    } catch {
      // Database query error or table not yet migrated
    }
  }

  // 3. Fallback to pre-configured administrator email whitelist
  const envAdminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const allAdminEmails = [...DEFAULT_ADMIN_EMAILS, ...envAdminEmails];
  if (user.email && allAdminEmails.includes(user.email.toLowerCase().trim())) {
    return 'ADMIN';
  }

  // Security default: Any user created or registered without explicit admin grant is a CUSTOMER
  return 'CUSTOMER';
}
