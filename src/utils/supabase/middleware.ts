import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserRole, isAdminRole } from '@/lib/auth/roles'

function getValidSupabaseUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (trimmed === 'your-supabase-url' || trimmed === 'placeholder' || !trimmed) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }
  try {
    const withHttps = `https://${trimmed}`;
    new URL(withHttps);
    return withHttps;
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  try {
    const supabaseUrl = getValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    // If Supabase environment variables are missing or invalid placeholders, bypass auth middleware safely
    if (!supabaseUrl || !supabaseKey || supabaseKey === 'your-supabase-anon-key' || supabaseKey.length < 10) {
      return supabaseResponse;
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    } catch (authErr) {
      console.warn('Middleware getUser warning:', authErr);
    }

    // 1. Role-Based Admin route protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (request.nextUrl.pathname === '/admin/login') {
        if (user) {
          try {
            const role = await getUserRole(user, supabase);
            if (isAdminRole(role)) {
              const url = request.nextUrl.clone();
              url.pathname = '/admin';
              return NextResponse.redirect(url);
            }
          } catch (_) {}
        }
        return supabaseResponse;
      }

      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
        url.searchParams.set('message', 'Please sign in with your administrative account to access the console.');
        const res = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie.name, cookie.value, cookie));
        return res;
      }

      // Authenticated user attempting to access /admin/*: ensure they are an Administrator
      try {
        const role = await getUserRole(user, supabase);
        if (!isAdminRole(role)) {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/login';
          url.searchParams.set(
            'message',
            "You don't have access rights"
          );
          const res = NextResponse.redirect(url);
          supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie.name, cookie.value, cookie));
          return res;
        }
      } catch (_) {}
    }

    // 2. Customer Dashboard protection
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      url.searchParams.set('message', 'Please sign in to access your Customer Portal.');
      const res = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie.name, cookie.value, cookie));
      return res;
    }

    return supabaseResponse;
  } catch (err) {
    console.error('updateSession caught error, passing through:', err);
    return supabaseResponse;
  }
}
