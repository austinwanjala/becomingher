import {
  Service,
  Programme,
  Coach,
  Booking,
  Order,
  Entitlement,
  UserReflection,
  Goal,
  Testimonial,
  FAQItem,
  Coupon,
  KnowledgeDocument,
  AuditLog,
  SiteCMSContent,
  OnboardingQuestionnaire,
  AIConversation,
  WhatsAppContact,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppConfig,
  WhatsAppFunnelMetrics,
  WhatsAppConversationState,
  WhatsAppStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageType
} from '@/types';

// Global mock/fallback state with seed data
class Store {
  private static instance: Store;

  public services: Service[] = [
    {
      id: 'srv-guided-01',
      slug: 'guided-coaching',
      type: 'DIGITAL_PROGRAMME',
      name: 'Guided Digital Coaching Programme',
      short_description: 'A 4-week structured transformative coaching journey designed for women stepping into clarity, intentionality, and personal mastery.',
      description: 'The Guided Digital Coaching Programme is an immersive, self-paced yet deeply guided development experience. Structured across four progressive modules, it blends reflective inquiries, habit frameworks, actionable exercises, and embedded AI coaching support to help you unlock the woman you are becoming.',
      price: 1000,
      currency: 'KES',
      image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
      duration: '4 Modules (Self-Paced / 4 Weeks)',
      is_active: true,
      is_featured: true,
      features: [
        '4 Comprehensive Modules & 12 Guided Lessons',
        'Interactive Reflection Prompts & Digital Journaling',
        'Downloadable Worksheets, Audio Guides & Resources',
        'Integrated 24/7 AI Digital Coaching Assistant',
        'Lifetime Access & Progress Tracking Dashboard',
        'Official Becoming Her Completion Certificate'
      ],
      selar_product_id: 'v09683c927',
      selar_product_url: 'https://selar.com/v09683c927',
      created_at: new Date().toISOString()
    },
    {
      id: 'srv-custom-02',
      slug: 'custom-coaching',
      type: 'CUSTOM_COACHING',
      name: 'Customized Digital Coaching Programme',
      short_description: 'A bespoke coaching experience curated uniquely around your individual life vision, challenges, and goals with personalized AI-driven guidance.',
      description: 'Receive a personalized digital coaching curriculum crafted specifically for your journey. Following payment, you complete an in-depth life assessment questionnaire. Our system and AI coaching architect build tailored daily reflections, targeted milestone plans, and persistent conversational support tailored to your life situation.',
      price: 1500,
      currency: 'KES',
      image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
      duration: 'Personalized 8-Week Roadmap',
      is_active: true,
      is_featured: true,
      features: [
        'Deep Onboarding Life Assessment & Goal Mapping',
        'Customized Curriculum Tailored to Your Specific Obstacles',
        'Personalized AI Coaching Companion Trained on Your Profile',
        'Weekly Goal Reviews & Dynamic Action Prompts',
        'Unlimited AI Coaching Dialogue & Accountability',
        'Priority Access to Becoming Her Masterclasses'
      ],
      selar_product_id: 'v09683c927',
      selar_product_url: 'https://selar.com/v09683c927',
      created_at: new Date().toISOString()
    },
    {
      id: 'srv-interpersonal-03',
      slug: 'interpersonal-coaching',
      type: 'INTERPERSONAL_SESSION',
      name: 'Interpersonal Daytime Coaching Session',
      short_description: 'An intimate 60-minute 1-on-1 video coaching session with Lead Coach Zipporah Karanja to gain breakthrough clarity and strategic direction.',
      description: 'Step into a confidential, focused, and deeply empowering 1-on-1 space with a professional coach. Discuss your pivotal life transitions, career leaps, relationships, boundaries, and personal identity. Includes post-session action plan and direct Google Meet link upon confirmation.',
      price: 2500,
      currency: 'KES',
      image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
      duration: '60 Minutes (Live Video)',
      is_active: true,
      is_featured: true,
      features: [
        'Private 60-Minute 1-on-1 Video Session with Zipporah Karanja',
        'Anti-Double Booking Live Slot Reservation',
        'Instant Google Calendar & Google Meet Integration',
        'Pre-Session Clarity Questionnaire',
        'Post-Session Summary & Tailored Action Plan',
        '14 Days of Direct Email Support Follow-up'
      ],
      selar_product_id: 'v09683c927',
      selar_product_url: 'https://selar.com/v09683c927',
      created_at: new Date().toISOString()
    }
  ];

