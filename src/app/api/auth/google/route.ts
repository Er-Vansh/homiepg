import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Client ID is not configured. Please define GOOGLE_CLIENT_ID in .env.local' },
        { status: 500 }
      );
    }

    const state = 'tenant';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=openid%20email%20profile` +
      `&state=${state}` +
      `&prompt=select_account`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (e: any) {
    console.error('Failed to initialize Google OAuth:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
