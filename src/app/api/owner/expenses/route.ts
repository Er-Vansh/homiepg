import { NextResponse } from 'next/server';
import { getDB, saveDB, Expense } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDB();
    let expensesList: Expense[] = [];

    if (user.role === 'SUPER_ADMIN') {
      expensesList = db.expenses;
    } else {
      expensesList = db.expenses.filter(e => e.ownerId === user.id);
    }

    const enriched = expensesList.map(e => {
      const bld = db.buildings.find(b => b.id === e.buildingId);
      return {
        ...e,
        buildingName: bld?.name || 'All Buildings',
      };
    });

    return NextResponse.json({ success: true, expenses: enriched });
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
    const { buildingId, category, amount, date, description, invoiceUrl } = body;

    if (!buildingId || !category || !amount || !date) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    const db = getDB();
    const expenseId = `exp_${Math.random().toString(36).substr(2, 9)}`;

    const newExpense: Expense = {
      id: expenseId,
      ownerId: user.id,
      buildingId,
      category,
      amount: parseFloat(amount),
      date,
      description: description || '',
      invoiceUrl: invoiceUrl || '',
    };

    db.expenses.push(newExpense);

    // Audit log
    db.auditLogs.push({
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'EXPENSE_LOGGED',
      details: `Logged expense of Rs. ${amount} under category: ${category} for building: ${buildingId}`,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
