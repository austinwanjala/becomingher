import { store } from '../store';
import { whatsAppClient } from './client';
import { WhatsAppConversationState } from '@/types';

interface ProcessMessageInput {
  from: string; // phone number
  text: string;
  buttonId?: string;
  name?: string;
}

interface ProcessMessageOutput {
  replyText: string;
  buttons?: { id: string; title: string }[];
  state: WhatsAppConversationState;
  humanHandoff: boolean;
}

/**
 * Becoming Her Automated WhatsApp AI Coaching Engine
 * Grounded in Becoming Her live services, knowledge base, empathetic coaching,
 * returning customer recognition, and crisis triggers.
 */
export class WhatsAppEngine {
  /**
   * Process an incoming WhatsApp message and dispatch the response
   */
  async processIncomingMessage(input: ProcessMessageInput): Promise<ProcessMessageOutput> {
    const { from, text, buttonId, name } = input;
    const cleanPhone = whatsAppClient.formatPhoneNumber(from);

    // 1. Get or create contact and active conversation
    const contact = store.getOrCreateWhatsAppContact(cleanPhone, name);
    const conversation = store.getActiveWhatsAppConversation(contact.id, cleanPhone);

    // 2. Record incoming message
    store.recordWhatsAppMessage(
      conversation.id,
      'INBOUND',
      text || buttonId || '',
      'TEXT',
      false,
      buttonId ? [buttonId] : undefined
    );

    // 3. Check for Human Handoff state
    if (conversation.status === 'HUMAN_HANDOFF') {
      const normalized = text.trim().toLowerCase();
      if (normalized === 'resume' || normalized === 'bot' || normalized === 'restart') {
        store.toggleHumanHandoff(conversation.id, false);
        const welcomeBack = "Welcome back! 🌸 I am your Becoming Her AI coaching companion. How can I support you today?";
        await whatsAppClient.sendMessage({ to: cleanPhone, text: welcomeBack });
        store.recordWhatsAppMessage(
          conversation.id,
          'OUTBOUND',
          welcomeBack,
          'TEXT',
          true
        );
        return { replyText: welcomeBack, state: conversation.state, humanHandoff: false };
      }

      // In human handoff: human agent is handling the chat
      return {
        replyText: 'Conversation is currently handed off to human support.',
        state: 'HUMAN_HANDOFF',
        humanHandoff: true
      };
    }

    // 4. Check for Crisis / Emergency Triggers
    const crisisCheck = this.detectCrisisKeywords(text);
    if (crisisCheck.isCrisis) {
      store.toggleHumanHandoff(conversation.id, true);
      const crisisResponse = crisisCheck.response;
      await whatsAppClient.sendMessage({ to: cleanPhone, text: crisisResponse });
      store.recordWhatsAppMessage(
        conversation.id,
        'OUTBOUND',
        crisisResponse,
        'TEXT',
        true
      );
      return {
        replyText: crisisResponse,
        state: 'HUMAN_HANDOFF',
        humanHandoff: true
      };
    }

    // 5. Check for explicit Human Handoff request
    if (this.detectHumanHandoffIntent(text, buttonId)) {
      store.toggleHumanHandoff(conversation.id, true);
      const handoffMsg =
        "I understand completely. I am alerting Coach Zipporah and our support team right now. " +
        "Someone will personally join this chat shortly to assist you.\n\n" +
        "💡 *Tip:* If you ever wish to resume chatting with our AI coach, simply text *RESUME*.";

      await whatsAppClient.sendMessage({ to: cleanPhone, text: handoffMsg });
      store.recordWhatsAppMessage(
        conversation.id,
        'OUTBOUND',
        handoffMsg,
        'TEXT',
        true
      );
      return {
        replyText: handoffMsg,
        state: 'HUMAN_HANDOFF',
        humanHandoff: true
      };
    }

    // 6. Recognize Returning Customer
    const returningInfo = this.checkReturningCustomer(contact.user_id);

    // 7. Run State Machine & Generate Coaching Response
    const response = await this.generateStateResponse({
      text,
      buttonId,
      state: conversation.state,
      contactName: contact.name || name || 'there',
      returningInfo
    });

    // 8. Update conversation state in store
    store.updateWhatsAppConversationState(
      conversation.id,
      response.state,
      response.intendedService,
      response.recommendedService,
      response.summary
    );

    // 9. Send WhatsApp reply
    await whatsAppClient.sendMessage({
      to: cleanPhone,
      text: response.replyText,
      buttons: response.buttons
    });

    // 10. Record outbound message
    store.recordWhatsAppMessage(
      conversation.id,
      'OUTBOUND',
      response.replyText,
      response.buttons ? 'INTERACTIVE' : 'TEXT',
      true,
      response.buttons?.map(b => b.id)
    );

    return {
      replyText: response.replyText,
      buttons: response.buttons,
      state: response.state,
      humanHandoff: false
    };
  }

