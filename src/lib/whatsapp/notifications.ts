import { store } from '../store';
import { whatsAppClient } from './client';

/**
 * Dispatches post-payment confirmation message to the customer's WhatsApp
 */
export async function sendWhatsAppPostPaymentConfirmation(args: {
  customerEmail: string;
  customerName?: string;
  orderReference: string;
  serviceTitle: string;
  amount: number;
  currency: string;
  serviceId: string;
}) {
  try {
    const { customerEmail, customerName, orderReference, serviceTitle, amount, currency, serviceId } = args;

    // Try finding user by email to get phone number
    const user = store.getUserByEmail(customerEmail);
    let targetPhone = user?.phone;

    // If not on user, check whatsapp contacts
    if (!targetPhone) {
      const contact = store.whatsappContacts.find(
        (c) => (user && c.user_id === user.id) || (c.name && customerName && c.name.toLowerCase() === customerName.toLowerCase())
      );
      if (contact) {
        targetPhone = contact.phone_number;
      }
    }

    if (!targetPhone) {
      console.log(`[WHATSAPP_CONFIRMATION] No WhatsApp phone found for customer ${customerEmail}`);
      return;
    }

    const cleanPhone = whatsAppClient.formatPhoneNumber(targetPhone);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalUrl = `${baseUrl}/dashboard`;

    const confirmationText =
      `🎉 *Payment Confirmed — Welcome to Becoming Her!*\n\n` +
      `Hello ${customerName || 'there'}! We have successfully received your payment for:\n\n` +
      `✨ *Programme:* ${serviceTitle}\n` +
      `💰 *Amount:* ${currency} ${amount.toLocaleString()}\n` +
      `🧾 *Order Ref:* ${orderReference}\n\n` +
      `Your dedicated coaching materials and portal are now fully unlocked:\n` +
      `👉 Access Your Portal: ${portalUrl}\n\n` +
      `You can also chat with me right here anytime for guidance, reflections, and session updates. We are so honored to walk this path with you! 🌿`;

    await whatsAppClient.sendMessage({
      to: cleanPhone,
      text: confirmationText,
      buttons: [
        { id: 'btn_my_portal', title: 'Open My Portal' },
        { id: 'btn_talk_human', title: 'Talk to Coach' }
      ]
    });

    // Update WhatsApp conversation state if exists
    const contact = store.getOrCreateWhatsAppContact(cleanPhone);
    const conversation = store.getActiveWhatsAppConversation(contact.id, cleanPhone);
    store.updateWhatsAppConversationState(conversation.id, 'PAYMENT_SUCCESSFUL', serviceId, serviceId, `Payment confirmed for ${serviceTitle}`);

    store.recordWhatsAppMessage(
      conversation.id,
      'OUTBOUND',
      confirmationText,
      'TEXT',
      true
    );

    console.log(`[WHATSAPP_CONFIRMATION] Sent payment confirmation to ${cleanPhone}`);
  } catch (err) {
    console.error('[WHATSAPP_CONFIRMATION] Error sending confirmation:', err);
  }
}
