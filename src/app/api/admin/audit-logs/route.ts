import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/db';
import { getAdminCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAdminCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const db = getDB();
    const sorted = [...db.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Enrich with email names
    const enriched = sorted.map(log => {
      const actor = (log as any).userId ? db.users.find(u => u.id === (log as any).userId) : null;
      return {
        ...log,
        userEmail: log.userEmail || actor?.email || 'System Action',
        userName: log.userName || actor?.name || 'Automated Engine',
      };
    });

    return NextResponse.json({ success: true, logs: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
