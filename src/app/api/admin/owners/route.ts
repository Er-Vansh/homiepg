import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db/db';
import { getAdminCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAdminCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const db = getDB();
    const owners = db.users.filter(u => u.role === 'OWNER');
    const enriched = owners.map(o => {
      const profile = db.ownerProfiles.find(p => p.userId === o.id);
      const buildings = db.buildings.filter(b => b.ownerId === o.id);
      return {
        ...o,
        companyName: profile?.companyName || 'Not Set',
        isApproved: profile?.isApproved || false,
        verificationStatus: profile?.verificationStatus || 'PENDING',
        documentUrls: profile?.documentUrls || [],
        subscriptionPlan: profile?.subscriptionPlan || 'BASIC',
        buildingsCount: buildings.length,
      };
    });

    return NextResponse.json({ success: true, owners: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAdminCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const body = await req.json();
    const { ownerId, verificationStatus } = body; // status: VERIFIED, SUSPENDED, PENDING

    if (!ownerId || !verificationStatus) {
      return NextResponse.json({ error: 'Missing ownerId or verificationStatus' }, { status: 400 });
    }

    const db = getDB();
    const pIndex = db.ownerProfiles.findIndex(p => p.userId === ownerId);
    if (pIndex === -1) {
      return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 });
    }

    db.ownerProfiles[pIndex].verificationStatus = verificationStatus;
    db.ownerProfiles[pIndex].isApproved = verificationStatus === 'VERIFIED';

    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userEmail: user.email,
      userName: user.name,
      action: `OWNER_STATUS_CHANGED`,
      details: `Changed verification status of owner ${ownerId} to: ${verificationStatus}`,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, profile: db.ownerProfiles[pIndex] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
