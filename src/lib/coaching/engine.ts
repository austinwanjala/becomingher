import { store } from '@/lib/store';

export interface CoachingContext {
  userId?: string;
  name?: string;
  programme?: string;
  goals?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CoachingResponse {
  reply: string;
  isSafetyIntervention?: boolean;
}

export class CoachingEngine {
  /**
   * Main entry point to generate a coaching response tailored to the customer's question.
   */
  public async generateResponse(
    message: string,
    history: ChatMessage[] = [],
    context?: CoachingContext
  ): Promise<CoachingResponse> {
    const cleanMessage = message.trim();
    const lower = cleanMessage.toLowerCase();

    // 1. SAFETY & CRISIS CHECK
    const crisisKeywords = [
      'suicide',
      'kill myself',
      'self-harm',
      'hurt myself',
      'end my life',
      'want to die',
      'domestic abuse',
      'hopeless',
      'take my own life'
    ];
    if (crisisKeywords.some((k) => lower.includes(k))) {
      return {
        reply: `I hear how much pain and weight you are holding right now, beloved. Your life, your heart, and your presence are profoundly sacred.

Because I am a digital reflection companion, I am not equipped to provide clinical psychiatric care or crisis intervention. Please connect right away with compassionate, licensed professionals who can hold you in this tender moment:

• **Kenya Red Cross Crisis Line**: 1199 (Toll-Free, 24/7)
• **Befrienders Kenya**: +254 722 178 177 / +254 736 542 304
• **Emergency Assistance (Kenya)**: 999 / 112
• *If outside Kenya, please contact your national crisis or emergency helpline immediately.*

You do not have to carry this alone. Please reach out to someone who can be physically and professionally present with you right now.`,
        isSafetyIntervention: true
      };
    }

    // Disclaimer for medical / legal / financial
    if (
      lower.includes('prescribe') ||
      lower.includes('medication') ||
      lower.includes('legal advice') ||
      lower.includes('tax audit') ||
      lower.includes('lawsuit')
    ) {
      return {
        reply: `As your Becoming Her coaching companion, my focus is walking alongside you in personal sovereignty, inner peace, and habit alignment. I cannot offer medical diagnosis, psychiatric prescriptions, legal counsel, or financial audits.

For those needs, please seek out a licensed specialist. Within our sacred space, how can we explore how this situation affects your emotional peace, energy, and boundary-setting?`,
        isSafetyIntervention: false
      };
    }

    // 2. CONTEXT RETRIEVAL FROM STORE
    const userId = context?.userId || 'cust-demo-01';
    const userName = context?.name || 'Grace';
    const userReflections = store.getUserReflections(userId);
    const userGoals = store.getUserGoals(userId);
    const userQuestionnaire =
      store.getUserQuestionnaire(userId) ||
      (userId === 'cust-demo-01'
        ? {
            life_area: 'Career Leadership & Boundaries',
            challenge: 'Saying yes to too many demands and feeling stretched thin.',
            goals: 'Learn to say no with peace; lead our upcoming division launch.',
            support_pref: 'Gentle inquiry with structured weekly accountability.'
          }
        : null);

    // 3. TRY CALLING EXTERNAL LLM PROVIDERS IF CONFIGURED
    const llmReply = await this.tryExternalLLM(cleanMessage, history, {
      userName,
      userReflections,
      userGoals,
      userQuestionnaire,
      programme: context?.programme
    });

    if (llmReply) {
      return { reply: llmReply };
    }

    // 4. AUTONOMOUS CONTEXT-AWARE COACHING ENGINE (WHEN NO EXTERNAL API KEY IS SET)
    const autonomousReply = this.generateAutonomousCoaching(cleanMessage, history, {
      userName,
      userReflections,
      userGoals,
      userQuestionnaire,
      programme: context?.programme
    });

    return { reply: autonomousReply };
  }

