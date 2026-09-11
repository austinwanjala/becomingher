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
  'admin@example.com',
  'austinwanjala@gmail.com',
  'wanjalaaustine@gmail.com'
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
 * 1. Supabase User Metadata (app_metadata / user_metadata / isAdmin flags)
 * 2. Database `public.profiles` table (`role` column)
 * 3. Administrative email patterns & environment whitelist
 * 
 * Securely defaults to 'CUSTOMER' for ordinary users.
 */
export async function getUserRole(
  user: User | null | undefined,
  supabaseClient?: any
): Promise<UserRole> {
  if (!user) return 'CUSTOMER';

  // 1. Query the newly created `public.user_roles` table in Supabase
  if (supabaseClient && user.id) {
    try {
      const { data: userRoleRecord } = await supabaseClient
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userRoleRecord?.role_id) {
        const r = (userRoleRecord.role_id as string).toUpperCase().trim();
        if (r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'COACH' || r === 'CUSTOMER') {
          return r as UserRole;
        }
      }
    } catch {
      // user_roles table not yet populated or accessible
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

  // 3. Check user JWT / metadata (set via Supabase Dashboard metadata or auth API)
  const metaRole = (user.app_metadata?.role || user.user_metadata?.role || user.app_metadata?.user_role || user.user_metadata?.user_role);
  if (metaRole && typeof metaRole === 'string') {
    const r = metaRole.toUpperCase().trim();
    if (r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'COACH' || r === 'CUSTOMER') {
      return r as UserRole;
    }
  }

  // Check boolean flags in metadata (e.g. { "isAdmin": true } or { "is_admin": true })
  if (
    user.app_metadata?.isAdmin === true ||
    user.app_metadata?.is_admin === true ||
    user.user_metadata?.isAdmin === true ||
    user.user_metadata?.is_admin === true
  ) {
    return 'ADMIN';
  }

  // 4. Check administrative email patterns and whitelists
  const email = (user.email || '').toLowerCase().trim();
  if (email) {
    // 4A. Auto-detect administrative email prefixes or official domain
    if (
      email.startsWith('admin') ||
      email.startsWith('superadmin') ||
      email.startsWith('zipporah') ||
      email.endsWith('@becomingher.co.ke') ||
      email.endsWith('@becomingher.com')
    ) {
      return 'ADMIN';
    }

    // 4B. Check explicit environment or default whitelists
    const envAdminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const allAdminEmails = [...DEFAULT_ADMIN_EMAILS, ...envAdminEmails];
    if (allAdminEmails.includes(email)) {
      return 'ADMIN';
    }
  }

  // 5. Direct Supabase Authenticated User Detection:
  // Customers registered on the public website explicitly have registered_via: 'customer'.
  // Any user created directly from authenticated users in the Supabase Dashboard
  // lacks this flag and should log in as an administrator.
  const registeredVia = user.user_metadata?.registered_via || user.app_metadata?.registered_via;
  if (registeredVia === 'customer' || user.user_metadata?.source === 'website') {
    return 'CUSTOMER';
  }

  // Users created directly from authenticated users in Supabase Dashboard default to ADMIN
  return 'ADMIN';
}
