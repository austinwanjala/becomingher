import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

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

    return NextResponse.json({ success: true, message: `Service ${id} deleted successfully.` });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/admin/services:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
