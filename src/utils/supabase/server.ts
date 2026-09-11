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
  if (!rawKey) return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key';
  const trimmed = rawKey.trim().replace(/^["']|["']$/g, '').trim();
  if (trimmed === 'your-supabase-anon-key' || trimmed.length < 10) {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key';
  }
  return trimmed;
}

export async function createClient() {
  const cookieStore = await cookies()
  const url = getValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = getValidSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
