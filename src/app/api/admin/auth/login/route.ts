import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/db';
import { setAdminCookies } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Token identifier and passphrase required' }, { status: 400 });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== password || user.role !== 'SUPER_ADMIN') {
      // Log failed admin login attempt to audit logs
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const now = new Date().toISOString();
      
      db.auditLogs.push({
        id: `aud_${Math.random().toString(36).substr(2, 9)}`,
        userEmail: email,
        userName: 'UNAUTHORIZED_ATTEMPT',
        action: 'ADMIN_LOGIN_FAILED',
        details: `IP: ${ip} | User-Agent: ${userAgent} | Message: Invalid credentials or role rejection.`,
        ipAddress: ip,
        timestamp: now
      });
      
      return NextResponse.json({ error: 'Invalid admin credentials or role unauthorized' }, { status: 401 });
    }

    // Success: set admin sessions
    await setAdminCookies({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Log successful admin login to audit logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const now = new Date().toISOString();
    
    db.auditLogs.push({
      id: `aud_${Math.random().toString(36).substr(2, 9)}`,
      userEmail: user.email,
      userName: user.name,
      action: 'ADMIN_LOGIN_SUCCESS',
      details: `IP: ${ip} | User-Agent: ${userAgent} | Message: Session established via secure /admin portal.`,
      ipAddress: ip,
      timestamp: now
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (e) {
    console.error('Error during admin auth login', e);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