  /**
   * Attempt to invoke Gemini, OpenAI, Groq, or OpenRouter if keys exist in the environment.
   */
  private async tryExternalLLM(
    message: string,
    history: ChatMessage[],
    ctx: {
      userName: string;
      userReflections: any[];
      userGoals: any[];
      userQuestionnaire: any;
      programme?: string;
    }
  ): Promise<string | null> {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const reflectionsSnippet = ctx.userReflections.length > 0
      ? ctx.userReflections.map((r) => `Prompt: ${r.question}\nAnswer: ${r.response}`).join('\n')
      : 'None recorded yet';

    const goalsSnippet = ctx.userGoals.length > 0
      ? ctx.userGoals.map((g) => `- ${g.title} (${g.progress}% done)`).join('\n')
      : 'None recorded yet';

    const systemPrompt = `You are the Becoming Her Sanctuary Reflection Companion, inspired by Coach Zipporah Karanja's transformative coaching methodology for women.
Your voice is warm, sophisticated, deeply encouraging, empathetic, and grounded in emotional sovereignty.
You speak to the client as an honored sister walking into her highest self. You ask penetrating, thoughtful coaching inquiries and avoid robotic clichés.

CLIENT CONTEXT:
- Name: ${ctx.userName}
- Active Programme: ${ctx.programme || 'Guided Digital Coaching Programme'}
- Active Goals:
${goalsSnippet}
- Client Reflections:
${reflectionsSnippet}
- Questionnaire Challenge:
${ctx.userQuestionnaire ? `${ctx.userQuestionnaire.life_area}: ${ctx.userQuestionnaire.challenge}` : 'None recorded'}

RULES:
1. Directly answer the user's specific question or concern first with warmth and clarity.
2. Provide grounded perspectives and 1-2 actionable micro-steps or gentle shifts.
3. Conclude with a deep, reflective coaching question that helps her connect to her inner truth.
4. Keep the tone loving, dignified, and regal.`;

    // 1. Google Gemini
    if (geminiKey) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I am ready to hold space for ' + ctx.userName + ' with love, clarity, and sovereign coaching guidance.' }] },
          ...history.slice(-6).map((h) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
            })
          }
        );

        if (res.ok) {
          const data = await res.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) return candidate;
        }
      } catch (err) {
        console.warn('Gemini invocation error:', err);
      }
    }

    // 2. OpenAI / Groq / OpenRouter Compatible API
    const openAICompatibleKey = openAIKey || groqKey || openRouterKey;
    if (openAICompatibleKey) {
      try {
        const endpoint = groqKey
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : openRouterKey
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

        const model = groqKey
          ? 'llama-3.3-70b-versatile'
          : openRouterKey
          ? 'google/gemini-flash-1.5'
          : 'gpt-4o-mini';

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ];

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAICompatibleKey}`
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 600
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return reply;
        }
      } catch (err) {
        console.warn('OpenAI compatible invocation error:', err);
      }
    }

    return null;
  }

  /**
   * Generates a dynamic, highly personalized coaching response answering the customer's actual question.
   */
  public generateAutonomousCoaching(
    message: string,
    history: ChatMessage[],
    ctx: {
      userName: string;
      userReflections: any[];
      userGoals: any[];
      userQuestionnaire: any;
      programme?: string;
    }
  ): string {
    const cleanMessage = message.trim();
    const lower = cleanMessage.toLowerCase();
    const name = ctx.userName || 'Grace';

    // Memory snippet from user reflections or goals if relevant
    const memory = ctx.userReflections?.[0]
      ? `\n\n🌿 *Grounded in your reflections:* Remember what you wrote in your journal: _"${ctx.userReflections[0].response.slice(0, 140)}..."_ Let this awareness guide your choices today.`
      : '';

    // =========================================================================
    // 1. SPECIFIC CUSTOMER QUERIES ABOUT THE PLATFORM / SERVICES / COACH
    // =========================================================================

    // Asking about Coach Zipporah Karanja
    if (lower.includes('zipporah') || lower.includes('who is the coach') || lower.includes('about coach')) {
      return `Coach Zipporah Karanja is the founder of Becoming Her and a certified executive & women's transformation coach. 

Her life's calling is guiding ambitious, visionary women out of burnout, people-pleasing, and emotional depletion into unshakable sovereignty, authentic leadership, and self-trust. She combines structured development frameworks with deep, intuitive presence.