  public programme: Programme = {
    id: 'prog-guided-01',
    service_id: 'srv-guided-01',
    title: 'Becoming Her: The Guided Journey',
    subtitle: 'Step into Alignment, Purpose, and Unwavering Confidence',
    description: 'A transformative four-stage framework empowering you to release past constraints, define your authentic core identity, and embody the woman you aspire to be.',
    overview: 'Welcome to your sacred space of transformation. Over the next four modules, you will explore who you were, realign with who you are, and intentionally author the woman you are becoming.',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    is_published: true,
    modules: [
      {
        id: 'mod-1',
        programme_id: 'prog-guided-01',
        title: 'Module 1: The Awakening & Unlearning',
        description: 'Examine the inherited narratives, limiting beliefs, and external expectations that no longer serve your evolution.',
        order: 1,
        lessons: [
          {
            id: 'les-1-1',
            title: 'Welcome & Intentional Foundations',
            duration: '12 mins',
            description: 'Setting sacred intentions for your personal growth journey and establishing a routine for reflection.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            content: 'True transformation begins with unconditional radical honesty. Before we step into the woman you are becoming, we must honor the woman who brought you here. Take a deep breath and ground yourself in this moment. You are not starting from scratch; you are starting from wisdom.',
            order: 1
          },
          {
            id: 'les-1-2',
            title: 'Deconstructing Limiting Scripts',
            duration: '18 mins',
            description: 'Identifying childhood and cultural conditioning around perfectionism, people-pleasing, and silence.',
            content: 'Notice the words you use when speaking about your potential. When you tell yourself "I am not ready," whose voice is that really? In this lesson, we isolate fear-based beliefs from your authentic truth.',
            order: 2
          },
          {
            id: 'les-1-3',
            title: 'The Power of Emotional Boundaries',
            duration: '15 mins',
            description: 'Creating energetic boundaries to preserve your focus, peace, and self-respect.',
            content: 'Boundaries are not walls; they are doors with locks. You choose who enters and who remains on the outside. Learn how to say a guilt-free "No" to protect your sacred "Yes".',
            order: 3
          }
        ],
        reflection_questions: [
          {
            id: 'ref-1-1',
            question: 'What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?',
            placeholder: 'Write your honest reflection here...',
            order: 1
          },
          {
            id: 'ref-1-2',
            question: 'Where in your life are you over-functioning or people-pleasing at the expense of your peace?',
            placeholder: 'Detail situations, relationships, or work demands...',
            order: 2
          }
        ]
      },
      {
        id: 'mod-2',
        programme_id: 'prog-guided-01',
        title: 'Module 2: The Core Identity & Self-Concept',
        description: 'Anchor into your core values, rebuild self-trust, and calibrate your daily self-talk.',
        order: 2,
        lessons: [
          {
            id: 'les-2-1',
            title: 'Clarifying Your Non-Negotiable Values',
            duration: '16 mins',
            description: 'Discovering the 5 bedrock values that govern your highest decisions and life direction.',
            content: 'When values are clear, decisions are effortless. We map out your core hierarchy of values to eliminate decision fatigue and regret.',
            order: 1
          },
          {
            id: 'les-2-2',
            title: 'The Identity Shift: Embodying Her Today',
            duration: '22 mins',
            description: 'Bridging the gap between your present self and the future version of you.',
            content: 'You do not attract what you want; you attract what you embody. We begin practicing somatic and behavioral habits of your future self in real-time today.',
            order: 2
          }
        ],
        reflection_questions: [
          {
            id: 'ref-2-1',
            question: 'How would you describe the woman you are becoming in five vivid adjectives?',
            placeholder: 'e.g., Grounded, Radiant, Unapologetic, Strategic, Peaceful...',
            order: 1
          }
        ]
      },
      {
        id: 'mod-3',
        programme_id: 'prog-guided-01',
        title: 'Module 3: Purpose, Vision & Daily Rituals',
        description: 'Translate lofty dreams into concrete daily micro-habits, rituals, and creative flow states.',
        order: 3,
        lessons: [
          {
            id: 'les-3-1',
            title: 'Designing Your Sacred Morning & Evening Architecture',
            duration: '14 mins',
            description: 'Crafting non-negotiable rituals that protect your mental clarity and emotional resonance.',
            content: 'How you start your day determines your sovereignty. Learn how to reclaim the first 60 minutes from digital clutter and reactive urgency.',
            order: 1
          },
          {
            id: 'les-3-2',
            title: 'Audacious Goals with Gentle Execution',
            duration: '20 mins',
            description: 'Goal-setting through feminine flow, emotional alignment, and structured accountability.',
            content: 'Feminine ambition is not about exhaustion or hustle culture. It is rooted in ease, strategy, and self-compassion.',
            order: 2
          }
        ],
        reflection_questions: [
          {
            id: 'ref-3-1',
            question: 'What is one bold desire you have whispered in secret that you are now ready to declare out loud?',
            placeholder: 'Your authentic vision...',
            order: 1
          }
        ]
      },
      {
        id: 'mod-4',
        programme_id: 'prog-guided-01',
        title: 'Module 4: Integration, Elevation & Sovereignty',
        description: 'Sustain your growth, navigate setbacks with grace, and walk in perpetual alignment.',
        order: 4,
        lessons: [
          {
            id: 'les-4-1',
            title: 'Navigating Triggers & Old Relapses',
            duration: '19 mins',
            description: 'Building psychological resilience when old habits and relationships attempt to pull you back.',
            content: 'Growth is cyclical, not linear. When you experience a setback, it is not evidence of failure; it is an invitation for deeper integration.',
            order: 1
          },
          {
            id: 'les-4-2',
            title: 'Your Manifesto: Living as Her',
            duration: '25 mins',
            description: 'Writing and committing to your personal Becoming Her Manifesto.',
            content: 'This is your graduation into sovereignty. You now possess the inner compass, emotional tools, and supportive sisterhood to flourish permanently.',
            order: 2
          }
        ],
        reflection_questions: [
          {
            id: 'ref-4-1',
            question: 'What promise will you make to yourself today as you complete this sacred chapter?',
            placeholder: 'My unwavering commitment to myself...',
            order: 1
          }
        ]
      }
    ]
  };

