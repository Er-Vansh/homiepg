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

    const totalOwners = db.users.filter(u => u.role === 'OWNER').length;
    const totalBuildings = db.buildings.length;
    const totalRooms = db.rooms.length;
    const totalBeds = db.beds.length;
    const occupiedBeds = db.beds.filter(b => b.status === 'OCCUPIED').length;
    const vacantBeds = db.beds.filter(b => b.status === 'AVAILABLE').length;

    // Monthly revenue: Rent from active residents
    const monthlyRevenue = db.residents.reduce((sum, r) => sum + r.rentAmount, 0);

    const pendingBookings = db.bookings.filter(b => b.status === 'PENDING').length;
    const completedBookings = db.bookings.filter(b => b.status === 'APPROVED').length;
    const cancelledBookings = db.bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length;

    const totalUsers = db.users.filter(u => u.role === 'USER').length;
    const activeUsers = db.residents.filter(r => r.status === 'ACTIVE').length;

    // Calculate billing distributions
    const billingPlanCounts = db.ownerProfiles.reduce((acc: { [key: string]: number }, profile) => {
      acc[profile.subscriptionPlan] = (acc[profile.subscriptionPlan] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      metrics: {
        totalOwners,
        totalBuildings,
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        monthlyRevenue,
        totalUsers,
        activeUsers,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        billingPlanCounts,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
