import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDB, User } from './db/db';

const JWT_SECRET = process.env.JWT_SECRET || 'homiepg_super_secret_jwt_sign_key_9988';
const JWT_ADMIN_REFRESH_SECRET = process.env.JWT_ADMIN_REFRESH_SECRET || 'homiepg_super_secret_admin_refresh_key_8877';

const COOKIE_NAME = 'homiepg_session';
const ADMIN_COOKIE_NAME = 'homiepg_admin_session';
const ADMIN_REFRESH_COOKIE_NAME = 'homiepg_admin_refresh';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'OWNER' | 'SUPER_ADMIN';
}

// User session logic
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (e) {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (e) {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const db = getDB();
  const user = db.users.find(u => u.id === session.userId);
  if (!user) return null;
  
  return user;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });
}

export async function setSessionCookie(payload: TokenPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// ==========================================
// SUPER ADMIN SEPARATE AUTHENTICATION LOGIC
// ==========================================

export function signAdminTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }); // 15 mins
  const refreshToken = jwt.sign(payload, JWT_ADMIN_REFRESH_SECRET, { expiresIn: '1d' }); // 1 day
  return { accessToken, refreshToken };
}

export function verifyAdminToken(token: string, isRefresh = false): TokenPayload | null {
  try {
    const secret = isRefresh ? JWT_ADMIN_REFRESH_SECRET : JWT_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  } catch (e) {
    return null;
  }
}

export async function getAdminSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    
    if (accessToken) {
      const verified = verifyAdminToken(accessToken, false);
      if (verified && verified.role === 'SUPER_ADMIN') {
        return verified;
      }
    }

    // Attempt token rotation / refresh token check if access token expired
    const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) {
      const verifiedRefresh = verifyAdminToken(refreshToken, true);
      if (verifiedRefresh && verifiedRefresh.role === 'SUPER_ADMIN') {
        // Confirm user exists and is still active admin in DB
        const db = getDB();
        const user = db.users.find(u => u.id === verifiedRefresh.userId && u.role === 'SUPER_ADMIN');
        if (user) {
          // Re-issue access token
          const { accessToken: newAccess } = signAdminTokens(verifiedRefresh);
          
          // Re-save session cookie
          cookieStore.set(ADMIN_COOKIE_NAME, newAccess, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 mins
            path: '/',
          });
          
          return verifiedRefresh;
        }
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

export async function getAdminCurrentUser(): Promise<User | null> {
  const session = await getAdminSession();
  if (!session) return null;

  const db = getDB();
  const user = db.users.find(u => u.id === session.userId && u.role === 'SUPER_ADMIN');
  return user || null;
}

export async function setAdminCookies(payload: TokenPayload): Promise<void> {
  const { accessToken, refreshToken } = signAdminTokens(payload);
  const cookieStore = await cookies();

  // Set HTTP-Only access token cookie
  cookieStore.set(ADMIN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  // Set HTTP-Only refresh token cookie
  cookieStore.set(ADMIN_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 1 day
    path: '/',
  });
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });

  cookieStore.set(ADMIN_REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });
}