  /**
   * Crisis keyword detector for emotional distress / self-harm
   */
  private detectCrisisKeywords(text: string): { isCrisis: boolean; response: string } {
    const lower = text.toLowerCase();
    const triggers = [
      'kill myself', 'suicide', 'end my life', 'want to die',
      'hurt myself', 'hopeless completely', 'no reason to live'
    ];

    const match = triggers.some(t => lower.includes(t));
    if (match) {
      return {
        isCrisis: true,
        response:
          "I hear how much pain you are carrying right now, and I want you to know your life and story truly matter. " +
          "Because your safety is the absolute priority, please connect immediately with these free, confidential crisis resources in Kenya:\n\n" +
          "📞 *Kenya Red Cross Hotline:* 1199 (Toll-Free)\n" +
          "📞 *Befrienders Kenya:* +254 722 178 177\n" +
          "📞 *Emergency Services:* 999 / 112\n\n" +
          "I have also flagged this conversation so our team can reach out with support. Please reach out to one of the numbers above right away. You are not alone. ❤️"
      };
    }
    return { isCrisis: false, response: '' };
  }

  /**
   * Detects if user wants to speak to a human
   */
  private detectHumanHandoffIntent(text: string, buttonId?: string): boolean {
    if (buttonId === 'btn_talk_human') return true;
    const lower = text.toLowerCase();
    const hasIntentVerb = lower.includes('speak') || lower.includes('talk') || lower.includes('reach') || lower.includes('call') || lower.includes('contact');
    const hasHumanTarget = lower.includes('human') || lower.includes('person') || lower.includes('someone') || lower.includes('coach') || lower.includes('zipporah') || lower.includes('agent') || lower.includes('representative');

    if (hasIntentVerb && hasHumanTarget) return true;

    const phrases = [
      'real person', 'talk to zipporah', 'human please', 'operator', 'customer service'
    ];
    return phrases.some(p => lower.includes(p));
  }

  /**
   * Check if contact is an existing customer with active bookings or programmes
   */
  private checkReturningCustomer(userId?: string | null) {
    if (!userId) return null;
    const user = store.getUserById(userId);
    if (!user) return null;

    const bookings = store.getBookingsByUserId(userId);
    const activeBookings = bookings.filter(b => b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING_PAYMENT');

    return {
      isCustomer: true,
      name: user.name,
      email: user.email,
      activeBookings,
      hasProgramme: bookings.some(b => b.booking_status === 'CONFIRMED')
    };
  }

  /**
   * Core State Machine and Dialogue Generator
   */
  private async generateStateResponse(args: {
    text: string;
    buttonId?: string;
    state: WhatsAppConversationState;
    contactName: string;
    returningInfo: any;
  }): Promise<{
    replyText: string;
    buttons?: { id: string; title: string }[];
    state: WhatsAppConversationState;
    intendedService?: string;
    recommendedService?: string;
    summary?: string;
  }> {
    const { text, buttonId, state, contactName, returningInfo } = args;
    const lower = text.toLowerCase();
    const services = store.getServices();

    // Guided: KES 1000 | Custom: KES 1500 | Interpersonal: KES 2500
    const guidedSrv = services.find(s => s.id === 'srv-guided-01') || services[0];
    const customSrv = services.find(s => s.id === 'srv-custom-02') || services[1];
    const interSrv = services.find(s => s.id === 'srv-interpersonal-03') || services[2];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle button clicks explicitly
    if (buttonId === 'btn_explore_services' || lower.includes('programmes') || lower.includes('services') || lower.includes('pricing') || lower.includes('cost')) {
      const reply =
        `✨ *Becoming Her Transformational Coaching Options:*\n\n` +
        `1️⃣ *${guidedSrv.name}* — KES ${guidedSrv.price.toLocaleString()}\n` +
        `_Self-paced structured digital coaching modules, daily mindset reflections, and guided exercises._\n\n` +
        `2️⃣ *${customSrv.name}* — KES ${customSrv.price.toLocaleString()}\n` +
        `_Tailored coaching roadmap customized to your specific personal growth, career, or relationship goals._\n\n` +
        `3️⃣ *${interSrv.name}* — KES ${interSrv.price.toLocaleString()}\n` +
        `_1-on-1 private daytime coaching session with Coach Zipporah Karanja via Google Meet._\n\n` +
        `Which one feels like the best step for where you are right now?`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_select_guided', title: 'Guided (KES 1,000)' },
          { id: 'btn_select_custom', title: 'Custom (KES 1,500)' },
          { id: 'btn_select_interpersonal', title: '1-on-1 (KES 2,500)' }
        ],
        state: 'SERVICE_RECOMMENDATION'
      };
    }