  public coach: Coach = {
    id: 'coach-zipporah-01',
    name: 'Zipporah Karanja',
    title: 'Founder & Certified Women’s Transformation Coach',
    bio: 'Zipporah is an internationally certified executive and personal development coach who has guided hundreds of women across East Africa and beyond to cultivate deep self-worth, build purpose-aligned careers, and step unapologetically into their sovereign feminine power.',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
    email: 'zipporah@becomingher.co.ke',
    phone: '+254 700 000 000',
    available_days: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
    available_hours: [
      { start: '09:00', end: '10:00' },
      { start: '11:00', end: '12:00' },
      { start: '14:00', end: '15:00' },
      { start: '16:00', end: '17:00' }
    ],
    session_duration_minutes: 60
  };

  public bookings: Booking[] = [
    {
      id: 'bk-demo-01',
      customer_id: 'cust-demo-01',
      customer_name: 'Grace Mwangi',
      customer_email: 'grace@example.com',
      coach_id: 'coach-zipporah-01',
      coach_name: 'Zipporah Karanja',
      service_id: 'srv-interpersonal-03',
      scheduled_date: '2026-09-18',
      start_time: '11:00',
      end_time: '12:00',
      timezone: 'Africa/Nairobi (EAT)',
      payment_status: 'SUCCESSFUL',
      booking_status: 'CONFIRMED',
      meeting_link: 'https://meet.google.com/bch-her-zipp',
      notes: 'Focus on transitioning from corporate finance into entrepreneurial leadership.',
      created_at: new Date().toISOString()
    }
  ];

