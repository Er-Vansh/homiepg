import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDB } from '@/lib/db/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const db = getDB();
  const profile = user.role === 'OWNER' 
    ? db.ownerProfiles.find(p => p.userId === user.id)
    : null;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
    ownerProfile: profile || undefined,
  });
}
