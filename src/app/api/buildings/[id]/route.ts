import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const db = getDB();
    const building = db.buildings.find(b => b.id === params.id);
    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Fetch rooms and attach beds
    const rooms = db.rooms.filter(r => r.buildingId === building.id);
    const roomsWithBeds = rooms.map(r => {
      const beds = db.beds.filter(b => b.roomId === r.id);
      return {
        ...r,
        beds,
      };
    });

    return NextResponse.json({
      success: true,
      building: {
        ...building,
        rooms: roomsWithBeds,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDB();
    const index = db.buildings.findIndex(b => b.id === params.id && b.ownerId === user.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Building not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const current = db.buildings[index];

    // Merge changes
    const updated = {
      ...current,
      ...body,
      id: current.id, // protect keys
      ownerId: current.ownerId,
    };

    db.buildings[index] = updated;

    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'BUILDING_UPDATED',
      details: `Updated building details for: ${updated.name}`,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, building: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDB();
    const index = db.buildings.findIndex(b => b.id === params.id && b.ownerId === user.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Building not found or unauthorized' }, { status: 404 });
    }

    const bldName = db.buildings[index].name;

    // Remove building
    db.buildings.splice(index, 1);

    // Remove rooms and beds
    const bldRooms = db.rooms.filter(r => r.buildingId === params.id);
    const roomIds = bldRooms.map(r => r.id);
    db.rooms = db.rooms.filter(r => r.buildingId !== params.id);
    db.beds = db.beds.filter(b => !roomIds.includes(b.roomId));

    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'BUILDING_DELETED',
      details: `Deleted building: ${bldName}`,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, message: 'Building and associated layouts deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
