import { NextResponse } from 'next/server';
import { getDB, saveDB, Booking } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDB();
    
    // Admin sees all bookings, Owner sees their buildings' bookings, User sees their own bookings
    let userBookings: Booking[] = [];
    if (user.role === 'SUPER_ADMIN') {
      userBookings = db.bookings;
    } else if (user.role === 'OWNER') {
      const ownerBlds = db.buildings.filter(b => b.ownerId === user.id).map(b => b.id);
      userBookings = db.bookings.filter(b => ownerBlds.includes(b.buildingId));
    } else {
      userBookings = db.bookings.filter(b => b.userId === user.id);
    }

    // Resolve building/room details for display
    const enriched = userBookings.map(b => {
      const building = db.buildings.find(bl => bl.id === b.buildingId);
      const room = db.rooms.find(r => r.id === b.roomId);
      const bed = db.beds.find(bd => bd.id === b.bedId);
      return {
        ...b,
        buildingName: building?.name || 'Unknown PG',
        buildingAddress: building?.address || 'Unknown Address',
        roomNumber: room?.roomNumber || 'Unknown Room',
        bedNumber: bed?.bedNumber || 'Unknown Bed',
      };
    });

    return NextResponse.json({ success: true, bookings: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to book.' }, { status: 401 });
    }

    const body = await req.json();
    const { buildingId, roomId, bedId, moveInDate, moveOutDate, amount, paymentMethod, transactionId, paymentProofUrl } = body;

    if (!buildingId || !roomId || !bedId || !moveInDate || !amount) {
      return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
    }

    const db = getDB();
    
    // Check if bed is still available
    const bedIndex = db.beds.findIndex(b => b.id === bedId && b.roomId === roomId);
    if (bedIndex === -1) {
      return NextResponse.json({ error: 'Bed details not found' }, { status: 404 });
    }
    
    const bed = db.beds[bedIndex];
    if (bed.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'This bed is already reserved or occupied.' }, { status: 400 });
    }

    // Create booking
    const bookingId = `bkg_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newBooking: Booking = {
      id: bookingId,
      userId: user.id,
      buildingId,
      roomId,
      bedId,
      amount: parseFloat(amount),
      status: 'PENDING',
      moveInDate,
      moveOutDate: moveOutDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months default
      paymentProofUrl: paymentProofUrl || '',
      paymentMethod: paymentMethod || 'UPI',
      transactionId: transactionId || '',
      createdAt: now,
    };

    // Update bed status to RESERVED
    db.beds[bedIndex].status = 'RESERVED';
    // Set 30 minute reservation expiry window (simulated)
    db.beds[bedIndex].reservationExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.bookings.push(newBooking);

    // Audit log
    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'BED_RESERVED',
      details: `Reserved bed: ${bed.bedNumber} under Booking: ${bookingId}`,
      timestamp: now,
    });

    saveDB(db);

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