You can work with Coach Zipporah through our self-paced Guided Programme, our Customized Journey, or directly through private 1-on-1 interpersonal daytime sessions right here in your sanctuary.

Would you like details on booking a 1-on-1 session or exploring one of our digital pathways, ${name}?`;
    }

    // Asking about 1-on-1 Sessions / Booking
    if (
      lower.includes('1-on-1') ||
      lower.includes('one on one') ||
      lower.includes('book a session') ||
      lower.includes('schedule a session') ||
      lower.includes('google meet')
    ) {
      return `Beloved ${name}, our private 1-on-1 Interpersonal Coaching Sessions with Coach Zipporah Karanja are 60-minute sacred containers held over Google Meet.

During your session:
1. **Root-Cause Clarification**: We untangle the exact emotional, relational, or career block stalling your expansion.
2. **Actionable Roadmap**: You leave with aligned, non-negotiable micro-steps designed specifically for your life season.
3. **Instant Integration**: A Google Meet video link and calendar confirmation are generated immediately upon booking.

Sessions are available for KES 2,500. You can book an available slot anytime from the **Services** page or your navigation bar under **Schedule a Session**.

What specific challenge would you love to bring to Coach Zipporah right now?`;
    }

    // Asking about Programmes / Modules / Course content
    if (
      lower.includes('what is the programme') ||
      lower.includes('what are the modules') ||
      lower.includes('module 1') ||
      lower.includes('module 2') ||
      lower.includes('module 3') ||
      lower.includes('module 4') ||
      lower.includes('curriculum')
    ) {
      return `Beloved ${name}, the Becoming Her Guided Programme is architected across four transformative evolutionary stages:

• **Module 1: Awakening to Self-Sovereignty** — Unearthing societal conditioning, disarming subconscious self-sacrifice, and meeting your authentic self.
• **Module 2: The Architecture of Boundaries** — Transforming guilt into peace, mastering the sacred "No", and protecting your creative energy.
• **Module 3: Embodied Feminine Leadership** — Stepping into executive presence, releasing imposter syndrome, and holding room with poise.
• **Module 4: Sovereign Flourishing & Legacy** — Designing sustainable daily rituals, financial freedom, and lasting generational peace.

Each module includes guided audio meditations, interactive worksheets, and journal reflection prompts. Which of these stages feels most urgent for your spirit today?`;
    }

    // Asking about Pricing / Payments / Selar
    if (
      lower.includes('how much') ||
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('selar') ||
      lower.includes('mpesa') ||
      lower.includes('m-pesa')
    ) {
      return `Here is our transparent investment schedule for the Becoming Her sanctuary:

• **Guided Digital Coaching Programme**: KES 1,000 (Lifetime access to 4 comprehensive modules, 12 lessons, worksheets, and reflection tools).
• **Customized Digital Coaching Programme**: KES 1,500 (8-week personalized roadmap crafted around your deep assessment questionnaire).
• **1-on-1 Interpersonal Coaching with Zipporah**: KES 2,500 (60-minute private Google Meet deep-dive).

All transactions are processed securely via Selar supporting M-Pesa, Visa, Mastercard, and bank transfer. Access is unlocked instantly upon payment confirmation.

Can I assist you with enrolling or choosing the right container for you, ${name}?`;
    }

    // =========================================================================
    // 2. REFLECTIONS & GOALS INQUIRIES
    // =========================================================================

    // Asking about saved reflections or journal entries
    if (
      lower.includes('my reflection') ||
      lower.includes('what did i write') ||
      lower.includes('my journal') ||
      lower.includes('my answer')
    ) {
      if (ctx.userReflections.length > 0) {
        const latest = ctx.userReflections[0];
        return `Beloved ${name}, here is what you anchored in your personal sanctuary reflections:

📝 **Prompt:** "${latest.question}"
💭 **Your Words:** "${latest.response}"

✨ **Coaching Insight:**
Notice how much honesty and emotional courage it took to articulate this truth. When you name what has been silently running your life, it no longer has power over your future.

