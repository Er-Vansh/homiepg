import { NextResponse } from 'next/server';
import { getDB, saveDB, Ticket } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDB();
    let ticketsList: Ticket[] = [];

    if (user.role === 'SUPER_ADMIN') {
      ticketsList = db.tickets;
    } else if (user.role === 'OWNER') {
      // Find building IDs owned by owner
      const ownerBlds = db.buildings.filter(b => b.ownerId === user.id).map(b => b.id);
      // Owner sees tickets they filed OR tickets filed against their buildings
      ticketsList = db.tickets.filter(t => t.userId === user.id || (t.buildingId && ownerBlds.includes(t.buildingId)));
    } else {
      ticketsList = db.tickets.filter(t => t.userId === user.id);
    }

    // Enrich tickets with user details
    const enriched = ticketsList.map(t => {
      const creator = db.users.find(u => u.id === t.userId);
      const bld = t.buildingId ? db.buildings.find(b => b.id === t.buildingId) : null;
      return {
        ...t,
        creatorName: creator?.name || 'Anonymous Creator',
        creatorRole: creator?.role || 'USER',
        buildingName: bld?.name || 'General Query',
      };
    });

    return NextResponse.json({ success: true, tickets: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { buildingId, subject, description, category, priority } = body;

    if (!subject || !description || !category) {
      return NextResponse.json({ error: 'Missing required ticket fields' }, { status: 400 });
    }

    const db = getDB();
    const ticketId = `tkt_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newTicket: Ticket = {
      id: ticketId,
      userId: user.id,
      buildingId: buildingId || undefined,
      subject,
      description,
      category,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      messages: [
        {
          sender: user.name,
          message: description,
          timestamp: now,
        }
      ],
      createdAt: now,
    };

    db.tickets.push(newTicket);
    saveDB(db);

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, message, status } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
    }

    const db = getDB();
    const tIndex = db.tickets.findIndex(t => t.id === ticketId);
    if (tIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = db.tickets[tIndex];

    // Auth check: Admin can access, Creator can access, and building Owner can access
    const isCreator = ticket.userId === user.id;
    const isBuildingOwner = ticket.buildingId 
      ? db.buildings.some(b => b.id === ticket.buildingId && b.ownerId === user.id)
      : false;
    const isAdmin = user.role === 'SUPER_ADMIN';

    if (!isCreator && !isBuildingOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to view or reply' }, { status: 403 });
    }

    const now = new Date().toISOString();
    
    if (message) {
      db.tickets[tIndex].messages.push({
        sender: user.name,
        message,
        timestamp: now,
      });
    }

    if (status) {
      db.tickets[tIndex].status = status;
    }

    saveDB(db);
    return NextResponse.json({ success: true, ticket: db.tickets[tIndex] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
