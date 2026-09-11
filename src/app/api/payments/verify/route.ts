import { NextResponse } from 'next/server';
import { selarProvider } from '@/lib/payments/selar';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, transactionReference, manualByAdmin } = body;

    if (!orderId && !transactionReference) {
      return NextResponse.json(
        { error: 'Order ID or transaction reference is required for verification.' },
        { status: 400 }
      );
    }

    const order = store.orders.find(
      (o) =>
        (orderId && o.id === orderId) ||
        (transactionReference && o.transaction_reference === transactionReference)
    );

    if (!order) {
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    // IDEMPOTENCY: If already successful, return the current confirmed state immediately
    if (order.payment_status === 'SUCCESSFUL') {
      const entitlement = store.entitlements.find((e) => e.order_id === order.id);
      const booking = order.metadata?.bookingId
        ? store.bookings.find((b) => b.id === order.metadata?.bookingId)
        : undefined;

      return NextResponse.json({
        verified: true,
        alreadyProcessed: true,
        order,
        entitlement,
        booking,
        message: 'Payment is already confirmed and active.'
      });
    }

    // Verify through Selar Provider
    const verification = await selarProvider.verifyPayment(
      order.transaction_reference || transactionReference || order.id
    );

    if (verification.isVerified && verification.status === 'SUCCESSFUL') {
      order.payment_status = 'SUCCESSFUL';
      order.updated_at = new Date().toISOString();

      // Create or activate entitlement
      const entitlement = store.unlockEntitlement(order.customer_id, order.service_id, order.id);

      // If interpersonal coaching session, confirm booking and generate meeting link
      let confirmedBooking;
      if (order.metadata?.bookingId) {
        confirmedBooking = store.confirmBookingPayment(order.metadata.bookingId, order.id);
      }

      store.addAuditLog(
        manualByAdmin ? 'PAYMENT_VERIFIED_MANUAL' : 'PAYMENT_VERIFIED_AUTO',
        'PAYMENTS',
        `Payment for Order ${order.order_reference} verified (${order.amount} ${order.currency}). Access unlocked.`
      );

      // Dispatch WhatsApp notification asynchronously
      import('@/lib/whatsapp/notifications').then(({ sendWhatsAppPostPaymentConfirmation }) => {
        sendWhatsAppPostPaymentConfirmation({
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          orderReference: order.order_reference,
          serviceTitle: order.service_name,
          amount: order.amount,
          currency: order.currency,
          serviceId: order.service_id
        });
      }).catch(console.error);

      // Dispatch Service PDF & Materials Email to Customer asynchronously
      import('@/lib/email/delivery').then(({ sendServicePdfEmail }) => {
        sendServicePdfEmail({
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          serviceId: order.service_id,
          serviceTitle: order.service_name,
          orderReference: order.order_reference
        });
      }).catch(console.error);

      return NextResponse.json({
        verified: true,
        order,
        entitlement,
        booking: confirmedBooking,
        message: 'Payment successfully verified! Your coaching access is now unlocked.'
      });
    } else {
      order.payment_status = 'FAILED';
      store.addAuditLog(
        'PAYMENT_FAILED',
        'PAYMENTS',
        `Verification failed for Order ${order.order_reference} (${order.transaction_reference}).`
      );

      return NextResponse.json({
        verified: false,
        order,
        message: 'Payment verification could not be confirmed. Please check with Selar support or contact our team.'
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error verifying payment.' },
      { status: 500 }
    );
  }
}
