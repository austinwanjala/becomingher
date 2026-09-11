import { NextResponse } from 'next/server';
import { coachingEngine } from '@/lib/coaching/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [], userContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const response = await coachingEngine.generateResponse(message, history, userContext);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Sanctuary coaching companion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate coaching response' },
      { status: 500 }
    );
  }
}