  public orders: Order[] = [
    {
      id: 'ord-1001',
      order_reference: 'BH-2026-00001',
      customer_id: 'cust-demo-01',
      customer_name: 'Grace Mwangi',
      customer_email: 'grace@example.com',
      service_id: 'srv-guided-01',
      service_name: 'Guided Digital Coaching Programme',
      selar_product_id: 'v09683c927',
      payment_provider: 'SELAR',
      payment_status: 'SUCCESSFUL',
      transaction_reference: 'SELAR_TX_894129',
      amount: 1000,
      currency: 'KES',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  ];

  public entitlements: Entitlement[] = [
    {
      id: 'ent-001',
      customer_id: 'cust-demo-01',
      service_id: 'srv-guided-01',
      service_name: 'Guided Digital Coaching Programme',
      service_type: 'DIGITAL_PROGRAMME',
      order_id: 'ord-1001',
      status: 'ACTIVE',
      progress_percentage: 25,
      start_date: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  ];

  public reflections: UserReflection[] = [
    {
      id: 'ref-ans-01',
      user_id: 'cust-demo-01',
      programme_id: 'prog-guided-01',
      module_id: 'mod-1',
      question_id: 'ref-1-1',
      question: 'What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?',
      response: 'I used to believe that my worth was directly tied to how much I could sacrifice for others without complaining. I am unlearning the need to be the perpetual savior.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ];

  public goals: Goal[] = [
    {
      id: 'goal-01',
      user_id: 'cust-demo-01',
      title: 'Establish 30-Minute Sacred Morning Ritual',
      description: 'Wake up at 6:00 AM, hydrate, meditate for 10 minutes, and journal without checking emails.',
      category: 'Spiritual & Well-being',
      target_date: '2026-10-01',
      status: 'IN_PROGRESS',
      progress: 60,
      action_steps: [
        { id: 'act-1', text: 'Buy a dedicated paper reflection journal', is_completed: true },
        { id: 'act-2', text: 'Charge phone outside the bedroom overnight', is_completed: true },
        { id: 'act-3', text: 'Practice 7 consecutive days of morning silence', is_completed: false }
      ],
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];

  public questionnaires: Record<string, OnboardingQuestionnaire> = {};

  public aiConversations: AIConversation[] = [];

  public testimonials: Testimonial[] = [
    {
      id: 'test-01',
      name: 'Dr. Sarah K.',
      role: 'Public Health Executive & Mother',
      quote: 'Becoming Her shifted how I walk into boardrooms and how I speak to myself in private. The guided reflections felt like a mirror holding me to my highest self.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      programme_name: 'Guided Digital Coaching Programme',
      rating: 5,
      is_published: true
    },
    {
      id: 'test-02',
      name: 'Wanjiku N.',
      role: 'Tech Founder & Creative Strategist',
      quote: 'My 1-on-1 session with Zipporah was the single highest-ROI hour I spent this year. She helped me untangle an emotional block that had stalled my fundraising for months.',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
      programme_name: 'Interpersonal Coaching Session',
      rating: 5,
      is_published: true
    },
    {
      id: 'test-03',
      name: 'Amina H.',
      role: 'Communications Lead',
      quote: 'The AI coaching assistant is unlike anything I’ve used. It knows my goals, remembers my answers from Module 1, and pushes me with gentle, challenging inquiries.',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      programme_name: 'Customized Digital Coaching',
      rating: 5,
      is_published: true
    }
  ];

  public faqs: FAQItem[] = [
    {
      id: 'faq-01',
      question: 'How do I access my coaching programme after payment?',
      answer: 'Immediately after completing your payment via Selar, our system verifies your transaction and unlocks your active entitlement. You will be directed to your Customer Dashboard where all modules, exercises, and AI coaching become instantly available.',
      category: 'Access & Payment',
      order: 1,
      is_published: true
    },
    {
      id: 'faq-02',
      question: 'What payment methods are supported on Selar?',
      answer: 'Selar accepts M-Pesa, Visa, Mastercard, Bank Transfers, Apple Pay, and mobile money options across Kenya, Nigeria, Ghana, the US, and the UK. All payments are encrypted and verified server-side.',
      category: 'Access & Payment',
      order: 2,
      is_published: true
    },
    {
      id: 'faq-03',
      question: 'How does the 1-on-1 Interpersonal Coaching booking work?',
      answer: 'When you select "Schedule a Session", you choose an available date and time. We hold a temporary reservation for 15 minutes while you complete checkout on Selar. Once payment is verified, your booking is confirmed, and a Google Meet video link is generated immediately in your dashboard.',
      category: 'Coaching Sessions',
      order: 3,
      is_published: true
    },
    {
      id: 'faq-04',
      question: 'Is the AI Coaching Assistant a replacement for therapy or medical advice?',
      answer: 'No. The AI Coaching Assistant is strictly a personal development tool grounded in our approved Becoming Her frameworks. It does not provide medical, psychological, legal, or crisis treatment. If you are experiencing mental health emergencies, please contact licensed local medical professionals.',
      category: 'AI Coaching',
      order: 4,
      is_published: true
    },
    {
      id: 'faq-05',
      question: 'Can I do the Guided Programme at my own pace?',
      answer: 'Yes! While designed around a 4-week progression, your enrollment never expires. You can revisit lessons, update reflections, and re-engage with the material as often as you need.',
      category: 'Programmes',
      order: 5,
      is_published: true
    }
  ];

  public coupons: Coupon[] = [
    {
      id: 'cp-01',
      code: 'BECOMINGHER10',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      min_spend: 3000,
      times_used: 14,
      usage_limit: 100,
      is_active: true
    },
    {
      id: 'cp-02',
      code: 'EMPOWER1000',
      discount_type: 'FIXED',
      discount_value: 1000,
      min_spend: 4500,
      times_used: 6,
      usage_limit: 50,
      is_active: true
    }
  ];

  public knowledgeBase: KnowledgeDocument[] = [
    {
      id: 'kb-01',
      title: 'The Becoming Her Transformation Cycle',
      category: 'FRAMEWORK',
      programme_id: 'prog-guided-01',
      content: 'The 4-stage evolution model: (1) Awakening (honoring past experiences and identifying limiting assumptions), (2) Re-Identification (establishing core values and personal sovereignty), (3) Embodiment (daily micro-rituals, feminine flow, clear boundaries), and (4) Sovereign Flourishing (lasting elevation and self-mastery).',
      tags: ['framework', 'transformation', 'core-methodology'],
      is_published: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'kb-02',
      title: 'Boundaries as Self-Honoring Practices',
      category: 'METHODOLOGY',
      programme_id: 'prog-guided-01',
      content: 'Healthy boundaries are not combative. They are clear statements of what you require to remain peaceful, loving, and effective. The script for gentle boundaries: "I honor your request, and at this time my priorities do not allow me to commit."',
      tags: ['boundaries', 'peace', 'relationships'],
      is_published: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'kb-03',
      title: 'AI Coaching Ethical Guardrails & Safety Policy',
      category: 'POLICY',
      content: 'Becoming Her AI Coach must never diagnose, prescribe, or provide therapy. In instances of self-harm, trauma, severe clinical depression, domestic violence, or crisis, immediately output compassionate grounding language and offer hotlines such as the Kenya Red Cross toll-free line 1199 or emergency services.',
      tags: ['safety', 'crisis', 'ethics'],
      is_published: true,
      updated_at: new Date().toISOString()
    }
  ];

  public auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      user_id: 'admin-01',
      user_email: 'admin@becomingher.co.ke',
      action: 'SYSTEM_INITIALIZATION',
      resource: 'PLATFORM',
      details: 'Becoming Her platform initialized with Selar product mappings and default programmes.',
      timestamp: new Date().toISOString()
    }
  ];

  public cms: SiteCMSContent = {
    hero: {
      badge: '✨ Digital Personal Development & Coaching for Women',
      heading: 'Become the woman you are becoming.',
      subheading: 'A curated sanctuary of structured digital programmes, intimate 1-on-1 coaching, and bespoke AI development tools designed to guide you into authentic sovereignty, confidence, and peace.',
      cta_primary_text: 'Explore Coaching',
      cta_primary_link: '/services',
      cta_secondary_text: 'Schedule a Session',
      cta_secondary_link: '/services/interpersonal-coaching',
      image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200'
    },
    about: {
      heading: 'Where Feminine Ambition Meets Unshakable Inner Peace',
      story: 'Becoming Her was founded with a profound mission: to provide every ambitious, visionary woman with the sacred space, structured frameworks, and high-touch coaching she needs to expand without burning out.',
      mission: 'To empower women to unlearn limiting societal scripts, cultivate unwavering self-trust, and build intentional lives rooted in purpose, emotional freedom, and sovereignty.',
      vision: 'A world where women lead with ease, speak with conviction, and honor the sacred evolution of who they are becoming.',
      values: [
        { title: 'Sovereignty', desc: 'Owning your narrative, your choices, and your energy unconditionally.' },
        { title: 'Radical Compassion', desc: 'Transforming not from harsh self-criticism, but from deep, honoring love.' },
        { title: 'Intentional Mastery', desc: 'Translating high aspirations into daily micro-rituals and grounded action.' },
        { title: 'Sisterhood & Honor', desc: 'Creating safe, non-judgmental containers for women to flourish together.' }
      ]
    },
    contact: {
      email: 'hello@becomingher.co.ke',
      phone: '+254 720 120 227',
      address: 'Nairobi, Kenya (Serving Women Globally)',
      instagram: '@becomingher.co',
      selar_store_url: 'https://selar.com/m/zipporah-karanja1-Selar'
    }
  };

  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  // Helper Methods
  public getServices(): Service[] {
    return this.services;
  }

  public getServiceBySlug(slug: string): Service | undefined {
    return this.services.find((s) => s.slug === slug || s.id === slug);
  }

  public getServiceById(id: string): Service | undefined {
    return this.services.find((s) => s.id === id || s.slug === id);
  }

  public getProgrammeByServiceId(serviceId: string): Programme | undefined {
    return this.programme.service_id === serviceId ? this.programme : undefined;
  }

  public getEntitlements(customerId: string): Entitlement[] {
    return this.entitlements.filter((e) => e.customer_id === customerId);
  }

  public hasActiveEntitlement(customerId: string, serviceId: string): boolean {
    return this.entitlements.some(
      (e) => e.customer_id === customerId && e.service_id === serviceId && e.status === 'ACTIVE'
    );
  }

  public unlockEntitlement(customerId: string, serviceId: string, orderId: string): Entitlement {
    const service = this.getServiceById(serviceId);
    const existing = this.entitlements.find(
      (e) => e.customer_id === customerId && e.service_id === serviceId
    );

    if (existing) {
      existing.status = 'ACTIVE';
      existing.order_id = orderId;
      return existing;
    }

    const newEntitlement: Entitlement = {
      id: `ent-${Date.now()}`,
      customer_id: customerId,
      service_id: serviceId,
      service_name: service ? service.name : 'Becoming Her Service',
      service_type: service ? service.type : 'DIGITAL_PROGRAMME',
      order_id: orderId,
      status: 'ACTIVE',
      progress_percentage: 0,
      start_date: new Date().toISOString()
    };

    this.entitlements.push(newEntitlement);
    return newEntitlement;
  }

  public isSlotBooked(coachId: string, date: string, time: string): boolean {
    return this.bookings.some(
      (b) =>
        b.coach_id === coachId &&
        b.scheduled_date === date &&
        b.start_time === time &&
        (b.booking_status === 'CONFIRMED' ||
          (b.booking_status === 'PENDING_PAYMENT' &&
            b.reservation_expires_at &&
            new Date(b.reservation_expires_at).getTime() > Date.now()))
    );
  }

  public createTemporaryBooking(params: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    coachId: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    timezone: string;
    serviceId: string;
    notes?: string;
  }): Booking {
    if (this.isSlotBooked(params.coachId, params.scheduledDate, params.startTime)) {
      throw new Error('This time slot is already reserved or booked. Please select another slot.');
    }

    const booking: Booking = {
      id: `bk-${Date.now()}`,
      customer_id: params.customerId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      coach_id: params.coachId,
      coach_name: this.coach.name,
      service_id: params.serviceId,
      scheduled_date: params.scheduledDate,
      start_time: params.startTime,
      end_time: params.endTime,
      timezone: params.timezone,
      payment_status: 'PENDING',
      booking_status: 'PENDING_PAYMENT',
      reservation_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
      notes: params.notes,
      created_at: new Date().toISOString()
    };

    this.bookings.push(booking);
    return booking;
  }

  public confirmBookingPayment(bookingId: string, orderId: string): Booking {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.payment_status = 'SUCCESSFUL';
    booking.booking_status = 'CONFIRMED';
    booking.order_id = orderId;
    booking.meeting_link = `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    return booking;
  }

  public addAuditLog(action: string, resource: string, details: string, userEmail: string = 'admin@becomingher.co.ke'): void {
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: 'usr-admin',
      user_email: userEmail,
      action,
      resource,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // =========================================================================
  // WHATSAPP BUSINESS & AI CHATBOT SYSTEM
  // =========================================================================

  public whatsappContacts: WhatsAppContact[] = [
    {
      id: 'wac-01',
      phone_number: '+254712345678',
      whatsapp_user_id: 'wa_usr_01',
      user_id: 'cust-demo-01',
      name: 'Grace Mwangi',
      first_interaction: new Date(Date.now() - 3 * 86400000).toISOString(),
      last_interaction: new Date(Date.now() - 1 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'wac-02',
      phone_number: '+254722987654',
      name: 'Amina Mohamed',
      first_interaction: new Date(Date.now() - 1 * 86400000).toISOString(),
      last_interaction: new Date(Date.now() - 2 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ];

  public whatsappConversations: WhatsAppConversation[] = [
    {
      id: 'wacv-01',
      contact_id: 'wac-01',
      user_id: 'cust-demo-01',
      phone_number: '+254712345678',
      state: 'CUSTOMER_ACTIVE',
      status: 'BOT',
      recommended_service: 'srv-guided-01',
      intended_service: 'srv-guided-01',
      summary: 'Grace completed Module 1 and asked for guidance on daily morning rituals.',
      session_token: 'tok_grace_9841',
      message_count: 8,
      last_message_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'wacv-02',
      contact_id: 'wac-02',
      phone_number: '+254722987654',
      state: 'SERVICE_RECOMMENDATION',
      status: 'BOT',
      recommended_service: 'srv-custom-02',
      intended_service: 'srv-custom-02',
      summary: 'Amina is exploring career pivots and needs customized 1-on-1 AI roadmap support.',
      session_token: 'tok_amina_1204',
      message_count: 4,
      last_message_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ];

  public whatsappMessages: WhatsAppMessage[] = [
    {
      id: 'wam-01',
      conversation_id: 'wacv-02',
      direction: 'INBOUND',
      message_type: 'TEXT',
      content: 'Hi, I feel stuck in my career and need direction.',
      ai_generated: false,
      created_at: new Date(Date.now() - 2 * 3600000 - 15 * 60000).toISOString()
    },
    {
      id: 'wam-02',
      conversation_id: 'wacv-02',
      direction: 'OUTBOUND',
      message_type: 'TEXT',
      content: 'Welcome to Becoming Her 💛 I hear you. Feeling stuck often means your current container no longer fits who you are becoming. What part of your career feels most uncertain right now?',
      ai_generated: true,
      created_at: new Date(Date.now() - 2 * 3600000 - 14 * 60000).toISOString()
    },
    {
      id: 'wam-03',
      conversation_id: 'wacv-02',
      direction: 'INBOUND',
      message_type: 'TEXT',
      content: 'I want to shift from corporate employment to leadership consulting, but fear is holding me back.',
      ai_generated: false,
      created_at: new Date(Date.now() - 2 * 3600000 - 10 * 60000).toISOString()
    },
    {
      id: 'wam-04',
      conversation_id: 'wacv-02',
      direction: 'OUTBOUND',
      message_type: 'TEXT',
      content: 'That takes courage to articulate. The fear is often just unchanneled power. Becoming Her offers a Customized Digital Coaching Programme (KES 1,500) curated specifically around your individual roadmap and transition. Would you like to explore how it works?',
      ai_generated: true,
      created_at: new Date(Date.now() - 2 * 3600000 - 9 * 60000).toISOString()
    }
  ];

  public whatsappConfig: WhatsAppConfig = {
    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '109847291823901',
    business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'waba_991827364',
    business_number: '+254 720 120 227',
    webhook_verify_token: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'becoming_her_verify_token_2026',
    welcome_message: 'Hi 👋 Welcome to Becoming Her.\nI’m your Becoming Her digital coaching assistant. I’m here to help you explore your goals, answer questions, and find the right coaching experience for you.\nWhat would you like help with today?',
    ai_personality: 'Warm, sovereign, empathetic, deeply grounded executive and transformational coach for women.',
    business_hours: 'Monday - Saturday: 8:00 AM - 8:00 PM (EAT). AI Coach available 24/7.',
    human_handoff_enabled: true,
    automated_reminders_enabled: true,
    reminder_24h_template: 'Reminder 💛 You have a Becoming Her 1-on-1 coaching session with Coach Zipporah Karanja tomorrow at {time}. Meeting link: {meet_link}',
    reminder_1h_template: 'Your session with Coach Zipporah begins in 1 hour 💛 Grab your water, journal, and join here: {meet_link}',
    payment_confirmation_template: 'Your payment has been confirmed 💛\nWelcome to Becoming Her. Your coaching experience is now available.\nYou can continue your journey here:\n{dashboard_link}'
  };

  public getOrCreateWhatsAppContact(phoneNumber: string, name: string = 'Prospective Member', waId?: string): WhatsAppContact {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    let contact = this.whatsappContacts.find((c) => c.phone_number.replace(/\s+/g, '') === cleanPhone);

    if (!contact) {
      contact = {
        id: `wac-${Date.now()}`,
        phone_number: cleanPhone,
        whatsapp_user_id: waId,
        name,
        first_interaction: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      this.whatsappContacts.unshift(contact);
    } else {
      contact.last_interaction = new Date().toISOString();
      if (name && contact.name === 'Prospective Member') {
        contact.name = name;
      }
    }

    return contact;
  }

  public getActiveWhatsAppConversation(contactId: string, phoneNumber: string): WhatsAppConversation {
    let conv = this.whatsappConversations.find(
      (c) => c.contact_id === contactId && c.status !== 'RESOLVED'
    );

    if (!conv) {
      conv = {
        id: `wacv-${Date.now()}`,
        contact_id: contactId,
        phone_number: phoneNumber,
        state: 'NEW_VISITOR',
        status: 'BOT',
        session_token: `tok_${Math.random().toString(36).substring(2, 10)}`,
        message_count: 0,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      this.whatsappConversations.unshift(conv);
    }

    return conv;
  }

  public recordWhatsAppMessage(
    conversationId: string,
    direction: WhatsAppMessageDirection,
    content: string,
    messageType: WhatsAppMessageType = 'TEXT',
    aiGenerated: boolean = false,
    interactiveOptions?: string[]
  ): WhatsAppMessage {
    const msg: WhatsAppMessage = {
      id: `wam-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversation_id: conversationId,
      direction,
      message_type: messageType,
      content,
      ai_generated: aiGenerated,
      interactive_options: interactiveOptions,
      created_at: new Date().toISOString()
    };

    this.whatsappMessages.push(msg);

    const conv = this.whatsappConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.message_count += 1;
      conv.last_message_at = msg.created_at;
      conv.updated_at = msg.created_at;
    }

    return msg;
  }

