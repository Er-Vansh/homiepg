import { NextResponse } from 'next/server';
import { getDB, saveDB, Room, Bed } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDB();
    const building = db.buildings.find(b => b.id === params.id && b.ownerId === user.id);
    if (!building) {
      return NextResponse.json({ error: 'Building not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const { rooms } = body;

    if (!Array.isArray(rooms)) {
      return NextResponse.json({ error: 'Invalid payload: rooms array required' }, { status: 400 });
    }

    // Load active residents of this building
    const residents = db.residents.filter(r => r.buildingId === params.id);
    const activeBedIds = new Set(residents.map(r => r.bedId));

    // Also get active bookings for this building
    const bookings = db.bookings.filter(b => b.buildingId === params.id && b.status === 'PENDING');
    const reservedBedIds = new Set(bookings.map(b => b.bedId));

    // Validate that we don't delete any bed that is active or reserved
    const existingRooms = db.rooms.filter(r => r.buildingId === params.id);
    const existingRoomIds = existingRooms.map(r => r.id);
    const existingBeds = db.beds.filter(b => existingRoomIds.includes(b.roomId));

    // Map input rooms and beds
    const inputBedsSet = new Set<string>();
    rooms.forEach((r: any) => {
      if (Array.isArray(r.beds)) {
        r.beds.forEach((b: any) => {
          if (b.id) inputBedsSet.add(b.id);
        });
      }
    });

    // Check if any active/reserved bed is deleted from the input
    for (const eb of existingBeds) {
      if (!inputBedsSet.has(eb.id)) {
        if (activeBedIds.has(eb.id)) {
          return NextResponse.json({ 
            error: `Cannot delete Bed ${eb.bedNumber} because it is currently OCCUPIED by a resident.` 
          }, { status: 400 });
        }
        if (reservedBedIds.has(eb.id)) {
          return NextResponse.json({ 
            error: `Cannot delete Bed ${eb.bedNumber} because it is currently RESERVED (pending booking approval).` 
          }, { status: 400 });
        }
      }
    }

    // Remove old rooms and beds for this building
    db.rooms = db.rooms.filter(r => r.buildingId !== params.id);
    db.beds = db.beds.filter(b => !existingRoomIds.includes(b.roomId));

    // Rebuild rooms and beds
    const now = new Date().toISOString();
    
    rooms.forEach((r: any) => {
      const roomId = r.id || `rm_${Math.random().toString(36).substr(2, 9)}`;
      const newRoom: Room = {
        id: roomId,
        buildingId: params.id,
        floorNumber: parseInt(r.floorNumber) || 1,
        roomNumber: r.roomNumber.toString(),
        sharingType: parseInt(r.sharingType) || 1,
        hasAC: !!r.hasAC,
        hasWashroom: !!r.hasWashroom,
        price: parseFloat(r.price) || building.baseRent,
      };
      db.rooms.push(newRoom);

      if (Array.isArray(r.beds)) {
        r.beds.forEach((b: any) => {
          const matchExisting = existingBeds.find(eb => eb.id === b.id);
          const bedId = b.id || `bed_${Math.random().toString(36).substr(2, 9)}`;
          const newBed: Bed = {
            id: bedId,
            roomId: roomId,
            bedNumber: b.bedNumber || `${r.roomNumber}-${b.id ? b.id.substr(4, 2) : 'A'}`,
            status: matchExisting ? matchExisting.status : 'AVAILABLE',
            currentResidentId: matchExisting ? matchExisting.currentResidentId : undefined,
            expectedVacantDate: matchExisting ? matchExisting.expectedVacantDate : undefined,
          };
          db.beds.push(newBed);
        });
      }
    });

    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'BUILDING_LAYOUT_CONFIGURED',
      details: `Reconfigured rooms and floors layout for building: ${building.name}`,
      timestamp: now,
    });

    saveDB(db);

    // Fetch refreshed structure to return
    const roomsWithBeds = db.rooms
      .filter(r => r.buildingId === params.id)
      .map(r => {
        const beds = db.beds.filter(b => b.roomId === r.id);
        return { ...r, beds };
      });

    return NextResponse.json({ success: true, rooms: roomsWithBeds });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
