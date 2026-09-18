import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    const dbBrand = data?.brand;
    const dbCms = data?.cms;

    // If no settings exist yet or they are empty objects (seeded as {}), return default store settings
    const settings = {
      brand: dbBrand && Object.keys(dbBrand).length > 0 ? { ...store.brand, ...dbBrand } : store.brand,
      cms: dbCms && Object.keys(dbCms).length > 0 ? dbCms : store.cms
    };

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error in settings GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createAdminClient();

    // Fetch existing settings first so we don't wipe out 'brand' when updating 'cms' and vice versa
    const { data: existing } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        id: 'global',
        brand: body.brand !== undefined ? body.brand : (existing?.brand || {}),
        cms: body.cms !== undefined ? body.cms : (existing?.cms || {}),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // Bust the Next.js cache so the whole app updates instantly
    revalidatePath('/', 'layout');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in settings POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
