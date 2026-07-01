import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDB();
    const resident = db.residents.find(r => r.email.toLowerCase() === user.email.toLowerCase());
    if (!resident) {
      return NextResponse.json({ error: 'Resident profile not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      compatibilityProfile: resident.compatibilityProfile || null 
    });
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

    const db = getDB();
    const resIndex = db.residents.findIndex(r => r.email.toLowerCase() === user.email.toLowerCase());
    if (resIndex === -1) {
      return NextResponse.json({ error: 'Resident profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { diet, sleep, occupation, hobbies } = body;

    if (!diet || !sleep || !occupation) {
      return NextResponse.json({ error: 'Missing required profile fields' }, { status: 400 });
    }

    db.residents[resIndex].compatibilityProfile = {
      diet,
      sleep,
      occupation,
      hobbies: hobbies || '',
    };

    saveDB(db);

    return NextResponse.json({ 
      success: true, 
      compatibilityProfile: db.residents[resIndex].compatibilityProfile 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
