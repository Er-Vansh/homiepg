import { NextResponse } from 'next/server';
import { generateAIInsights } from '@/lib/ai/ai-engine';
import { getCurrentUser, getAdminCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = await getAdminCurrentUser();
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope'); // 'global' or 'owner'
    
    // If scope is 'owner', filter for the logged-in owner
    const ownerId = scope === 'owner' && user.role === 'OWNER' ? user.id : undefined;

    const insights = generateAIInsights(ownerId);
    return NextResponse.json({ success: true, insights });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
