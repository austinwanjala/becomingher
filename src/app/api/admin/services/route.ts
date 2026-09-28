import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { service } = body;

    if (!service || !service.id) {
      return NextResponse.json({ error: 'Service data with valid ID is required.' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('services')
      .upsert({
        ...service,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error in upserting service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/services');
      revalidatePath('/services/[slug]', 'page');
      revalidatePath('/services/guided-coaching');
      revalidatePath('/services/interpersonal-coaching');
      revalidatePath('/services/custom-coaching');
      revalidatePath('/pricing');
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
