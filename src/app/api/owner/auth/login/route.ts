import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Validate existence, password, and OWNER role restriction
    if (!user || user.passwordHash !== password || user.role !== 'OWNER') {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const now = new Date().toISOString();
      
      db.auditLogs.push({
        id: `aud_${Math.random().toString(36).substr(2, 9)}`,
        userEmail: email,
        userName: 'UNAUTHORIZED_OWNER_ATTEMPT',
        action: 'OWNER_LOGIN_FAILED',
        details: `IP: ${ip} | User-Agent: ${userAgent} | Message: Invalid credentials or role mismatch.`,
        ipAddress: ip,
        timestamp: now
      });
      saveDB(db);

      return NextResponse.json({ error: 'Invalid owner credentials or account unauthorized' }, { status: 401 });
    }

    // Check if PG Owner profile is suspended
    const profile = db.ownerProfiles.find(p => p.userId === user.id);
    if (profile && profile.verificationStatus === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your owner account has been suspended. Please contact support.' }, { status: 403 });
    }

    // Success: set session cookies
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Log successful login to audit logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const now = new Date().toISOString();
    
    db.auditLogs.push({
      id: `aud_${Math.random().toString(36).substr(2, 9)}`,
      userEmail: user.email,
      userName: user.name,
      action: 'OWNER_LOGIN_SUCCESS',
      details: `IP: ${ip} | User-Agent: ${userAgent} | Message: Owner session established via secure /pgowner portal.`,
      ipAddress: ip,
      timestamp: now
    });
    saveDB(db);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (e: any) {
    console.error('Error during owner auth login', e);
    return NextResponse.json({ error: e.message || 'Internal system error' }, { status: 500 });
  }
}
