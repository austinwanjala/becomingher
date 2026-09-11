import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, conversationId, userContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const lower = message.toLowerCase();

    // 1. ETHICAL SAFETY CHECK
    // If user mentions severe depression, self-harm, crisis, suicide, or abuse
    const crisisKeywords = ['suicide', 'kill myself', 'self-harm', 'hurt myself', 'end my life', 'abuse', 'hopeless'];
    const isCrisis = crisisKeywords.some((keyword) => lower.includes(keyword));

    if (isCrisis) {
      return NextResponse.json({
        reply: `I hear how much pain you are holding right now, and I want you to know that your life and well-being are sacred. 

Because I am a digital reflection companion, I am not equipped to provide clinical mental health therapy or crisis intervention. Please connect right away with trusted professionals who can hold and support you:

• **Kenya Red Cross Toll-Free Crisis Line**: 1199 (Available 24/7)
• **Befrienders Kenya**: +254 722 178 177
• **Emergency Services**: 999 / 112
• If outside Kenya, please reach out to your local emergency helpline immediately.

You do not have to carry this alone. Please reach out to someone who can be physically and professionally present with you today.`,
        isSafetyIntervention: true
      });
    }

    // Medical/legal/financial disclaimer check
    if (lower.includes('prescribe') || lower.includes('medication') || lower.includes('legal advice') || lower.includes('tax audit')) {
      return NextResponse.json({
        reply: `As your Becoming Her digital coaching assistant, my purpose is to support your personal growth, habit alignment, emotional sovereignty, and goal execution. I cannot provide medical, psychiatric, legal, or financial advisory services. I encourage you to consult a licensed specialist for clinical and legal decisions. 

How can we look at this through the lens of your inner peace, personal agency, or boundary-setting?`,
        isSafetyIntervention: false
      });
    }

    // 2. CONTEXTUAL RETRIEVAL (Reflections, Questionnaire, Goals & KB)
    const userId = userContext?.userId || 'cust-demo-01';
    const userName = userContext?.name || 'Grace';
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

    // Check if user is asking specifically about their answered reflections
    if (
      lower.includes('reflection') ||
      lower.includes('what did i write') ||
      lower.includes('my answer') ||
      lower.includes('limiting belief') ||
      lower.includes('what did i answer')
    ) {
      if (userReflections.length > 0) {
        const latest = userReflections[0];
        let insight = '';
        if (latest.response.toLowerCase().includes('savior') || latest.response.toLowerCase().includes('sacrifice')) {
          insight = 'You wrote about unlearning the need to be the perpetual savior and outgrowing the belief that worth comes from self-sacrifice. That is a foundational breakthrough.';
        } else {
          insight = 'Your answer reflects deep emotional courage and an intentional commitment to your personal sovereignty.';
        }

        return NextResponse.json({
          reply: `Beloved ${userName}, here is what you anchored in your personal transformation reflections:

📝 **Prompt:** "${latest.question}"
💭 **Your Response:** "${latest.response}"

✨ **Coach Insight:**
${insight}

How is this realization speaking to you in your present moment?`
        });
      }
    }

    // Check if user is asking specifically about their active goals or progress
    if (
      lower.includes('my goal') ||
      lower.includes('what are my goals') ||
      lower.includes('my action step') ||
      lower.includes('my progress')
    ) {
      if (userGoals.length > 0) {
        const formattedGoals = userGoals
          .map((g, idx) => {
            const steps = g.action_steps.map((s) => `  ${s.is_completed ? '✅' : '⏳'} ${s.text}`).join('\n');
            return `**${idx + 1}. ${g.title}** (${g.progress}% completed)\n*Category: ${g.category}*\n${steps}`;
          })
          .join('\n\n');

        return NextResponse.json({
          reply: `Beloved ${userName}, here are your active transformation milestones:

${formattedGoals}

Which of these steps would you like to dedicate your focus to today?`
        });
      }
    }

    // Check if user is asking specifically about their onboarding questionnaire
    if (lower.includes('questionnaire') || lower.includes('onboarding') || lower.includes('assessment') || lower.includes('my challenge')) {
      if (userQuestionnaire) {
        return NextResponse.json({
          reply: `Beloved ${userName}, here is your customized life assessment focus:

🌿 **Growth Area:** ${userQuestionnaire.life_area}
⚡ **Core Challenge:** ${userQuestionnaire.challenge}
🎯 **Primary Desired Transformation:** ${userQuestionnaire.goals}

How is this challenge feeling right now, and what boundary can we strengthen together?`
        });
      }
    }

    // Match knowledge base documents
    const matchedDocs = store.knowledgeBase
      .filter((doc) => doc.is_published)
      .filter((doc) =>
        doc.tags.some((tag) => lower.includes(tag)) ||
        lower.includes(doc.title.toLowerCase())
      );

    const knowledgeSnippet = matchedDocs.map((d) => `${d.title}: ${d.content}`).join('\n\n');

    // 3. API CALL TO LLM IF KEY IS PRESENT
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (apiKey && process.env.OPENAI_API_KEY) {
      try {
        const reflectionsContext = userReflections.map(r => `Q: ${r.question}\nA: ${r.response}`).join('\n');
        const systemPrompt = `You are the Becoming Her Digital Coaching Assistant, an empathetic, empowering, and grounded executive and life coach for ambitious women.
Your voice is warm, sophisticated, sovereign, and deeply encouraging. You ask incisive reflective questions, avoid fluffy generic clichés, and help the user clarify priorities and actionable micro-steps.
User Profile: Name: ${userName}, Programme: ${userContext?.programme || 'Becoming Her'}, Goals: ${userGoals.map(g => g.title).join(', ')}.
User's Answered Reflections:
${reflectionsContext || 'None recorded yet.'}
User's Questionnaire Challenge:
${userQuestionnaire ? `${userQuestionnaire.life_area}: ${userQuestionnaire.challenge}` : 'None recorded.'}
Knowledge Base Context:
${knowledgeSnippet || 'Use Becoming Her 4-stage framework: Awakening, Re-Identification, Embodiment, Sovereign Flourishing.'}

Always ground your answers in what the user answered in their reflections when relevant. Never present yourself as a doctor, therapist, or legal counsel. Keep responses concise, uplifting, and question-driven.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 600
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply });
          }
        }
      } catch (err) {
        console.error('Error calling external LLM:', err);
      }
    }

    // 4. INTELLIGENT EXPERT FALLBACK COACHING LOGIC (Grounded in User's Answered Questions)
    let reply = '';
    let memorySnippet = '';
    if (userReflections.length > 0) {
      memorySnippet = `\n\n💡 *Grounded in your reflections:* Remember what you wrote: _"${userReflections[0].response.slice(0, 160)}..."_ Let this awareness guide your choices today.`;
    } else if (userQuestionnaire?.challenge) {
      memorySnippet = `\n\n💡 *Grounded in your goals:* In your onboarding assessment, you focused on _"${userQuestionnaire.challenge}"_. Honor that intention today.`;
    }

    if (lower.includes('goal') || lower.includes('achieve') || lower.includes('plan')) {
      reply = `Setting audacious desires is sacred, but sovereignty lives in how you execute without burning out. 

When you envision this goal accomplished:
1. **Who is the woman you must become** in order to sustain it with ease rather than stress?
2. What is **one small non-negotiable ritual** you can start tomorrow morning that honors this intention?

Let’s break it down into an aligned micro-step right now.${memorySnippet}`;
    } else if (lower.includes('boundary') || lower.includes('say no') || lower.includes('people-pleas')) {
      reply = `Remember our core principle: **A boundary is not a wall; it is a door with a lock.** 

When you say "yes" to something that drains your spirit, what sacred part of yourself are you quietly saying "no" to? 

Try practicing this quiet affirmation today: *"My peace is non-negotiable, and I do not need anyone’s permission to protect my energy."* Where is one area this week where you need to communicate a calm, clear boundary?${memorySnippet}`;
    } else if (lower.includes('overwhelm') || lower.includes('tired') || lower.includes('stress')) {
      reply = `Take a deep, slow breath right here. Place a hand over your heart. 

Overwhelm is often your nervous system’s way of saying: *"I am carrying things that do not belong to me."* 

Let’s pause and untangle this together:
• What is on your plate right now that is **urgent for others, but not important for your peace**?
• What can you give yourself permission to drop, delegate, or postpone until next week?${memorySnippet}`;
    } else if (lower.includes('module') || lower.includes('lesson') || lower.includes('exercise')) {
      reply = `In the Becoming Her framework, every lesson is an invitation to unlearn conditioning and anchor into self-trust. 

As you move through this part of your programme, pay close attention to your body's subtle reactions. Resistance is rarely a sign of inadequacy; it is often the exact doorway where your deepest breakthrough waits. 

What reflection from your current module resonated or stirred you the most today?${memorySnippet}`;
    } else {
      reply = `Thank you for bringing your authentic voice into this space, ${userName}. 

As women, we often spend so much time listening to the external noise and demands of the world that our own quiet inner wisdom gets drowned out. 

If you were to step back and look at this moment from the eyes of the highest, most grounded, unapologetic woman you are becoming—what would she tell you to focus on right now?${memorySnippet}`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI coaching assistant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate coaching response' },
      { status: 500 }
    );
  }
}
