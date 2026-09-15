import { NextResponse } from 'next/server';
import { selarProvider } from '@/lib/payments/selar';
import { store } from '@/lib/store';
import { createAdminClient } from '@/utils/supabase/server';
import { sendServicePdfEmail } from '@/lib/email/delivery';
import { sendWhatsAppPostPaymentConfirmation } from '@/lib/whatsapp/notifications';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const signature = request.headers.get('x-selar-signature') || undefined;

    // Process through Selar Provider
    const result = await selarProvider.handleWebhook(payload, signature);

    if (!result) {
      return NextResponse.json({ error: 'Unsupported webhook payload' }, { status: 400 });
    }

    // IDEMPOTENCY CHECK: Find existing order by transaction reference
    const supabase = await createAdminClient();
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_reference', result.transactionReference)
      .limit(1);

    const existingOrder = orders && orders.length > 0 ? orders[0] : undefined;

    if (existingOrder) {
      if (existingOrder.payment_status === 'SUCCESSFUL') {
        // Already processed, return 200 without creating duplicates
        return NextResponse.json({
          status: 'ok',
          message: 'Webhook already processed (idempotent)',
          orderReference: existingOrder.order_reference
        });
      }

      // Update existing pending order
      existingOrder.payment_status = result.status;
      existingOrder.updated_at = new Date().toISOString();

      await supabase.from('orders').update({
        payment_status: result.status,
        updated_at: existingOrder.updated_at
      }).eq('id', existingOrder.id);

      if (result.status === 'SUCCESSFUL') {
        store.unlockEntitlement(existingOrder.customer_id, existingOrder.service_id, existingOrder.id);
        if (existingOrder.metadata?.bookingId) {
          store.confirmBookingPayment(existingOrder.metadata.bookingId, existingOrder.id);
        }
        store.addAuditLog(
          'WEBHOOK_ORDER_COMPLETED',
          'WEBHOOK',
          `Order ${existingOrder.order_reference} confirmed via Selar webhook.`
        );

        // Dispatch notifications asynchronously, but MUST await so Vercel doesn't kill the process
        await Promise.allSettled([
          sendWhatsAppPostPaymentConfirmation({
            customerEmail: existingOrder.customer_email,
            customerName: existingOrder.customer_name,
            orderReference: existingOrder.order_reference,
            serviceTitle: existingOrder.service_name,
            amount: existingOrder.amount,
            currency: existingOrder.currency,
            serviceId: existingOrder.service_id
          }),
          sendServicePdfEmail({
            customerEmail: existingOrder.customer_email,
            customerName: existingOrder.customer_name,
            serviceId: existingOrder.service_id,
            serviceTitle: existingOrder.service_name,
            orderReference: existingOrder.order_reference
          })
        ]);
      }

      return NextResponse.json({ status: 'ok', orderReference: existingOrder.order_reference });
    }

    // If order was created directly on Selar (external checkout), map to our service
    if (result.status === 'SUCCESSFUL') {
      const matchedService =
        store.services.find((s) => s.selar_product_id === result.selarProductId) ||
        store.services[0];

      const orderRef = `BH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder = {
        id: `ord-webhook-${Date.now()}`,
        order_reference: orderRef,
        customer_id: 'cust-current',
        customer_name: payload.data?.customer?.name || 'Selar Customer',
        customer_email: result.customerEmail,
        service_id: matchedService.id,
        service_name: matchedService.name,
        selar_product_id: result.selarProductId,
        payment_provider: 'SELAR' as const,
        payment_status: 'SUCCESSFUL' as const,
        transaction_reference: result.transactionReference,
        amount: result.amount,
        currency: result.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase.from('orders').insert(newOrder);
      store.unlockEntitlement(newOrder.customer_id, matchedService.id, newOrder.id);

      store.addAuditLog(
        'WEBHOOK_NEW_ORDER_CREATED',
        'WEBHOOK',
        `New order ${orderRef} created and unlocked for ${result.customerEmail} via Selar webhook.`
      );

      if (newOrder.payment_status === 'SUCCESSFUL') {
        await Promise.allSettled([
          sendWhatsAppPostPaymentConfirmation({
            customerEmail: newOrder.customer_email,
            customerName: newOrder.customer_name,
            orderReference: newOrder.order_reference,
            serviceTitle: newOrder.service_name,
            amount: newOrder.amount,
            currency: newOrder.currency,
            serviceId: newOrder.service_id
          }),
          sendServicePdfEmail({
            customerEmail: newOrder.customer_email,
            customerName: newOrder.customer_name,
            serviceId: newOrder.service_id,
            serviceTitle: newOrder.service_name,
            orderReference: newOrder.order_reference
          })
        ]);
      }

      return NextResponse.json({
        status: 'ok',
        orderReference: orderRef,
        message: 'Order created and service unlocked'
      });
    }

    return NextResponse.json({ status: 'ignored', reason: 'Non-successful payment state' });
  } catch (err: any) {
    console.error('Selar webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