  public updateWhatsAppConversationState(
    conversationId: string,
    state: WhatsAppConversationState,
    intendedService?: string,
    recommendedService?: string,
    summary?: string
  ): void {
    const conv = this.whatsappConversations.find((c) => c.id === conversationId);
    if (!conv) return;

    conv.state = state;
    if (intendedService) conv.intended_service = intendedService;
    if (recommendedService) conv.recommended_service = recommendedService;
    if (summary) conv.summary = summary;
    conv.updated_at = new Date().toISOString();
  }

  public toggleHumanHandoff(conversationId: string, isHuman: boolean): void {
    const conv = this.whatsappConversations.find((c) => c.id === conversationId);
    if (!conv) return;

    conv.status = isHuman ? 'HUMAN_HANDOFF' : 'BOT';
    conv.state = isHuman ? 'HUMAN_HANDOFF' : 'COACHING';
    conv.updated_at = new Date().toISOString();

    this.addAuditLog(
      'WHATSAPP_HANDOFF_TOGGLED',
      'WHATSAPP',
      `Conversation ${conversationId} status changed to ${conv.status}`
    );
  }

  public linkWhatsAppContactToUser(phoneNumber: string, userId: string): void {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const contact = this.whatsappContacts.find((c) => c.phone_number.replace(/\s+/g, '') === cleanPhone);
    if (contact) {
      contact.user_id = userId;
      contact.updated_at = new Date().toISOString();

      const convs = this.whatsappConversations.filter((c) => c.contact_id === contact.id);
      convs.forEach((c) => {
        c.user_id = userId;
      });
    }
  }

