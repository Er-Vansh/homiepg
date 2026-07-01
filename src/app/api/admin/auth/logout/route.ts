import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/auth';

export async function POST() {
  try {
    await logoutAdmin();
    return NextResponse.json({ success: true, message: 'Admin session terminated' });
  } catch (e) {
    console.error('Error during admin auth logout', e);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
