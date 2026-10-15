import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import { Service } from '@/types';
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

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching services from Supabase:', error);
      return store.getServices();
    }
    if (!data || data.length === 0) {
      return store.getServices();
    }
    const services = data as Service[];
    services.forEach((s) => store.updateService(s));
    return services;
  } catch (err) {
    console.error('Failed to load services:', err);
    return store.getServices();
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching service by slug from Supabase:', error);
      }
      return store.getServiceBySlug(slug);
    }
    if (!data) {
      return store.getServiceBySlug(slug);
    }
    const service = data as Service;
    store.updateService(service);
    return service;
  } catch (err) {
    return store.getServiceBySlug(slug);
  }
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching service by ID from Supabase:', error);
      }
      return store.getServiceById(id);
    }
    if (!data) {
      return store.getServiceById(id);
    }
    const service = data as Service;
    store.updateService(service);
    return service;
  } catch (err) {
    return store.getServiceById(id);
  }
}

export async function saveService(service: Service): Promise<Service | null> {
  // Normalize and auto-derive product ID if URL is provided
  const normalized: Service = { ...service };
  if (normalized.selar_product_url) {
    try {
      const cleanUrl = normalized.selar_product_url.split('?')[0].replace(/\/$/, '');
      const extractedId = cleanUrl.split('/').pop();
      if (extractedId && (!normalized.selar_product_id || normalized.selar_product_id === 'v09683c927')) {
        normalized.selar_product_id = extractedId;
      }
    } catch (_) {}
  }

  try {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: normalized })
    });
    if (res.ok) {
      const data = await res.json();
      const updated = data.service || normalized;
      store.updateService(updated);
      return updated;
    }
  } catch (apiErr) {
    console.warn('API saveService failed, falling back to direct client:', apiErr);
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('services')
      .upsert({
        ...normalized,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving service to Supabase:', error);
      return null;
    }
    const updated = data as Service;
    store.updateService(updated);
    return updated;
  } catch (err) {
    console.error('Direct saveService exception:', err);
    return null;
  }
}

const LIVE_SELAR_PRODUCT_MAP: Record<string, string> = {
  '19145490qv': 'srv-book-04',
  'zo1155188k': 'srv-guided-01',
  '817711788w': 'srv-custom-02',
  '8614x14141': 'srv-interpersonal-03'
};

export async function getServiceBySelarProductId(productId?: string): Promise<Service | undefined> {
  const cleanId = (productId || '').trim();
  if (!cleanId) return undefined;

  // 1. Direct fallback map
  const mappedServiceId = LIVE_SELAR_PRODUCT_MAP[cleanId];
  if (mappedServiceId) {
    const svc = await getServiceById(mappedServiceId);
    if (svc) return svc;
  }

  // 2. Query store
  const storeMatch = store.services.find(
    (s) => s.selar_product_id === cleanId || s.selar_product_url?.includes(cleanId)
  );
  if (storeMatch) return storeMatch;

  // 3. Query Supabase
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('services')
      .select('*')
      .or(`selar_product_id.eq.${cleanId},selar_product_url.ilike.%${cleanId}%`)
      .maybeSingle();

    if (data) {
      const service = data as Service;
      store.updateService(service);
      return service;
    }
  } catch (err) {
    console.warn('Error querying service by Selar product ID:', err);
  }

  return undefined;
}