  public getWhatsAppFunnelMetrics(): WhatsAppFunnelMetrics {
    const total = this.whatsappConversations.length;
    let discovery = 0;
    let serviceInterest = 0;
    let purchaseIntent = 0;
    let registrationStarted = 0;
    let checkoutRedirect = 0;
    let paid = 0;

    let guidedCount = 0;
    let customCount = 0;
    let interpersonalCount = 0;

    this.whatsappConversations.forEach((c) => {
      discovery += 1;
      if (['SERVICE_RECOMMENDATION', 'PAYMENT_INTEREST', 'ACCOUNT_CREATION', 'PAYMENT_PENDING', 'PAYMENT_SUCCESSFUL', 'CUSTOMER_ACTIVE'].includes(c.state)) {
        serviceInterest += 1;
      }
      if (['PAYMENT_INTEREST', 'ACCOUNT_CREATION', 'PAYMENT_PENDING', 'PAYMENT_SUCCESSFUL', 'CUSTOMER_ACTIVE'].includes(c.state)) {
        purchaseIntent += 1;
      }
      if (['ACCOUNT_CREATION', 'PAYMENT_PENDING', 'PAYMENT_SUCCESSFUL', 'CUSTOMER_ACTIVE'].includes(c.state) || c.user_id) {
        registrationStarted += 1;
      }
      if (['PAYMENT_PENDING', 'PAYMENT_SUCCESSFUL', 'CUSTOMER_ACTIVE'].includes(c.state)) {
        checkoutRedirect += 1;
      }
      if (['PAYMENT_SUCCESSFUL', 'CUSTOMER_ACTIVE'].includes(c.state)) {
        paid += 1;
      }

      const s = c.intended_service || c.recommended_service;
      if (s === 'srv-guided-01' || s === 'guided-coaching') guidedCount += 1;
      else if (s === 'srv-custom-02' || s === 'custom-coaching') customCount += 1;
      else if (s === 'srv-interpersonal-03' || s === 'interpersonal-coaching') interpersonalCount += 1;
    });

    const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

    return {
      total_conversations: total,
      discovery_count: discovery,
      service_interest_count: serviceInterest,
      purchase_intent_count: purchaseIntent,
      registration_started_count: registrationStarted,
      checkout_redirect_count: checkoutRedirect,
      payment_successful_count: paid,
      conversion_rate_percentage: conversionRate,
      service_breakdown: {
        guided: guidedCount,
        customized: customCount,
        interpersonal: interpersonalCount
      }
    };
  }

