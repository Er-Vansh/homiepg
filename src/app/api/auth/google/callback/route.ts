import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db/db';
import { setSessionCookie } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const appUrl = req.headers.get('origin') || new URL(req.url).origin;

  // Handle Google callback errors
  if (error) {
    console.error('Google OAuth callback returned error:', error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Authorization code not found', appUrl));
  }

  if (!clientId || !clientSecret) {
    console.error('Google OAuth secrets not configured in environment variables.');
    return NextResponse.redirect(new URL('/login?error=Google OAuth is not fully configured on the server', appUrl));
  }

  try {
    // 1. Exchange the auth code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code');
    }

    const { access_token } = tokenData;

    // 2. Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      throw new Error('Failed to retrieve user profile from Google');
    }

    const { email, name } = userData;
    if (!email) {
      throw new Error('Unable to retrieve email address from Google account');
    }

    const db = getDB();
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    const now = new Date().toISOString();

    if (!user) {
      // 3. User does not exist - Register them as a tenant (USER)
      const userId = `usr_${Math.random().toString(36).substr(2, 9)}`;
      user = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash: 'OAUTH_GOOGLE', // flag to identify Google login users
        name: name || 'Google Tenant',
        role: 'USER',
        createdAt: now,
      };

      db.users.push(user);

      // Log registration
      db.auditLogs.push({
        id: `aud_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: 'TENANT_REGISTERED_OAUTH',
        details: `Tenant registered via Google OAuth. Name: ${user.name}`,
        timestamp: now,
      });

      saveDB(db);
    } else {
      // 4. User exists - Validate role permissions for this portal
      if (user.role === 'OWNER') {
        // Redirect PG Owners attempting to log in via tenant portal to their dedicated gateway
        return NextResponse.redirect(
          new URL('/pgowner?error=Please use the PG Owner portal to sign in with your owner account.', appUrl)
        );
      }

      if (user.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(
          new URL('/admin?error=Please use the Admin security portal to sign in.', appUrl)
        );
      }

      // Log successful login
      db.auditLogs.push({
        id: `aud_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        action: 'TENANT_LOGGED_IN_OAUTH',
        details: `Tenant logged in via Google OAuth.`,
        timestamp: now,
      });

      saveDB(db);
    }

    // 5. Establish session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Redirect to dashboard router
    return NextResponse.redirect(new URL('/dashboard', appUrl));

  } catch (e: any) {
    console.error('Google OAuth callback handler error:', e);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(e.message || 'Authentication failed')}`, appUrl));
  }
}
