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

    // Enrich tickets with user and employee details
    const enriched = ticketsList.map(t => {
      const creator = db.users.find(u => u.id === t.userId);
      const bld = t.buildingId ? db.buildings.find(b => b.id === t.buildingId) : null;
      const emp = t.assignedEmployeeId ? db.employees.find(e => e.id === t.assignedEmployeeId) : null;
      return {
        ...t,
        creatorName: creator?.name || 'Anonymous Creator',
        creatorRole: creator?.role || 'USER',
        buildingName: bld?.name || 'General Query',
        assignedEmployee: emp ? {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          phone: emp.phone,
          rating: emp.rating,
          ratingCount: emp.ratingCount,
        } : null,
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

    // Match category to worker role
    let targetRole: 'CARETAKER' | 'GUARD' | 'CLEANER' | 'COOK' | 'MANAGER' = 'CARETAKER';
    const catLower = category.toLowerCase();
    if (catLower.includes('wi-fi') || catLower.includes('wifi') || catLower.includes('internet')) {
      targetRole = 'CARETAKER';
    } else if (catLower.includes('cleaning') || catLower.includes('housekeeping') || catLower.includes('clean')) {
      targetRole = 'CLEANER';
    } else if (catLower.includes('food') || catLower.includes('catering') || catLower.includes('cafeteria') || catLower.includes('meal')) {
      targetRole = 'COOK';
    } else if (catLower.includes('security') || catLower.includes('access') || catLower.includes('gate')) {
      targetRole = 'GUARD';
    } else if (catLower.includes('billing') || catLower.includes('invoice') || catLower.includes('rent') || catLower.includes('payment')) {
      targetRole = 'MANAGER';
    } else if (catLower.includes('plumbing') || catLower.includes('electrical') || catLower.includes('repair')) {
      targetRole = 'CARETAKER';
    }

    // Assign employee
    let assignedEmployeeId: string | undefined = undefined;
    if (buildingId) {
      const bldEmployees = db.employees.filter(emp => emp.buildingId === buildingId);
      const matchEmp = bldEmployees.find(emp => emp.role === targetRole) || bldEmployees[0];
      if (matchEmp) {
        assignedEmployeeId = matchEmp.id;
      }
    }

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
      assignedEmployeeId,
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
    const { ticketId, message, status, rating } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
    }

    const db = getDB();
    const tIndex = db.tickets.findIndex(t => t.id === ticketId);
    if (tIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = db.tickets[tIndex];

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
      
      // If resolving and rating is submitted
      if (status === 'RESOLVED' && rating !== undefined && ticket.assignedEmployeeId) {
        const empIndex = db.employees.findIndex(e => e.id === ticket.assignedEmployeeId);
        if (empIndex !== -1) {
          const count = db.employees[empIndex].ratingCount || 1;
          const currentRating = db.employees[empIndex].rating || 5.0;
          const newRating = ((currentRating * count) + parseFloat(rating)) / (count + 1);
          
          db.employees[empIndex].rating = Math.round(newRating * 10) / 10;
          db.employees[empIndex].ratingCount = count + 1;
        }
      }
    }

    saveDB(db);
    const updatedTicket = db.tickets[tIndex];
    const emp = updatedTicket.assignedEmployeeId ? db.employees.find(e => e.id === updatedTicket.assignedEmployeeId) : null;
    const enrichedTicket = {
      ...updatedTicket,
      assignedEmployee: emp ? {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        phone: emp.phone,
        rating: emp.rating,
        ratingCount: emp.ratingCount,
      } : null,
    };
    return NextResponse.json({ success: true, ticket: enrichedTicket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
