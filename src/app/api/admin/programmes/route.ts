import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data: programmes, error } = await supabase
      .from('programmes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ programmes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programme } = body;

    if (!programme || !programme.id) {
      return NextResponse.json({ error: 'Programme data with valid ID is required.' }, { status: 400 });
    }

    const supabase = await createAdminClient();

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
      modules: programme.modules || [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('programmes')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error in upserting programme:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, programme: data });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/admin/programmes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
