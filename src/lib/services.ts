import { createClient } from '@supabase/supabase-js';
import { Service } from '@/types';

// Create a singleton Supabase client for backend/service use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching services from Supabase:', error);
    return [];
  }
  return data as Service[];
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching service by slug from Supabase:', error);
    }
    return undefined;
  }
  return data as Service;
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 means zero rows
      console.error('Error fetching service by ID from Supabase:', error);
    }
    return undefined;
  }
  return data as Service;
}

export async function saveService(service: Service): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .upsert({
      ...service,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving service to Supabase:', error);
    return null;
  }
  return data as Service;
}