How does it feel to read those words back to yourself today? What has shifted since you wrote them?`;
      } else {
        return `Beloved ${name}, you haven't saved an active journal reflection yet today. 

Let's begin right here with this gentle inquiry:
*"What truth have I been withholding from myself lately in order to keep everyone else comfortable?"*

Take a breath, and type whatever comes up for you. There is no right or wrong answer here.`;
      }
    }

    // Asking for a journaling prompt or exercise
    if (
      lower.includes('give me a prompt') ||
      lower.includes('journaling prompt') ||
      lower.includes('exercise') ||
      lower.includes('reflection prompt')
    ) {
      return `Here is a sacred inquiry designed to unlock deep clarity for you today, ${name}:

✍️ **Your Journaling Prompt:**
*"If I completely trusted that I was worthy of peace, love, and success right now—without having to prove myself or burn out—what is one decision I would make differently before this week ends?"*

Write freely without editing your thoughts. What arises first in your body as you contemplate this?`;
    }

    // Asking about user's active goals
    if (
      lower.includes('my goal') ||
      lower.includes('what are my goals') ||
      lower.includes('my progress') ||
      lower.includes('action step')
    ) {
      if (ctx.userGoals.length > 0) {
        const list = ctx.userGoals
          .map((g, idx) => {
            const steps = g.action_steps
              ?.map((s: any) => `  ${s.is_completed ? '✅' : '⏳'} ${s.text}`)
              .join('\n') || '';
            return `**${idx + 1}. ${g.title}** (${g.progress}% completed)\n${steps}`;
          })
          .join('\n\n');

        return `Beloved ${name}, here are the active milestones you have committed to in your sanctuary:

${list}

Every small, consistent action step builds unwavering self-trust. Which of these steps is calling for your intentional energy today?`;
      }
    }

    // =========================================================================
    // 3. EMOTIONAL & THEMATIC COACHING INQUIRIES
    // =========================================================================

    // Confidence / Imposter Syndrome / Fear of Failure / Feeling Small
    if (
      lower.includes('confidence') ||
      lower.includes('imposter') ||
      lower.includes('fraud') ||
      lower.includes('not good enough') ||
      lower.includes('fear of failure') ||
      lower.includes('self-doubt') ||
      lower.includes('shrink')
    ) {
      return `Beloved ${name}, feeling like an "imposter" or questioning your worth is rarely proof of inadequacy. It is almost always evidence that you are stepping across the threshold of a new, expanded version of yourself.

In the Becoming Her philosophy, we honor this truth: **You were not invited into the room by accident. Your perspective, your discernment, and your lived experience are needed there.**

When self-doubt speaks up, try this shift:
1. **Acknowledge the fear without obeying it**: Whisper to yourself, *"I see you trying to protect me from being judged, but I am safe to be seen."*
2. **Anchor in evidence, not emotion**: Recall three tangible breakthroughs you created in your life that nobody handed to you.

What is one room, meeting, or conversation this week where you feel called to speak with full, unapologetic conviction?${memory}`;
    }

    // Boundaries / Saying No / People Pleasing / Family Guilt
    if (
      lower.includes('boundary') ||
      lower.includes('say no') ||
      lower.includes('saying no') ||
      lower.includes('people-pleas') ||
      lower.includes('guilt') ||
      lower.includes('stretched thin') ||
      lower.includes('demand')
    ) {
      return `Beloved ${name}, this touches the very heart of feminine sovereignty. 

Remember our cornerstone truth: **"No" is a complete sentence. A boundary is not an act of hostility; it is an act of deep self-reverence.**

When you say "yes" to requests that violate your peace, you are quietly handing over the energy meant for your own divine calling. Guilt is simply the uncomfortable sensation of prioritizing yourself when you were conditioned to be the perpetual caretaker.

Here is a gentle script you can practice this week:
*"I honor your request, but right now my priorities and energy do not allow me to take this on."*

