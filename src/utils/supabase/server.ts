import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getValidSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return 'https://placeholder.supabase.co';
  let trimmed = rawUrl.trim().replace(/^["']|["']$/g, '').trim();
  if (trimmed === 'your-supabase-url' || trimmed === 'placeholder' || !trimmed) {
    return 'https://placeholder.supabase.co';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return 'https://placeholder.supabase.co';
    }
  }
  try {
    const withHttps = `https://${trimmed}`;
    new URL(withHttps);
    return withHttps;
  } catch {
    return 'https://placeholder.supabase.co';
  }
}

function getValidSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';
  const trimmed = rawKey.trim().replace(/^["']|["']$/g, '').trim();
  if (trimmed === 'your-supabase-anon-key' || trimmed.length < 10) {
    return '';
  }
  return trimmed;
}

export async function createClient() {
  const cookieStore = await cookies()
  const url = getValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = getValidSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key';

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const url = getValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = getValidSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = getValidSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const keyToUse = serviceKey || anonKey;

  if (!serviceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing or invalid in environment variables. Falling back to ANON key.');
  }

  return createServerClient(
    url,
    keyToUse || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key',
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet) {
          // No-op for admin client
        },
      },
    }
  )
}
