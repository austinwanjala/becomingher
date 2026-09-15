import { createAdminClient } from '@/utils/supabase/server';
import { store } from '@/lib/store';

export async function getSettings() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is 'not found'
        console.error('Error fetching settings from DB:', error);
      }
      return { brand: store.brand, cms: store.cms };
    }

    const dbBrand = data?.brand;
    const dbCms = data?.cms;

    return {
      brand: dbBrand && Object.keys(dbBrand).length > 0 ? dbBrand : store.brand,
      cms: dbCms && Object.keys(dbCms).length > 0 ? dbCms : store.cms
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { brand: store.brand, cms: store.cms };
  }
}
