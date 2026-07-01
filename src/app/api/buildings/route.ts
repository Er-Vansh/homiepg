import { NextResponse } from 'next/server';
import { getDB, saveDB, Building, Room, Bed } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const minRent = parseFloat(searchParams.get('minRent') || '0');
    const maxRent = parseFloat(searchParams.get('maxRent') || '999999');
    const gender = searchParams.get('gender'); // MALE, FEMALE, UNISEX
    const sharing = parseInt(searchParams.get('sharing') || '0');
    const ac = searchParams.get('ac') === 'true';
    const food = searchParams.get('food') === 'true';
    const wifi = searchParams.get('wifi') === 'true';
    const washroom = searchParams.get('washroom') === 'true';
    const parking = searchParams.get('parking') === 'true';

    const db = getDB();
    let results = db.buildings;

    // Apply location filter
    if (city) {
      results = results.filter(b => b.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (area) {
      results = results.filter(b => b.area.toLowerCase().includes(area.toLowerCase()));
    }

    // Apply budget filter
    results = results.filter(b => b.baseRent >= minRent && b.baseRent <= maxRent);

    // Apply amenities filter
    if (wifi) {
      results = results.filter(b => b.amenities.includes('High-speed Wi-Fi'));
    }
    if (food) {
      results = results.filter(b => b.amenities.includes('Food Included'));
    }
    if (parking) {
      results = results.filter(b => b.amenities.includes('Parking'));
    }

    // Check rooms mapping for specific filters: Sharing, AC, Washroom
    if (sharing > 0 || ac || washroom) {
      results = results.filter(b => {
        const roomsInBld = db.rooms.filter(r => r.buildingId === b.id);
        return roomsInBld.some(r => {
          let match = true;
          if (sharing > 0 && r.sharingType !== sharing) match = false;
          if (ac && !r.hasAC) match = false;
          if (washroom && !r.hasWashroom) match = false;
          return match;
        });
      });
    }

    // Filter rules for gender constraints
    if (gender) {
      results = results.filter(b => {
        const rulesStr = b.rules.join(' ').toLowerCase();
        const descStr = b.description.toLowerCase();
        if (gender === 'FEMALE') {
          return descStr.includes('girls') || descStr.includes('women') || rulesStr.includes('girls') || rulesStr.includes('female');
        } else if (gender === 'MALE') {
          return descStr.includes('boys') || descStr.includes('men') || rulesStr.includes('boys') || rulesStr.includes('male');
        }
        return true;
      });
    }

    return NextResponse.json({ success: true, count: results.length, buildings: results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized. PG Owner only.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, address, city, area, description, amenities, rules,
      baseRent, baseDeposit, foodCharges, electricityCharges, waterCharges,
      wifiCharges, laundryCharges, parkingCharges, housekeepingCharges,
      nearbyColleges, nearbyCompanies, nearbyMetro, images, videoUrl, virtualTourUrl
    } = body;

    if (!name || !address || !city || !area || !baseRent) {
      return NextResponse.json({ error: 'Missing required property details' }, { status: 400 });
    }

    const db = getDB();
    const buildingId = `bld_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newBuilding: Building = {
      id: buildingId,
      ownerId: user.id,
      name,
      address,
      city,
      area,
      description: description || 'Premium managed coliving home by HomiePG.',
      amenities: amenities || ['High-speed Wi-Fi', 'CCTV Security', 'Power Backup', 'Housekeeping'],
      rules: rules || ['Entry gate closes at 11 PM'],
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
      videoUrl: videoUrl || '',
      virtualTourUrl: virtualTourUrl || '',
      baseRent: parseFloat(baseRent),
      baseDeposit: parseFloat(baseDeposit || baseRent * 2),
      foodCharges: parseFloat(foodCharges || 0),
      electricityCharges: parseFloat(electricityCharges || 0),
      waterCharges: parseFloat(waterCharges || 0),
      wifiCharges: parseFloat(wifiCharges || 0),
      laundryCharges: parseFloat(laundryCharges || 0),
      parkingCharges: parseFloat(parkingCharges || 0),
      housekeepingCharges: parseFloat(housekeepingCharges || 0),
      nearbyColleges: nearbyColleges || [],
      nearbyCompanies: nearbyCompanies || [],
      nearbyMetro: nearbyMetro || [],
      createdAt: now,
    };

    db.buildings.push(newBuilding);

    // AUTO-GENERATE standard room layouts: 3 rooms
    // Room 101: Single sharing, AC, attached washroom
    const r1Id = `rm_${Math.random().toString(36).substr(2, 9)}`;
    const r1: Room = {
      id: r1Id,
      buildingId,
      floorNumber: 1,
      roomNumber: '101',
      sharingType: 1,
      hasAC: true,
      hasWashroom: true,
      price: newBuilding.baseRent * 1.4,
    };
    db.rooms.push(r1);
    db.beds.push({
      id: `bed_${Math.random().toString(36).substr(2, 9)}`,
      roomId: r1Id,
      bedNumber: '101-A',
      status: 'AVAILABLE',
    });

    // Room 102: Double sharing, Non-AC, attached washroom
    const r2Id = `rm_${Math.random().toString(36).substr(2, 9)}`;
    const r2: Room = {
      id: r2Id,
      buildingId,
      floorNumber: 1,
      roomNumber: '102',
      sharingType: 2,
      hasAC: false,
      hasWashroom: true,
      price: newBuilding.baseRent,
    };
    db.rooms.push(r2);
    db.beds.push({
      id: `bed_${Math.random().toString(36).substr(2, 9)}`,
      roomId: r2Id,
      bedNumber: '102-A',
      status: 'AVAILABLE',
    }, {
      id: `bed_${Math.random().toString(36).substr(2, 9)}`,
      roomId: r2Id,
      bedNumber: '102-B',
      status: 'AVAILABLE',
    });

    // Room 201: Triple sharing, Non-AC, common washroom
    const r3Id = `rm_${Math.random().toString(36).substr(2, 9)}`;
    const r3: Room = {
      id: r3Id,
      buildingId,
      floorNumber: 2,
      roomNumber: '201',
      sharingType: 3,
      hasAC: false,
      hasWashroom: false,
      price: newBuilding.baseRent * 0.8,
    };
    db.rooms.push(r3);
    db.beds.push({
      id: `bed_${Math.random().toString(36).substr(2, 9)}`,
      roomId: r3Id,
      bedNumber: '201-A',
      status: 'AVAILABLE',
    }, {
      id: `bed_${Math.random().toString(36).substr(2, 9)}`,
      roomId: r3Id,
      bedNumber: '201-B',
      status: 'AVAILABLE',
    }, {
      id: `bed_${Math.random().toString(36).substr(2, 9)}`,
      roomId: r3Id,
      bedNumber: '201-C',
      status: 'AVAILABLE',
    });

    // Audit Log
    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'BUILDING_CREATED',
      details: `Created building: ${newBuilding.name} and seeded standard rooms layout.`,
      timestamp: now,
    });

    saveDB(db);

    return NextResponse.json({ success: true, building: newBuilding });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