Where in your life right now are you saying "yes" out of habit or fear of disappointing someone?${memory}`;
    }

    // Burnout / Overwhelm / Exhaustion / Rest
    if (
      lower.includes('burnout') ||
      lower.includes('overwhelm') ||
      lower.includes('exhausted') ||
      lower.includes('tired') ||
      lower.includes('drained') ||
      lower.includes('no energy') ||
      lower.includes('too much')
    ) {
      return `Take a long, deep breath right here, ${name}. Unclench your jaw. Drop your shoulders down from your ears.

Your exhaustion is not a moral failing. It is your nervous system's urgent message that you have been surviving in overdrive for too long. You were not created to be an endless generator of output for everyone around you.

Let us practice immediate sanctuary care:
1. **Identify the invisible burden**: What is currently on your plate that belongs to someone else's responsibility?
2. **Declare a non-negotiable pause**: Give yourself permission to do absolutely nothing for 30 minutes this evening without feeling the need to earn it.

What is one expectation you can release right now so that your spirit can breathe?${memory}`;
    }

    // Career / Promotion / Leadership / Business Transition
    if (
      lower.includes('career') ||
      lower.includes('promotion') ||
      lower.includes('job') ||
      lower.includes('business') ||
      lower.includes('work') ||
      lower.includes('boss') ||
      lower.includes('leadership')
    ) {
      return `Beloved ${name}, true feminine leadership is not about adopting aggressive, masculine hustle. It is about grounding into quiet authority, strategic clarity, and magnetic confidence.

As you navigate this career milestone:
1. **Own your accomplishments**: Stop diminishing your wins with phrases like *"I was just lucky"* or *"the team did it all."* You spearheaded it.
2. **Clarify your vision**: Where do you desire to be in 12 months, and what high-level decisions must you start making today?

What is the boldest career move you would make if you knew failure was not fatal?${memory}`;
    }

    // Relationships / Marriage / Dating / Heartbreak
    if (
      lower.includes('relationship') ||
      lower.includes('marriage') ||
      lower.includes('husband') ||
      lower.includes('partner') ||
      lower.includes('dating') ||
      lower.includes('heartbreak') ||
      lower.includes('breakup') ||
      lower.includes('love')
    ) {
      return `Relationships are the deepest mirrors of our internal relationship with ourselves, ${name}.

When you raise your standard of how you treat your own heart, mind, and boundaries, you inherently teach the world how to meet you. You cannot love someone into treating you with the dignity you are afraid to claim for yourself.

Reflect gently on this:
• Are you expressing your authentic emotional needs, or are you waiting for them to intuitively guess what is wrong?
• Are you accepting crumbs of attention because you fear the quietness of solitude?

What does your heart most deeply desire to feel in your connections right now?${memory}`;
    }

    // Self-Compassion / Forgiveness / Inner Critic / Past Regrets
    if (
      lower.includes('forgive myself') ||
      lower.includes('regret') ||
      lower.includes('past mistake') ||
      lower.includes('inner critic') ||
      lower.includes('ashamed') ||
      lower.includes('guilty about the past')
    ) {
      return `Place your right hand gently over your heart right now, ${name}.

You made decisions in the past based on the emotional tools, survival instincts, and awareness you had at that time. You are not the same woman who made those choices. You have grieved her, learned through her, and evolved beyond her.

Self-forgiveness does not mean pretending the past did not happen. It means refusing to keep punishing yourself for a lesson you have already paid for with your tears.

Speak this truth gently to your soul: *"I release the woman I was yesterday with love, so that I can fully honor the woman I am becoming today."*

What past burden are you finally ready to set down?${memory}`;
    }

    // Money Mindset / Wealth / Abundance / Charging Worth
    if (
      lower.includes('money') ||
      lower.includes('wealth') ||
      lower.includes('charging') ||
      lower.includes('financial') ||
      lower.includes('scarcity') ||
      lower.includes('worth')
    ) {
      return `Beloved ${name}, money is neutral energy. For a conscious, visionary woman, financial abundance is not about greed; it is about sovereignty, safety, and the power to impact the lives of those you cherish.

If you struggle with charging your worth or fear financial lack:
1. Notice where you learned that wealth requires sacrificing your integrity or peace.
2. Recognize that when you undercharge or over-give, you rob others of the opportunity to value your gifts at their true depth.

