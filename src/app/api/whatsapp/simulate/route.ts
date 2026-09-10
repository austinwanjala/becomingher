import { NextRequest, NextResponse } from 'next/server';
import { whatsAppEngine } from '@/lib/whatsapp/engine';
import { store } from '@/lib/store';

/**
 * Endpoint for in-browser WhatsApp interactive simulator
 * Allows testing full AI chatbot flows, buttons, returning customers, and human handoff
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from = '+254700000000', text = '', buttonId, name = 'Jane Doe' } = body;

    if (!text && !buttonId) {
      return NextResponse.json(
        { error: 'Message text or buttonId is required' },
        { status: 400 }
      );
    }

    // Process through real engine
    const result = await whatsAppEngine.processIncomingMessage({
      from,
      text,
      buttonId,
      name
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