  public getWhatsAppMessages(conversationId: string): WhatsAppMessage[] {
    return this.whatsappMessages.filter((m) => m.conversation_id === conversationId);
  }

  public getUserById(userId: string): { id: string; name: string; email: string; phone?: string } | null {
    // Check orders or entitlements for customer profile
    const order = this.orders.find((o) => o.customer_id === userId);
    if (order) {
      return {
        id: userId,
        name: order.customer_name,
        email: order.customer_email,
        phone: undefined
      };
    }
    return {
      id: userId,
      name: 'Valued Member',
      email: 'member@becomingher.co.ke'
    };
  }

  public getUserByEmail(email: string): { id: string; name: string; email: string; phone?: string } | null {
    const order = this.orders.find((o) => o.customer_email.toLowerCase() === email.toLowerCase());
    if (order) {
      return {
        id: order.customer_id,
        name: order.customer_name,
        email: order.customer_email
      };
    }
    return null;
  }

  public getBookings(): Booking[] {
    return this.bookings;
  }

  public getBookingsByUserId(userId: string): Booking[] {
    return this.bookings.filter((b) => b.customer_id === userId);
  }

  public getKnowledgeBaseArticles(): KnowledgeDocument[] {
    return this.knowledgeBase;
  }

  public getUserReflections(userId: string): UserReflection[] {
    const list = this.reflections.filter((r) => r.user_id === userId);
    // If no direct reflections, check if demo reflections can guide
    if (list.length === 0 && (userId === 'cust-demo-01' || !userId)) {
      return this.reflections;
    }
    return list;
  }

  public saveUserReflection(params: {
    userId: string;
    question: string;
    response: string;
    programmeId?: string;
    moduleId?: string;
    questionId?: string;
  }): UserReflection {
    const newRef: UserReflection = {
      id: `ref-${Date.now()}`,
      user_id: params.userId,
      programme_id: params.programmeId || 'prog-guided-01',
      module_id: params.moduleId || 'mod-1',
      question_id: params.questionId || `q-${Date.now()}`,
      question: params.question,
      response: params.response,
      created_at: new Date().toISOString()
    };
    this.reflections.unshift(newRef);
    return newRef;
  }

  public getUserGoals(userId: string): Goal[] {
    const list = this.goals.filter((g) => g.user_id === userId);
    if (list.length === 0 && (userId === 'cust-demo-01' || !userId)) {
      return this.goals;
    }
    return list;
  }

  public getUserQuestionnaire(userId: string): any {
    return this.questionnaires[userId];
  }
}

export const store = Store.getInstance();
