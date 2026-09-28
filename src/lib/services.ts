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
    return data as Service[];
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
    return data as Service;
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
    return data as Service;
  } catch (err) {
    return store.getServiceById(id);
  }
}

export async function saveService(service: Service): Promise<Service | null> {
  try {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service })
    });
    if (res.ok) {
      const data = await res.json();
      return data.service || service;
    }
  } catch (apiErr) {
    console.warn('API saveService failed, falling back to direct client:', apiErr);
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('services')
      .upsert({
        ...service,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving service to Supabase:', error);
      return null;
    }
    return data as Service;
  } catch (err) {
    console.error('Direct saveService exception:', err);
    return null;
  }
}
