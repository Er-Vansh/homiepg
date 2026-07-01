import { NextResponse } from 'next/server';
import { getDB, saveDB, Resident } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDB();
    let ownerResidents: Resident[] = [];

    if (user.role === 'SUPER_ADMIN') {
      ownerResidents = db.residents;
    } else if (user.role === 'OWNER') {
      ownerResidents = db.residents.filter(r => r.ownerId === user.id);
    } else {
      ownerResidents = db.residents.filter(r => r.email === user.email);
    }

    // Resolve building/room details
    const enriched = ownerResidents.map(r => {
      const bld = db.buildings.find(b => b.id === r.buildingId);
      const room = db.rooms.find(rm => rm.id === r.roomId);
      const bed = db.beds.find(bd => bd.id === r.bedId);

      return {
        ...r,
        buildingName: bld?.name || 'Unknown PG',
        roomNumber: room?.roomNumber || 'Unknown Room',
        bedNumber: bed?.bedNumber || 'Unknown Bed',
      };
    });

    return NextResponse.json({ success: true, residents: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      buildingId, roomId, bedId, name, phone, email, emergencyContact,
      address, occupation, college, company, rentAmount, securityDeposit,
      joiningDate, leavingDate
    } = body;

    if (!buildingId || !roomId || !bedId || !name || !phone || !email || !rentAmount) {
      return NextResponse.json({ error: 'Missing required resident details' }, { status: 400 });
    }

    const db = getDB();

    // Verify bed is available
    const bedIndex = db.beds.findIndex(b => b.id === bedId);
    if (bedIndex === -1) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }
    const bed = db.beds[bedIndex];
    if (bed.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'This bed is currently occupied or reserved.' }, { status: 400 });
    }

    const residentId = `res_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newResident: Resident = {
      id: residentId,
      ownerId: user.id,
      buildingId,
      roomId,
      bedId,
      name,
      phone,
      email: email.toLowerCase(),
      emergencyContact,
      address,
      occupation,
      college: college || '',
      company: company || '',
      joiningDate,
      leavingDate: leavingDate || undefined,
      rentAmount: parseFloat(rentAmount),
      securityDeposit: parseFloat(securityDeposit || '0'),
      outstandingAmount: 0,
      status: 'ACTIVE',
      kycDocAadhaar: '',
      policeVerified: false,
    };

    db.residents.push(newResident);

    // Update bed availability
    db.beds[bedIndex].status = 'OCCUPIED';
    db.beds[bedIndex].currentResidentId = residentId;
    db.beds[bedIndex].expectedVacantDate = leavingDate || undefined;

    // Log action
    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'RESIDENT_MANUALLY_ADDED',
      details: `Added resident ${name} to building: ${buildingId}, bed: ${bed.bedNumber}`,
      timestamp: now,
    });

    saveDB(db);

    return NextResponse.json({ success: true, resident: newResident });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
