import { store } from '../store';
import { whatsAppClient } from './client';
import { WhatsAppConversationState } from '@/types';

interface ProcessMessageInput {
  from: string; // phone number
  text: string;
  buttonId?: string;
  name?: string;
  userId?: string;
  userEmail?: string;
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
 * returning customer recognition, real-time reflection answering, and crisis triggers.
 */
export class WhatsAppEngine {
  /**
   * Process an incoming WhatsApp message and dispatch the response
   */
  async processIncomingMessage(input: ProcessMessageInput): Promise<ProcessMessageOutput> {
    const { from, text, buttonId, name, userId, userEmail } = input;
    const cleanPhone = whatsAppClient.formatPhoneNumber(from);

    // 1. Get or create contact and active conversation
    const contact = store.getOrCreateWhatsAppContact(cleanPhone, name);
    if (userId && !contact.user_id) {
      store.linkWhatsAppContactToUser(cleanPhone, userId);
      contact.user_id = userId;
    } else if (!contact.user_id && cleanPhone.includes('700000000')) {
      store.linkWhatsAppContactToUser(cleanPhone, 'cust-demo-01');
      contact.user_id = 'cust-demo-01';
    }

    if (userEmail && (!contact.profile_data || !contact.profile_data.email)) {
      contact.profile_data = { ...contact.profile_data, email: userEmail };
    }

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
      const directWaUrl = 'https://wa.me/254720120227?text=' + encodeURIComponent("Hello Coach Zipporah! 🌸 I'm reaching out from Becoming Her to speak with you directly.");
      const handoffMsg =
        "I understand completely. Coach Zipporah Karanja and our support team are available directly on WhatsApp:\n\n" +
        "📱 *Direct Coach WhatsApp:* +254 720 120 227\n" +
        `👉 *Chat Directly on WhatsApp:*\n${directWaUrl}\n\n` +
        "Someone will personally attend to you right away. If you ever wish to resume chatting with our AI coach, simply text *RESUME*.";

      await whatsAppClient.sendMessage({
        to: cleanPhone,
        text: handoffMsg,
        buttons: [
          { id: 'btn_resume_bot', title: 'Resume AI Coach' },
          { id: 'btn_explore_services', title: 'View Programmes' }
        ]
      });
      store.recordWhatsAppMessage(
        conversation.id,
        'OUTBOUND',
        handoffMsg,
        'TEXT',
        true
      );
      return {
        replyText: handoffMsg,
        buttons: [
          { id: 'btn_resume_bot', title: 'Resume AI Coach' },
          { id: 'btn_explore_services', title: 'View Programmes' }
        ],
        state: 'HUMAN_HANDOFF',
        humanHandoff: true
      };
    }

    // 6. Recognize Returning Customer & Context
    const returningInfo = this.checkReturningCustomer(contact.user_id);

