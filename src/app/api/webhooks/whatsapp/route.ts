import { NextRequest, NextResponse } from 'next/server';
import { whatsAppClient } from '@/lib/whatsapp/client';
import { whatsAppEngine } from '@/lib/whatsapp/engine';

/**
 * Official WhatsApp Cloud API Webhook
 * GET: Webhook Verification challenge
 * POST: Incoming message and status updates
 */

// GET: Meta Webhook Handshake Verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'becoming_her_secret_webhook_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WHATSAPP_WEBHOOK] Webhook verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[WHATSAPP_WEBHOOK] Webhook verification failed. Token mismatch.');
  return new NextResponse('Forbidden', { status: 403 });
}

// POST: Meta Webhook Event Notification
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // 1. Signature Verification (if APP_SECRET configured)
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret && signature) {
      const isValid = whatsAppClient.verifyWebhookSignature(rawBody, signature, appSecret);
      if (!isValid) {
        console.error('[WHATSAPP_WEBHOOK] Invalid HMAC signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');

    // 2. Validate WhatsApp Cloud API structure
    if (payload.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (!Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
          const value = change.value;
          if (!value) continue;

          // Process messages
          if (Array.isArray(value.messages)) {
            for (const msg of value.messages) {
              const from = msg.from; // e.g. "254712345678"
              const name = value.contacts?.[0]?.profile?.name || '';
              let text = '';
              let buttonId = undefined;

              if (msg.type === 'text' && msg.text?.body) {
                text = msg.text.body;
              } else if (msg.type === 'button' && msg.button?.payload) {
                buttonId = msg.button.payload;
                text = msg.button.text || '';
              } else if (msg.type === 'interactive') {
                if (msg.interactive.type === 'button_reply') {
                  buttonId = msg.interactive.button_reply?.id;
                  text = msg.interactive.button_reply?.title || '';
                } else if (msg.interactive.type === 'list_reply') {
                  buttonId = msg.interactive.list_reply?.id;
                  text = msg.interactive.list_reply?.title || '';
                }
              }

              if (from && (text || buttonId)) {
                // Asynchronously process with AI engine
                whatsappBackgroundProcess({ from, text, buttonId, name });
              }
            }
          }
        }
      }
    }

    // Always respond 200 OK immediately for Meta 3-second SLA
    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ status: 'error', message: 'Internal error' }, { status: 500 });
  }
}

/**
 * Handle AI processing without blocking the immediate 200 OK response
 */
async function whatsappBackgroundProcess(data: {
  from: string;
  text: string;
  buttonId?: string;
  name?: string;
}) {
  try {
    await whatsAppEngine.processIncomingMessage(data);
  } catch (err) {
    console.error('[WHATSAPP_WEBHOOK] Error in whatsappBackgroundProcess:', err);
  }
}
