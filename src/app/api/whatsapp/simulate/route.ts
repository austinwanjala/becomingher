import { NextRequest, NextResponse } from 'next/server';
import { whatsAppEngine } from '@/lib/whatsapp/engine';
import { store } from '@/lib/store';
import { createClient } from '@/utils/supabase/server';

/**
 * Endpoint for in-browser WhatsApp interactive simulator
 * Allows testing full AI chatbot flows, buttons, returning customers, real-time reflection answering, and human handoff
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from = '+254700000000', text = '', buttonId, name = 'Prospective Member', userId: explicitUserId } = body;

    if (!text && !buttonId) {
      return NextResponse.json(
        { error: 'Message text or buttonId is required' },
        { status: 400 }
      );
    }

    // Try to auto-resolve authenticated session user
    let sessionUser: any = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      sessionUser = data?.user || null;
    } catch {
      // Cookies or session unavailable in this context
    }

    const resolvedUserId =
      explicitUserId ||
      sessionUser?.id ||
      (from.includes('700000000') ? 'cust-demo-01' : undefined);

    const resolvedEmail = sessionUser?.email || body.email;
    const resolvedName =
      body.name && body.name !== 'Prospective Member' && body.name !== 'Sister'
        ? body.name
        : (sessionUser?.user_metadata?.name ||
          sessionUser?.user_metadata?.full_name ||
          (resolvedUserId === 'cust-demo-01' ? 'Grace Mwangi' : name));

    // Process through real engine with authenticated context
    const result = await whatsAppEngine.processIncomingMessage({
      from,
      text,
      buttonId,
      name: resolvedName,
      userId: resolvedUserId,
      userEmail: resolvedEmail
    });

    // Also fetch updated conversation history for the simulator
    const cleanPhone = from.replace(/[^0-9+]/g, '');
    const contact = store.getOrCreateWhatsAppContact(cleanPhone, name);
    const conversation = store.getActiveWhatsAppConversation(contact.id, cleanPhone);
    const messages = store.getWhatsAppMessages(conversation.id);

    return NextResponse.json({
      success: true,
      result,
      contact,
      conversation,
      messages
    });
  } catch (error: any) {
    console.error('[WHATSAPP_SIMULATE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to simulate message' },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch messages & state for the simulator
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') || '+254700000000';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    const contact = store.getOrCreateWhatsAppContact(cleanPhone);
    const conversation = store.getActiveWhatsAppConversation(contact.id, cleanPhone);
    const messages = store.getWhatsAppMessages(conversation.id);

    return NextResponse.json({
      contact,
      conversation,
      messages
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