    // 7. Run State Machine & Generate Coaching Response
    const response = await this.generateStateResponse({
      text,
      buttonId,
      state: conversation.state,
      contactName: contact.name || name || 'there',
      returningInfo,
      conversationId: conversation.id,
      conversationSummary: conversation.summary
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
   * Check if contact is an existing customer with active bookings, programmes, reflections, or goals
   */
  private checkReturningCustomer(userId?: string | null) {
    if (!userId) return null;
    const user = store.getUserById(userId);
    const resolvedName = user?.name || (userId === 'cust-demo-01' ? 'Grace Mwangi' : 'Member');
    const resolvedEmail = user?.email || (userId === 'cust-demo-01' ? 'grace@example.com' : '');

    const bookings = store.getBookingsByUserId(userId);
    const activeBookings = bookings.filter(
      (b) => b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING_PAYMENT'
    );
    const entitlements = store.entitlements.filter(
      (e) => e.customer_id === userId && e.status === 'ACTIVE'
    );
    const reflections = store.getUserReflections(userId);
    const goals = store.getUserGoals(userId);
    const questionnaire =
      store.getUserQuestionnaire(userId) ||
      (userId === 'cust-demo-01'
        ? {
            life_area: 'Career Leadership & Boundaries',
            challenge: 'Saying yes to too many demands and feeling stretched thin.',
            goals: 'Learn to say no with peace; lead our upcoming division launch.',
            support_pref: 'Gentle inquiry with structured weekly accountability.'
          }
        : null);

    const hasProgramme =
      entitlements.length > 0 ||
      bookings.some((b) => b.booking_status === 'CONFIRMED') ||
      reflections.length > 0;

    return {
      isCustomer: true,
      userId,
      name: resolvedName,
      email: resolvedEmail,
      activeBookings,
      entitlements,
      reflections,
      goals,
      questionnaire,
      hasProgramme
    };
  }

  /**
   * Core State Machine and Dialogue Generator
   * Capable of real-time answering based on past reflections, questionnaire answers,
   * active goals, and interactive in-chat journaling.
   */
  private async generateStateResponse(args: {
    text: string;
    buttonId?: string;
    state: WhatsAppConversationState;
    contactName: string;
    returningInfo: any;
    conversationId?: string;
    conversationSummary?: string;
  }): Promise<{
    replyText: string;
    buttons?: { id: string; title: string }[];
    state: WhatsAppConversationState;
    intendedService?: string;
    recommendedService?: string;
    summary?: string;
  }> {
    const { text, buttonId, state, contactName, returningInfo, conversationSummary } = args;
    const lower = text.toLowerCase().trim();
    const services = store.getServices();

    // Guided: KES 1000 | Custom: KES 1500 | Interpersonal: KES 2500
    const guidedSrv = services.find((s) => s.id === 'srv-guided-01') || services[0];
    const customSrv = services.find((s) => s.id === 'srv-custom-02') || services[1];
    const interSrv = services.find((s) => s.id === 'srv-interpersonal-03') || services[2];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // -------------------------------------------------------------------------
    // 1. IN-CHAT REAL-TIME JOURNAL ANSWER CAPTURE
    // If the conversation was waiting for the user to answer a reflection prompt
    // -------------------------------------------------------------------------
    if (
      (state === 'JOURNAL_REFLECTION' || conversationSummary?.startsWith('pending_prompt:')) &&
      !buttonId &&
      lower !== 'hi' &&
      lower !== 'hello' &&
      lower !== 'hey'
    ) {
      const prompt =
        conversationSummary?.replace('pending_prompt:', '') ||
        'What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?';

      const targetUserId = returningInfo?.userId || 'cust-demo-01';
      store.saveUserReflection({
        userId: targetUserId,
        question: prompt,
        response: text
      });

      const reply =
        `✨ *Your reflection has been safely saved to your Becoming Her Sanctuary Journal!* ✨\n\n` +
        `📝 *Prompt:* "${prompt}"\n\n` +
        `💭 *Your Authentic Response:*\n` +
        `"${text}"\n\n` +
        `🌱 *Coach Zipporah & AI Real-Time Insight:*\n` +
        `Notice the clarity and courage in naming your truth. When you articulate what has been quiet inside, you take back your personal sovereignty.\n\n` +
        `How does it feel to see those words? What is one gentle commitment you can make today to honor this awareness?`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_my_reflections', title: '💭 View My Journal' },
          { id: 'btn_view_goals', title: '🎯 My Goals' },
          { id: 'btn_talk_human', title: 'Talk to Coach' }
        ],
        state: 'CUSTOMER_ACTIVE',
        summary: `saved_reflection:${new Date().toISOString()}`
      };
    }

    // -------------------------------------------------------------------------
    // 2. RETRIEVE & ANSWER QUESTIONS ABOUT PAST REFLECTIONS (Real-Time Memory)
    // -------------------------------------------------------------------------
    const isReflectionInquiry =
      buttonId === 'btn_my_reflections' ||
      lower.includes('reflection') ||
      lower.includes('what did i write') ||
      lower.includes('my answer') ||
      lower.includes('limiting belief') ||
      lower.includes('my journal') ||
      lower.includes('past answers') ||
      lower.includes('what i answered') ||
      lower.includes('answered question');

    if (isReflectionInquiry) {
      const userReflections = returningInfo?.reflections || [];
      if (userReflections.length > 0) {
        const latest = userReflections[0];
        const count = userReflections.length;

        let specificCoachReflection = '';
        const respLower = latest.response.toLowerCase();
        if (
          respLower.includes('savior') ||
          respLower.includes('sacrifice') ||
          respLower.includes('worth')
        ) {
          specificCoachReflection = `You noted that you are unlearning the need to be the perpetual savior and realizing sacrifice is not the measure of your worth. That is profound liberation. You do not need to burn yourself to keep others warm.`;
        } else if (
          respLower.includes('fear') ||
          respLower.includes('confidence') ||
          respLower.includes('doubt')
        ) {
          specificCoachReflection = `You acknowledged stepping through self-doubt with grounded faith. That courage is the exact foundation for the woman you are becoming.`;
        } else {
          specificCoachReflection = `Your reflection demonstrates remarkable emotional honesty. Reading your own truth back to yourself anchors your transformation into real life.`;
        }

        const reply =
          `🌸 *Your Saved Becoming Her Reflections* 🌸\n\n` +
          `Here is what you recorded in your personal transformation journal, ${contactName}:\n\n` +
          `📝 *Prompt:* "${latest.question}"\n\n` +
          `💭 *Your Response:*\n` +
          `"${latest.response}"\n\n` +
          `✨ *Real-Time Coach Insight:*\n` +
          `${specificCoachReflection}\n\n` +
          `_You currently have ${count} saved reflection${count > 1 ? 's' : ''} in your Becoming Her portal._`;

        return {
          replyText: reply,
          buttons: [
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' },
            { id: 'btn_view_goals', title: '🎯 My Goals' },
            { id: 'btn_talk_human', title: 'Talk to Coach' }
          ],
          state: 'CUSTOMER_ACTIVE'
        };
      } else {
        const reply =
          `Beloved ${contactName}, you haven't recorded a journal reflection yet, but your heart is already rich with wisdom.\n\n` +
          `Would you like to complete a quick 2-minute reflection inquiry right now? I will save your answer and reflect back with you.`;

        return {
          replyText: reply,
          buttons: [
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' },
            { id: 'btn_view_goals', title: '🎯 My Goals' },
            { id: 'btn_explore_services', title: 'View Programmes' }
          ],
          state: 'CUSTOMER_ACTIVE'
        };
      }
    }

    // -------------------------------------------------------------------------
    // 3. PROMPT A NEW IN-CHAT REFLECTION ("Reflect Now")
    // -------------------------------------------------------------------------
    const isPromptRequest =
      buttonId === 'btn_reflect_prompt' ||
      lower.includes('reflect now') ||
      lower.includes('reflection prompt') ||
      lower.includes('give me a question') ||
      lower.includes('prompt me') ||
      lower.includes('daily prompt') ||
      lower.includes('give me a reflection') ||
      lower.includes('journal prompt');

    if (isPromptRequest) {
      const PROMPTS = [
        'What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?',
        'How would you describe the woman you are becoming in five vivid adjectives?',
        'What is one bold desire you have whispered in secret that you are now ready to declare out loud?',
        'In which relationship or commitment are you currently tolerating conditions that no longer match who you are becoming?',
        'If you knew with absolute certainty that your worth was not tied to pleasing others, what would you stop doing today?'
      ];

      // Pick prompt not yet answered if possible
      const answeredQuestions = (returningInfo?.reflections || []).map((r: any) => r.question);
      const availablePrompts = PROMPTS.filter((p) => !answeredQuestions.includes(p));
      const selectedPrompt =
        availablePrompts.length > 0
          ? availablePrompts[0]
          : PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

      const reply =
        `Beloved ${contactName}, take a slow, nourishing breath and place a hand on your heart. 🌸\n\n` +
        `Here is your sacred reflection inquiry for today:\n\n` +
        `👉 *"${selectedPrompt}"*\n\n` +
        `Take a quiet moment. Reply directly to this message with your authentic response, and I will save it to your Becoming Her transformation journal and reflect on it with you. ✨`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_my_reflections', title: '💭 Previous Reflections' },
          { id: 'btn_view_goals', title: '🎯 My Goals' },
          { id: 'btn_talk_human', title: 'Talk to Coach' }
        ],
        state: 'JOURNAL_REFLECTION',
        summary: `pending_prompt:${selectedPrompt}`
      };
    }

