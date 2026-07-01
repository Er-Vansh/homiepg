import { NextResponse } from 'next/server';
import { getDB, saveDB, User, OwnerProfile } from '@/lib/db/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, name, role, phone, companyName } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const userId = `usr_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: password, // For simplicity in local demo
      name,
      role: role as 'USER' | 'OWNER' | 'SUPER_ADMIN',
      phone,
      createdAt: now,
    };

    db.users.push(newUser);

    // If role is OWNER, create a profile
    if (role === 'OWNER') {
      const ownerProfile: OwnerProfile = {
        userId,
        isApproved: false,
        verificationStatus: 'PENDING',
        companyName: companyName || `${name}'s Living Space`,
        documentUrls: [],
        subscriptionPlan: 'BASIC',
      };
      db.ownerProfiles.push(ownerProfile);
    }

    // Log action
    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action: 'USER_REGISTERED',
      details: `User registered with role: ${role}`,
      timestamp: now,
    });

    saveDB(db);

    // Set cookie
    await setSessionCookie({
      userId,
      email: newUser.email,
      role: newUser.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
