import { store } from '../store';
import { whatsAppClient } from './client';
import { Booking } from '@/types';

/**
 * WhatsApp Automated Reminders Engine
 * Sends 24-hour and 1-hour session reminders for booked coaching calls
 */
export class WhatsAppReminders {
  /**
   * Check all bookings and dispatch pending WhatsApp reminders
   */
  async processUpcomingReminders() {
    const bookings = store.getBookings();
    const now = new Date().getTime();

    for (const booking of bookings) {
      if (booking.booking_status !== 'CONFIRMED') continue;
      if (!booking.scheduled_date || !booking.start_time) continue;

      // Resolve user's phone
      const user = store.getUserById(booking.customer_id);
      if (!user || !user.phone) continue;

      const sessionDateTimeStr = `${booking.scheduled_date}T${booking.start_time}`;
      const sessionTime = new Date(sessionDateTimeStr).getTime();
      if (isNaN(sessionTime)) continue;

      const diffHours = (sessionTime - now) / (1000 * 60 * 60);

      // 24 Hour Reminder (between 23h and 25h window)
      if (diffHours > 23 && diffHours <= 25) {
        await this.sendReminder(user.phone, booking, '24h');
      }

      // 1 Hour Reminder (between 0.5h and 1.5h window)
      if (diffHours > 0.5 && diffHours <= 1.5) {
        await this.sendReminder(user.phone, booking, '1h');
      }
    }
  }

  /**
   * Sends the structured reminder message
   */
  async sendReminder(phone: string, booking: Booking, type: '24h' | '1h') {
    const formattedPhone = whatsAppClient.formatPhoneNumber(phone);
    const service = store.getServiceById(booking.service_id);
    const serviceTitle = service ? service.name : 'Daytime Coaching Session';

    let message = '';
    if (type === '24h') {
      message =
        `🌸 *Becoming Her Session Reminder (Tomorrow)*\n\n` +
        `Hello! This is a gentle reminder that your *${serviceTitle}* with Coach Zipporah Karanja is scheduled for:\n\n` +
        `📅 *Date:* ${booking.scheduled_date}\n` +
        `⏰ *Time:* ${booking.start_time} (EAT)\n` +
        `🔗 *Google Meet:* ${booking.meeting_link || 'Link will be available in your portal'}\n\n` +
        `Please ensure you are in a quiet, comfortable space where you can speak openly. We look forward to connecting with you tomorrow!`;
    } else {
      message =
        `✨ *Becoming Her Session Starting in 1 Hour*\n\n` +
        `Hello! Your coaching session *${serviceTitle}* begins in just one hour.\n\n` +
        `⏰ *Time:* ${booking.start_time} (EAT)\n` +
        `🔗 *Join Meeting Link:* ${booking.meeting_link || 'https://meet.google.com/becoming-her'}\n\n` +
        `Take a moment to grab a glass of water, your journal, and take a deep breath. See you very shortly! 🌿`;
    }

    await whatsAppClient.sendMessage({
      to: formattedPhone,
      text: message
    });
  }
}

export const whatsAppReminders = new WhatsAppReminders();
