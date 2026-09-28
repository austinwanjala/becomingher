import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import { Programme } from '@/types';
import { store } from '@/lib/store';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window === 'undefined') {
    return createSupabaseClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (fetchUrl, init) => fetch(fetchUrl, { ...init, cache: 'no-store' })
      }
    });
  }
  return createBrowserClient();
}

/**
 * Fetches all published programmes from Supabase dynamically.
 */
export async function getProgrammes(): Promise<Programme[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching programmes:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      modules: Array.isArray(p.modules) ? p.modules : []
    })) as Programme[];
  } catch (err) {
    console.error('getProgrammes exception:', err);
    return [];
  }
}

/**
 * Fetches a single programme by its ID.
 */
export async function getProgrammeById(id: string): Promise<Programme | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching programme by ID ${id}:`, error);
      return null;
    }

    if (!data) return null;
    return {
      ...data,
      modules: Array.isArray(data.modules) ? data.modules : []
    } as Programme;
  } catch (err) {
    console.error(`getProgrammeById exception for ${id}:`, err);
    return null;
  }
}

/**
 * Fetches a single programme by the associated service ID dynamically without cache.
 */
export async function getProgrammeByServiceId(serviceId: string): Promise<Programme | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('service_id', serviceId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching programme by service ID ${serviceId}:`, error);
      return null;
    }

    if (!data) return null;
    return {
      ...data,
      modules: Array.isArray(data.modules) ? data.modules : []
    } as Programme;
  } catch (err) {
    console.error(`getProgrammeByServiceId exception for ${serviceId}:`, err);
    return null;
  }
}

/**
 * Fetches a single programme by either its ID or service ID dynamically without cache.
 */
export async function getProgrammeByIdOrServiceId(identifier: string): Promise<Programme | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .or(`id.eq.${identifier},service_id.eq.${identifier}`)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching programme by identifier ${identifier}:`, error);
      return null;
    }

    if (!data) return null;
    return {
      ...data,
      modules: Array.isArray(data.modules) ? data.modules : []
    } as Programme;
  } catch (err) {
    console.error(`getProgrammeByIdOrServiceId exception for ${identifier}:`, err);
    return null;
  }
}

/**
 * Saves a programme (upsert) to Supabase and purges caches across the system.
 */
export async function saveProgramme(programme: Programme): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/programmes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme })
    });

    if (res.ok) {
      if (typeof window !== 'undefined') {
        store.programme = programme;
      }
      return { success: true };
    }
    const errData = await res.json().catch(() => ({}));
    console.warn('Admin API save returned non-200:', errData);
    if (errData.error) {
      return { success: false, error: errData.error };
    }
  } catch (apiErr) {
    console.warn('Admin API save failed, attempting direct client fallback:', apiErr);
  }

  // Fallback to direct client
  try {
    const supabase = getSupabase();
    const payload = {
      id: programme.id,
      service_id: programme.service_id,
      title: programme.title,
      subtitle: programme.subtitle,
      description: programme.description,
      overview: programme.overview,
      image_url: programme.image_url,
      is_published: programme.is_published ?? true,
      book: programme.book || null,
      modules: Array.isArray(programme.modules) ? programme.modules : [],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('programmes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving programme directly:', error);
      return { success: false, error: error.message };
    }

    if (typeof window !== 'undefined') {
      store.programme = programme;
    }

    return { success: true };
  } catch (directErr: any) {
    console.error('Direct fallback save failed:', directErr);
    return { success: false, error: directErr.message || 'Unknown save error' };
  }
}