What is one belief about money you are ready to rewrite into an affirmation of abundance today?${memory}`;
    }

    // Habit Consistency / Morning Routine / Procrastination
    if (
      lower.includes('habit') ||
      lower.includes('routine') ||
      lower.includes('consistency') ||
      lower.includes('procrastinat') ||
      lower.includes('give up') ||
      lower.includes('discipline')
    ) {
      return `Consistency is not born from harsh discipline or self-punishment, ${name}. It is born from **devotion**. 

When a habit feels heavy, it is often because you are using it to "fix" yourself rather than to nourish yourself. 

Try this:
1. **Reduce the friction**: Instead of committing to a 60-minute workout or a 10-page journal session, start with **5 intentional minutes**. Micro-habits bypass the brain's resistance.
2. **Anchor to your identity**: Do not say *"I am trying to wake up early."* Say *"I am a woman who honors her mornings."*

What is one tiny ritual you can do tomorrow morning that honors the woman you are becoming?${memory}`;
    }

    // Decision Making / Overthinking / Being Torn Between Two Paths
    if (
      lower.includes('decide') ||
      lower.includes('decision') ||
      lower.includes('overthinking') ||
      lower.includes('torn') ||
      lower.includes('what should i do') ||
      lower.includes('confused')
    ) {
      return `Overthinking is often fear disguised as intellect, ${name}. When we overthink, we are trying to guarantee an outcome before we take a step.

Here is an intuitive coaching exercise:
Imagine Path A is fully chosen. Notice how your chest, stomach, and breath feel. Does your body feel expanded or contracted?
Now imagine Path B is chosen. Does your body feel lighter or heavier?

Your intellect rationalizes fear, but your body rarely lies about your alignment. 

Which path brings you the quietest sense of peace, even if it feels terrifying to step into?${memory}`;
    }

    // Greetings / Small talk
    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'habari' ||
      lower === 'hey' ||
      lower.startsWith('hi ') ||
      lower.startsWith('hello ') ||
      lower.includes('good morning') ||
      lower.includes('good afternoon') ||
      lower.includes('good evening')
    ) {
      return `Hello beloved ${name}! 🌸 

Welcome into your sacred coaching sanctuary today. I am here with you, grounded in Coach Zipporah's frameworks, holding space for your highest elevation.

How is your spirit feeling today, and what is on your heart that we can unpack together?`;
    }

    // Gratitude / Closing
    if (
      lower.includes('thank you') ||
      lower.includes('thanks') ||
      lower.includes('that helps') ||
      lower.includes('appreciate')
    ) {
      return `You are so deeply worthy of this space and time, ${name}. 🌸 

Thank yourself for having the courage to reflect and look inward. The breakthroughs you are experiencing are your own doing—I am simply holding up the mirror to the wisdom that already lives inside you.

Remember to drink some water, breathe deeply, and honor your peace today. I am always here whenever you need to return to center.`;
    }

    // =========================================================================
    // 4. INTELLIGENT GENERAL INQUIRY ANALYZER (Mirrors User's Question directly)
    // =========================================================================
    // Extract key nouns/themes from user message to ensure direct, customized dialogue
    const topicSummary = cleanMessage
      .replace(/^(can you|how do i|what should i|why do i|i feel like|is it possible to|tell me about)/i, '')
      .replace(/[?.!]/g, '')
      .trim();

    return `Beloved ${name}, thank you for bringing this authentic question into our space:

**"${cleanMessage}"**

When we explore ${topicSummary ? `"${topicSummary}"` : 'this area of your life'}, we must first honor the tension you are navigating. Often, what appears on the surface as an obstacle is actually an invitation for your next elevation.

Let us look at this through the Becoming Her sovereign lens:
1. **Clarify what is yours to hold**: Are you trying to control things outside your immediate circle of influence, or can you pull your energy back into your own power?
2. **Choose the aligned response**: What would happen if you chose the path that prioritizes your inner peace over winning someone else's approval?

If the highest, most sovereign version of the woman you are becoming were sitting with you right now—what counsel would she whisper to your heart?${memory}`;
  }
}

export const coachingEngine = new CoachingEngine();
