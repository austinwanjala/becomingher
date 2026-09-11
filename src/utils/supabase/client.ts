import { createBrowserClient } from '@supabase/ssr'

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
  const trimmed = rawKey.trim();
  if (trimmed === 'your-supabase-anon-key' || trimmed.length < 10) {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key';
  }
  return trimmed;
}

export function createClient() {
  const url = getValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = getValidSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createBrowserClient(url, key);
}
