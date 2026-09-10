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

Because I am an AI coaching assistant, I am not equipped to provide clinical mental health therapy or crisis intervention. Please connect right away with trusted professionals who can hold and support you:

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

    // 2. CONTEXTUAL KNOWLEDGE RETRIEVAL
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
        const systemPrompt = `You are the Becoming Her Digital Coaching Assistant, an empathetic, empowering, and grounded executive and life coach for ambitious women.
Your voice is warm, sophisticated, sovereign, and deeply encouraging. You ask incisive reflective questions, avoid fluffy generic clichés, and help the user clarify priorities and actionable micro-steps.
User Profile: Name: ${userContext?.name || 'Beloved'}, Programme: ${userContext?.programme || 'Becoming Her'}, Goals: ${userContext?.goals || 'Personal transformation'}.
Knowledge Base Context:
${knowledgeSnippet || 'Use Becoming Her 4-stage framework: Awakening, Re-Identification, Embodiment, Sovereign Flourishing.'}

Never present yourself as a doctor, therapist, or legal counsel. Keep responses concise, uplifting, and question-driven.`;

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

    // 4. INTELLIGENT EXPERT FALLBACK COACHING LOGIC
    // Responds dynamically with deep transformative inquiry
    let reply = '';

    if (lower.includes('goal') || lower.includes('achieve') || lower.includes('plan')) {
      reply = `Setting audacious desires is sacred, but sovereignty lives in how you execute without burning out. 

When you envision this goal accomplished:
1. **Who is the woman you must become** in order to sustain it with ease rather than stress?
2. What is **one small non-negotiable ritual** you can start tomorrow morning that honors this intention?

Let’s break it down into an aligned micro-step right now.`;
    } else if (lower.includes('boundary') || lower.includes('say no') || lower.includes('people-pleas')) {
      reply = `Remember our core principle: **A boundary is not a wall; it is a door with a lock.** 

When you say "yes" to something that drains your spirit, what sacred part of yourself are you quietly saying "no" to? 

Try practicing this quiet affirmation today: *"My peace is non-negotiable, and I do not need anyone’s permission to protect my energy."* Where is one area this week where you need to communicate a calm, clear boundary?`;
    } else if (lower.includes('overwhelm') || lower.includes('tired') || lower.includes('stress')) {
      reply = `Take a deep, slow breath right here. Place a hand over your heart. 

Overwhelm is often your nervous system’s way of saying: *"I am carrying things that do not belong to me."* 

Let’s pause and untangle this together:
• What is on your plate right now that is **urgent for others, but not important for your peace**?
• What can you give yourself permission to drop, delegate, or postpone until next week?`;
    } else if (lower.includes('module') || lower.includes('lesson') || lower.includes('exercise')) {
      reply = `In the Becoming Her framework, every lesson is an invitation to unlearn conditioning and anchor into self-trust. 

As you move through this part of your programme, pay close attention to your body's subtle reactions. Resistance is rarely a sign of inadequacy; it is often the exact doorway where your deepest breakthrough waits. 

What reflection from your current module resonated or stirred you the most today?`;
    } else {
      reply = `Thank you for bringing your authentic voice into this space. 

As women, we often spend so much time listening to the external noise and demands of the world that our own quiet inner wisdom gets drowned out. 

If you were to step back and look at this moment from the eyes of the highest, most grounded, unapologetic woman you are becoming—what would she tell you to focus on right now?`;
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
