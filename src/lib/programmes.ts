import { createClient } from '@/utils/supabase/client';
import { Programme } from '@/types';

/**
 * Fetches all published programmes from Supabase.
 */
export async function getProgrammes(): Promise<Programme[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching programmes:', error);
    return [];
  }

  return data as Programme[];
}

/**
 * Fetches a single programme by its ID.
 */
export async function getProgrammeById(id: string): Promise<Programme | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching programme by ID ${id}:`, error);
    return null;
  }

  return data as Programme;
}

/**
 * Fetches a single programme by the associated service ID.
 */
export async function getProgrammeByServiceId(serviceId: string): Promise<Programme | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('service_id', serviceId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching programme by service ID ${serviceId}:`, error);
    return null;
  }

  return data as Programme;
}

/**
 * Fetches a single programme by either its ID or service ID.
 */
export async function getProgrammeByIdOrServiceId(identifier: string): Promise<Programme | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .or(`id.eq.${identifier},service_id.eq.${identifier}`)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching programme by identifier ${identifier}:`, error);
    return null;
  }

  return data as Programme;
}

/**
 * Saves a programme (upsert) to Supabase.
 * Admin operation.
 */
export async function saveProgramme(programme: Programme): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/programmes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme })
    });

    if (res.ok) {
      return { success: true };
    }
  } catch (apiErr) {
    console.warn('Admin API save failed, trying direct client:', apiErr);
  }

  // Fallback to direct client
  const supabase = createClient();
  const payload = {
    id: programme.id,
    service_id: programme.service_id,
    title: programme.title,
    subtitle: programme.subtitle,
    description: programme.description,
    overview: programme.overview,
    image_url: programme.image_url,
    is_published: programme.is_published,
    book: programme.book || null,
    modules: programme.modules || [],
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('programmes')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('Error saving programme:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
