import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { store } from '@/lib/store';
import { Service } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { service } = body;

    if (!service || !service.id) {
      return NextResponse.json({ error: 'Service data with valid ID is required.' }, { status: 400 });
    }

    // Auto-extract and sync selar_product_id if URL is present and ID is empty or default
    let normalizedService = { ...service };
    if (normalizedService.selar_product_url) {
      try {
        const cleanUrl = normalizedService.selar_product_url.split('?')[0].replace(/\/$/, '');
        const extractedId = cleanUrl.split('/').pop();
        if (extractedId && (!normalizedService.selar_product_id || normalizedService.selar_product_id === 'v09683c927')) {
          normalizedService.selar_product_id = extractedId;
        }
      } catch (_) {}
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('services')
      .upsert({
        ...normalizedService,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error in upserting service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update in-memory store immediately
    store.updateService(data as Service);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/services');
      revalidatePath('/services/[slug]', 'page');
      revalidatePath('/services/guided-coaching');
      revalidatePath('/services/interpersonal-coaching');
      revalidatePath('/services/custom-coaching');
      revalidatePath('/pricing');
      revalidatePath('/checkout/[serviceId]', 'page');
      revalidatePath(`/checkout/${normalizedService.id}`);
      if (normalizedService.slug) {
        revalidatePath(`/checkout/${normalizedService.slug}`);
        revalidatePath(`/services/${normalizedService.slug}`);
      }
      revalidatePath('/checkout/srv-guided-01');
      revalidatePath('/checkout/srv-custom-02');
      revalidatePath('/checkout/srv-interpersonal-03');
      revalidatePath('/checkout/srv-book-04');
      revalidatePath('/dashboard');
      revalidatePath('/admin/services');
      revalidatePath('/');
    } catch (e) {
      console.warn('revalidatePath notice:', e);
    }

    return NextResponse.json({ success: true, service: data });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/admin/services:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    store.deleteService(id);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/services');
      revalidatePath('/pricing');
      revalidatePath('/');
    } catch (e) {
      console.warn('revalidatePath notice:', e);
    }

    return NextResponse.json({ success: true, message: `Service ${id} deleted successfully.` });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/admin/services:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