    // -------------------------------------------------------------------------
    // 4. RETRIEVE & ANSWER QUESTIONS ABOUT USER GOALS
    // -------------------------------------------------------------------------
    const isGoalInquiry =
      buttonId === 'btn_view_goals' ||
      lower.includes('my goal') ||
      lower.includes('my goals') ||
      lower.includes('what are my goals') ||
      lower.includes('action step') ||
      lower.includes('my progress') ||
      lower.includes('show goals');

    if (isGoalInquiry) {
      const goals = returningInfo?.goals || [];
      if (goals.length > 0) {
        const goalsFormatted = goals
          .map((g: any, idx: number) => {
            const steps = (g.action_steps || [])
              .map((s: any) => `  ${s.is_completed ? '✅' : '⏳'} ${s.text}`)
              .join('\n');
            return `*${idx + 1}. ${g.title}* (${g.progress}% completed)\n_Category: ${g.category}_\n${steps}`;
          })
          .join('\n\n');

        const reply =
          `🎯 *Your Active Transformation Goals, ${contactName}:*\n\n` +
          `${goalsFormatted}\n\n` +
          `Which of these action steps feels most aligned to nurture today?`;

        return {
          replyText: reply,
          buttons: [
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' },
            { id: 'btn_my_reflections', title: '💭 My Reflections' },
            { id: 'btn_talk_human', title: 'Talk to Coach' }
          ],
          state: 'CUSTOMER_ACTIVE'
        };
      } else {
        const reply = `You don't have active goals saved in your portal yet, ${contactName}. You can add your core milestones in your member dashboard at ${baseUrl}/dashboard/coaching.`;
        return {
          replyText: reply,
          buttons: [
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' },
            { id: 'btn_my_reflections', title: '💭 My Reflections' }
          ],
          state: 'CUSTOMER_ACTIVE'
        };
      }
    }