    if (buttonId === 'btn_select_guided' || lower.includes('guided') || lower.includes('1000') || lower.includes('1,000')) {
      const srv = guidedSrv;
      const checkoutUrl = `${baseUrl}/register?source=whatsapp&service=${srv.id}`;
      const reply =
        `Wonderful choice! The *${srv.name}* (KES ${srv.price.toLocaleString()}) is designed to build foundational clarity, discipline, and intentional self-worth.\n\n` +
        `To get started and unlock your coaching materials:\n` +
        `👉 Create or access your account here:\n` +
        `${checkoutUrl}\n\n` +
        `Once registered, you will be redirected seamlessly to complete your payment via Selar (M-Pesa, Card, Bank). Would you like any assistance with registering?`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_how_it_works', title: 'How does it work?' },
          { id: 'btn_talk_human', title: 'Talk to Human' }
        ],
        state: 'PAYMENT_INTEREST',
        intendedService: srv.id
      };
    }

    if (buttonId === 'btn_select_custom' || lower.includes('customized') || lower.includes('1500') || lower.includes('1,500')) {
      const srv = customSrv;
      const checkoutUrl = `${baseUrl}/register?source=whatsapp&service=${srv.id}`;
      const reply =
        `Inspiring decision! The *${srv.name}* (KES ${srv.price.toLocaleString()}) delivers a personalized growth strategy tailored to your exact journey.\n\n` +
        `👉 Access your dedicated member portal & checkout here:\n` +
        `${checkoutUrl}\n\n` +
        `Payments are processed securely via Selar. I will be here to welcome you the moment your spot is secured!`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_how_it_works', title: 'How does it work?' },
          { id: 'btn_talk_human', title: 'Talk to Human' }
        ],
        state: 'PAYMENT_INTEREST',
        intendedService: srv.id
      };
    }

    if (buttonId === 'btn_select_interpersonal' || lower.includes('daytime') || lower.includes('1-on-1') || lower.includes('2500') || lower.includes('2,500')) {
      const srv = interSrv;
      const checkoutUrl = `${baseUrl}/register?source=whatsapp&service=${srv.id}`;
      const reply =
        `A transformative step. The *${srv.name}* (KES ${srv.price.toLocaleString()}) is an intimate, private 1-on-1 coaching video session with Coach Zipporah Karanja.\n\n` +
        `👉 Book your session & secure your checkout here:\n` +
        `${checkoutUrl}\n\n` +
        `Upon booking, you will receive your Google Meet link and session confirmation right here on WhatsApp!`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_how_it_works', title: 'How does it work?' },
          { id: 'btn_talk_human', title: 'Talk to Human' }
        ],
        state: 'PAYMENT_INTEREST',
        intendedService: srv.id
      };
    }

    // State 1: Returning Customer Handling
    if (returningInfo && returningInfo.hasProgramme) {
      if (lower.includes('my session') || lower.includes('my booking') || lower.includes('status')) {
        const nextB = returningInfo.activeBookings[0];
        const statusMsg = nextB
          ? `Hello ${contactName}! You have an upcoming booking scheduled for *${nextB.scheduled_date} at ${nextB.start_time}*.\n\nStatus: *${nextB.booking_status}*.\nMeeting Link: ${nextB.meeting_link || 'Will be shared 24h prior'}.\n\nYou can also view your full schedule at ${baseUrl}/dashboard.`
          : `Hello ${contactName}! You are an enrolled Becoming Her member. You have no pending live sessions right now, but your modules are ready in your portal at ${baseUrl}/dashboard.`;

        return {
          replyText: statusMsg,
          state: 'CUSTOMER_ACTIVE'
        };
      }
    }

    // State 2: NEW_VISITOR / Welcoming
    if (state === 'NEW_VISITOR' || lower === 'hi' || lower === 'hello' || lower === 'habari' || lower === 'hey') {
      const greeting = returningInfo
        ? `Hello ${contactName}, welcome back to *Becoming Her*! 🌸 How is your journey feeling today?`
        : `Hello ${contactName}! 🌸 Welcome to *Becoming Her* — a digital sanctuary dedicated to helping women step into their highest clarity, confidence, and purpose.\n\nI am your AI coaching companion. How are you feeling today, and what brings you to Becoming Her?`;

      return {
        replyText: greeting,
        buttons: [
          { id: 'btn_share_struggles', title: 'Share My Goals' },
          { id: 'btn_explore_services', title: 'View Programmes' },
          { id: 'btn_talk_human', title: 'Talk to Coach' }
        ],
        state: 'DISCOVERY'
      };
    }

    // State 3: DISCOVERY / Deep Coaching Guidance
    if (state === 'DISCOVERY' || state === 'COACHING') {
      const coachingGuidance = this.generateEmpatheticCoaching(text);

      const reply =
        `${coachingGuidance}\n\n` +
        `At *Becoming Her*, Coach Zipporah Karanja guides women through structured transformation so you never have to navigate this season alone.\n\n` +
        `Would you like to explore the coaching programmes we have created for this exact journey?`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_explore_services', title: 'Show Programmes' },
          { id: 'btn_talk_human', title: 'Talk to a Human' }
        ],
        state: 'COACHING'
      };
    }

    // Fallback: Warm Knowledge-based reply
    const knowledgeAnswer = this.searchKnowledgeBase(text);
    if (knowledgeAnswer) {
      return {
        replyText: `${knowledgeAnswer}\n\nIs there anything else I can clarify about our programmes or journey?`,
        buttons: [
          { id: 'btn_explore_services', title: 'View Programmes' },
          { id: 'btn_talk_human', title: 'Talk to Human' }
        ],
        state: 'COACHING'
      };
    }

    // Default polite response
    return {
      replyText:
        `Thank you for sharing that with me. Every step towards self-rediscovery takes courage.\n\n` +
        `Whether you are looking for self-paced digital guidance (KES 1,000), a customized growth plan (KES 1,500), or a 1-on-1 private daytime session with Zipporah (KES 2,500), Becoming Her is here to support you.\n\n` +
        `How would you best like to proceed?`,
      buttons: [
        { id: 'btn_explore_services', title: 'View Programmes' },
        { id: 'btn_talk_human', title: 'Talk to Human' }
      ],
      state: 'SERVICE_RECOMMENDATION'
    };
  }

  /**
   * Generates empathetic, non-robotic preliminary coaching
   */
  private generateEmpatheticCoaching(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('stuck') || lower.includes('lost') || lower.includes('overwhelm') || lower.includes('tired')) {
      return "I hear you, and please take a gentle breath. Feeling stuck is often not a sign of failure—it is your inner self signaling that you have outgrown where you are right now. The first step is giving yourself permission to pause and reflect on what no longer serves you.";
    }

    if (lower.includes('career') || lower.includes('job') || lower.includes('business') || lower.includes('work')) {
      return "Stepping into your purpose in your career or work takes real intention. It requires aligning your unique gifts with clear boundaries and confident self-advocacy. You don't have to shrink to fit into rooms that were too small for you.";
    }

    if (lower.includes('relationship') || lower.includes('heartbreak') || lower.includes('love') || lower.includes('family')) {
      return "Relationships teach us so much about our own boundaries and worth. When you cultivate a deeply rooted relationship with yourself first, you teach the world how to honor and cherish you.";
    }

    if (lower.includes('confidence') || lower.includes('fear') || lower.includes('doubt') || lower.includes('imposter')) {
      return "Self-doubt is normal when you are on the brink of significant growth. Confidence isn't the absence of fear—it is choosing to believe in your divine capacity even while your hands shake.";
    }

    return "Thank you for sharing your heart so honestly. It takes immense self-awareness to identify where you desire change, and that desire alone is proof that you are ready for a new chapter.";
  }

  /**
   * Simple KB search grounded in store knowledge base
   */
  private searchKnowledgeBase(query: string): string | null {
    const kb = store.getKnowledgeBaseArticles();
    const lower = query.toLowerCase();

    const matched = kb.find(art =>
      lower.includes(art.title.toLowerCase()) ||
      art.tags.some(t => lower.includes(t.toLowerCase()))
    );

    if (matched) {
      return `*${matched.title}*\n${matched.content.slice(0, 300)}...`;
    }

    return null;
  }
}

export const whatsAppEngine = new WhatsAppEngine();
