import { NextResponse } from 'next/server';
import { getAdminCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const adminUser = await getAdminCurrentUser();
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized admin session' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        phone: adminUser.phone
      }
    });

  } catch (e) {
    console.error('Error during admin auth me check', e);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
