import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if owner is suspended
    if (user.role === 'OWNER') {
      const profile = db.ownerProfiles.find(p => p.userId === user.id);
      if (profile && profile.verificationStatus === 'SUSPENDED') {
        return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
      }
    }

    // Log action
    const now = new Date().toISOString();
    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'USER_LOGGED_IN',
      details: `User logged in. Role: ${user.role}`,
      timestamp: now,
    });
    saveDB(db);

    // Set cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
