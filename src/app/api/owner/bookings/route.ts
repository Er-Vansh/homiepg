import { NextResponse } from 'next/server';
import { getDB, saveDB, Resident, Payment } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDB();
    const ownerBlds = db.buildings.filter(b => b.ownerId === user.id).map(b => b.id);
    const ownerBookings = db.bookings.filter(b => ownerBlds.includes(b.buildingId));

    // Enrich with user name, email, and building details
    const enriched = ownerBookings.map(b => {
      const tenant = db.users.find(u => u.id === b.userId);
      const bld = db.buildings.find(bl => bl.id === b.buildingId);
      const room = db.rooms.find(r => r.id === b.roomId);
      const bed = db.beds.find(bd => bd.id === b.bedId);

      return {
        ...b,
        tenantName: tenant?.name || 'Unknown User',
        tenantEmail: tenant?.email || '',
        tenantPhone: tenant?.phone || '',
        buildingName: bld?.name || 'Unknown PG',
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
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, action } = body; // action: 'APPROVE' or 'REJECT'

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing bookingId or action' }, { status: 400 });
    }

    const db = getDB();
    const bkgIndex = db.bookings.findIndex(b => b.id === bookingId);
    if (bkgIndex === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = db.bookings[bkgIndex];
    // Check if owner actually owns this building
    const building = db.buildings.find(b => b.id === booking.buildingId && b.ownerId === user.id);
    if (!building) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const bedIndex = db.beds.findIndex(b => b.id === booking.bedId);

    if (action === 'APPROVE') {
      db.bookings[bkgIndex].status = 'APPROVED';

      if (bedIndex !== -1) {
        db.beds[bedIndex].status = 'OCCUPIED';
        db.beds[bedIndex].currentResidentId = `res_${Math.random().toString(36).substr(2, 9)}`;
        db.beds[bedIndex].reservationExpiry = undefined; // Clear stale expiry on approval
        db.beds[bedIndex].expectedVacantDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 6 months default
      }

      // Create new Resident profile
      const tenant = db.users.find(u => u.id === booking.userId);
      const residentId = db.beds[bedIndex].currentResidentId || `res_${Math.random().toString(36).substr(2, 9)}`;
      const newResident: Resident = {
        id: residentId,
        ownerId: user.id,
        buildingId: booking.buildingId,
        roomId: booking.roomId,
        bedId: booking.bedId,
        name: tenant?.name || 'Resident Name',
        phone: tenant?.phone || '+919999999999',
        email: tenant?.email || 'tenant@homiepg.com',
        emergencyContact: 'Guardian - +919988776655',
        address: 'Resident Address Provided at Booking',
        occupation: 'Student / Professional',
        joiningDate: booking.moveInDate,
        leavingDate: booking.moveOutDate,
        rentAmount: booking.amount,
        securityDeposit: building.baseDeposit,
        outstandingAmount: 0,
        status: 'ACTIVE',
        kycDocAadhaar: '/kyc/aadhaar_pending.pdf',
        policeVerified: false,
      };
      db.residents.push(newResident);

      // Create Initial Rent & Deposit Payments
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const firstPayment: Payment = {
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        residentId: residentId,
        ownerId: user.id,
        buildingId: booking.buildingId,
        bookingId: booking.id,
        amount: booking.amount,
        paymentType: 'RENT',
        status: 'PAID', // mark paid as they uploaded proof
        paymentDate: now,
        billingPeriod: `First Month (${booking.moveInDate})`,
        invoiceNumber,
        receiptNumber: `REC-${invoiceNumber.split('-')[1]}-${invoiceNumber.split('-')[2]}`,
        proofUrl: booking.paymentProofUrl,
        notes: 'Pre-paid at the time of online bed reservation.',
      };
      db.payments.push(firstPayment);

      db.auditLogs.push({
        id: `log_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        action: 'BOOKING_APPROVED',
        details: `Approved Booking: ${bookingId}. Created Resident: ${residentId}`,
        timestamp: now,
      });

    } else if (action === 'REJECT') {
      db.bookings[bkgIndex].status = 'REJECTED';

      if (bedIndex !== -1) {
        db.beds[bedIndex].status = 'AVAILABLE';
        db.beds[bedIndex].currentResidentId = undefined;
        db.beds[bedIndex].reservationExpiry = undefined;
      }

      db.auditLogs.push({
        id: `log_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        action: 'BOOKING_REJECTED',
        details: `Rejected Booking: ${bookingId}. Released Bed back to market.`,
        timestamp: now,
      });
    }

    saveDB(db);
    return NextResponse.json({ success: true, booking: db.bookings[bkgIndex] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
