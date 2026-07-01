import { NextResponse } from 'next/server';
import { askAIChatbot } from '@/lib/ai/ai-engine';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const reply = askAIChatbot(message);
    return NextResponse.json({ success: true, reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