    // -------------------------------------------------------------------------
    // 5. RETRIEVE & ANSWER QUESTIONS ABOUT ONBOARDING / LIFE ASSESSMENT
    // -------------------------------------------------------------------------
    const isAssessmentInquiry =
      lower.includes('questionnaire') ||
      lower.includes('onboarding') ||
      lower.includes('assessment') ||
      lower.includes('my challenge') ||
      lower.includes('my life area');

    if (isAssessmentInquiry) {
      const q = returningInfo?.questionnaire || {
        life_area: 'Career Leadership & Boundaries',
        challenge: 'Saying yes to too many demands and feeling stretched thin.',
        goals: 'Learn to say no with peace; lead our upcoming division launch.',
        support_pref: 'Gentle inquiry with structured weekly accountability.'
      };

      const reply =
        `📋 *Your Life Assessment & Onboarding Focus, ${contactName}:*\n\n` +
        `🌿 *Core Growth Area:* ${q.life_area}\n` +
        `⚡ *Primary Challenge:* ${q.challenge}\n` +
        `🎯 *Desired Breakthrough:* ${q.goals}\n` +
        `🤝 *Support Style:* ${q.support_pref}\n\n` +
        `Everything we explore is anchored around this breakthrough. How is this challenge showing up for you today?`;

      return {
        replyText: reply,
        buttons: [
          { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' },
          { id: 'btn_my_reflections', title: '💭 My Reflections' },
          { id: 'btn_talk_human', title: 'Talk to Coach' }
        ],
        state: 'CUSTOMER_ACTIVE'
      };
    }

    // -------------------------------------------------------------------------
    // 6. PROGRAMMES & SERVICES EXPLORATION
    // -------------------------------------------------------------------------
    if (
      buttonId === 'btn_explore_services' ||
      lower.includes('programmes') ||
      lower.includes('services') ||
      lower.includes('pricing') ||
      lower.includes('cost')
    ) {
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

    if (
      buttonId === 'btn_select_guided' ||
      lower.includes('guided') ||
      lower.includes('1000') ||
      lower.includes('1,000')
    ) {
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

    if (
      buttonId === 'btn_select_custom' ||
      lower.includes('customized') ||
      lower.includes('1500') ||
      lower.includes('1,500')
    ) {
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

    if (
      buttonId === 'btn_select_interpersonal' ||
      lower.includes('daytime') ||
      lower.includes('1-on-1') ||
      lower.includes('2500') ||
      lower.includes('2,500')
    ) {
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

    // -------------------------------------------------------------------------
    // 7. BOOKING SCHEDULE STATUS
    // -------------------------------------------------------------------------
    if (returningInfo && returningInfo.hasProgramme) {
      if (lower.includes('my session') || lower.includes('my booking') || lower.includes('status')) {
        const nextB = returningInfo.activeBookings[0];
        const statusMsg = nextB
          ? `Hello ${contactName}! You have an upcoming booking scheduled for *${nextB.scheduled_date} at ${nextB.start_time}*.\n\nStatus: *${nextB.booking_status}*.\nMeeting Link: ${nextB.meeting_link || 'Will be shared 24h prior'}.\n\nYou can also view your full schedule at ${baseUrl}/dashboard.`
          : `Hello ${contactName}! You are an enrolled Becoming Her member. You have no pending live sessions right now, but your modules and reflections are ready in your portal at ${baseUrl}/dashboard.`;

        return {
          replyText: statusMsg,
          buttons: [
            { id: 'btn_my_reflections', title: '💭 My Reflections' },
            { id: 'btn_view_goals', title: '🎯 My Goals' },
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' }
          ],
          state: 'CUSTOMER_ACTIVE'
        };
      }
    }

    // -------------------------------------------------------------------------
    // 8. WELCOME / GREETING (Personalized for returning members)
    // -------------------------------------------------------------------------
    if (
      state === 'NEW_VISITOR' ||
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'habari' ||
      lower === 'hey'
    ) {
      const isMember = returningInfo?.isCustomer;
      const greeting = isMember
        ? `Hello ${contactName}, welcome back to your *Becoming Her* sanctuary! 🌸\n\nI have your active coaching reflections, questionnaire, and goals on hand. How are you feeling today, and what would you like to explore together?`
        : `Hello ${contactName}! 🌸 Welcome to *Becoming Her* — a digital sanctuary dedicated to helping women step into their highest clarity, confidence, and purpose.\n\nI am your AI coaching companion. How are you feeling today, and what brings you to Becoming Her?`;

      const buttons = isMember
        ? [
            { id: 'btn_my_reflections', title: '💭 My Reflections' },
            { id: 'btn_view_goals', title: '🎯 My Goals' },
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' }
          ]
        : [
            { id: 'btn_share_struggles', title: 'Share My Goals' },
            { id: 'btn_explore_services', title: 'View Programmes' },
            { id: 'btn_talk_human', title: 'Talk to Coach' }
          ];

      return {
        replyText: greeting,
        buttons,
        state: isMember ? 'CUSTOMER_ACTIVE' : 'DISCOVERY'
      };
    }

    // -------------------------------------------------------------------------
    // 9. GENERAL COACHING / DISCOVERY (Grounded in answered questions)
    // -------------------------------------------------------------------------
    if (state === 'DISCOVERY' || state === 'COACHING' || state === 'CUSTOMER_ACTIVE') {
      let coachingGuidance = this.generateEmpatheticCoaching(text);

      // If user has answered reflections or questionnaire, ground the response directly in their actual words!
      if (returningInfo?.reflections && returningInfo.reflections.length > 0) {
        const r = returningInfo.reflections[0];
        coachingGuidance += `\n\n💡 *Grounded in your reflections:* Remember what you wrote: _"${r.response.slice(0, 160)}..."_ Let this awareness guide your choices today.`;
      } else if (returningInfo?.questionnaire?.challenge) {
        coachingGuidance += `\n\n💡 *Grounded in your goals:* In your onboarding assessment, you focused on _"${returningInfo.questionnaire.challenge}"_. Notice how this moment is inviting you to practice that boundary.`;
      }

      if (returningInfo?.isCustomer) {
        return {
          replyText: `${coachingGuidance}\n\nHow does that resonate with where you are feeling pulled right now?`,
          buttons: [
            { id: 'btn_reflect_prompt', title: '✍️ Reflect Now' },
            { id: 'btn_my_reflections', title: '💭 My Reflections' },
            { id: 'btn_talk_human', title: 'Talk to Coach' }
          ],
          state: 'CUSTOMER_ACTIVE'
        };
      }

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
