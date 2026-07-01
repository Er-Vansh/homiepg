import { NextResponse } from 'next/server';
import { getDB, saveDB, Payment } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDB();
    let paymentsList: Payment[] = [];

    if (user.role === 'SUPER_ADMIN') {
      paymentsList = db.payments;
    } else if (user.role === 'OWNER') {
      paymentsList = db.payments.filter(p => p.ownerId === user.id);
    } else {
      // Find resident profiles for user
      const residents = db.residents.filter(r => r.email === user.email);
      const resIds = residents.map(r => r.id);
      paymentsList = db.payments.filter(p => resIds.includes(p.residentId));
    }

    // Enrich with building & resident names
    const enriched = paymentsList.map(p => {
      const res = db.residents.find(r => r.id === p.residentId);
      const bld = db.buildings.find(b => b.id === p.buildingId);

      return {
        ...p,
        residentName: res?.name || 'Unknown Resident',
        residentPhone: res?.phone || '',
        buildingName: bld?.name || 'Unknown PG',
      };
    });

    return NextResponse.json({ success: true, payments: enriched });
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
    const { residentId, buildingId, amount, paymentType, status, billingPeriod, notes, proofUrl, paymentId } = body;

    const db = getDB();

    if (paymentId) {
      // Update an existing payment (confirm pending)
      const payIndex = db.payments.findIndex(p => p.id === paymentId && p.ownerId === user.id);
      if (payIndex === -1) {
        return NextResponse.json({ error: 'Invoice record not found' }, { status: 404 });
      }

      db.payments[payIndex].status = status || 'PAID';
      db.payments[payIndex].paymentDate = new Date().toISOString();
      db.payments[payIndex].receiptNumber = `REC-${db.payments[payIndex].invoiceNumber.split('-')[1]}-${db.payments[payIndex].invoiceNumber.split('-')[2]}`;
      if (proofUrl) db.payments[payIndex].proofUrl = proofUrl;
      if (notes) db.payments[payIndex].notes = notes;

      // Adjust resident outstanding amount if rent is marked PAID
      const resIndex = db.residents.findIndex(r => r.id === db.payments[payIndex].residentId);
      if (resIndex !== -1 && db.payments[payIndex].paymentType === 'RENT') {
        db.residents[resIndex].outstandingAmount = Math.max(0, db.residents[resIndex].outstandingAmount - db.payments[payIndex].amount);
      }

      saveDB(db);
      return NextResponse.json({ success: true, payment: db.payments[payIndex] });
    }

    // Create a new payment record manually
    if (!residentId || !buildingId || !amount || !paymentType) {
      return NextResponse.json({ error: 'Missing payment record details' }, { status: 400 });
    }

    const payId = `pay_${Math.random().toString(36).substr(2, 9)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newPayment: Payment = {
      id: payId,
      residentId,
      ownerId: user.id,
      buildingId,
      amount: parseFloat(amount),
      paymentType,
      status: status || 'PAID',
      paymentDate: status === 'PAID' ? new Date().toISOString() : undefined,
      billingPeriod: billingPeriod || `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      invoiceNumber,
      receiptNumber: status === 'PAID' ? `REC-${invoiceNumber.split('-')[1]}-${invoiceNumber.split('-')[2]}` : undefined,
      proofUrl: proofUrl || '',
      notes: notes || 'Logged manually by owner.',
    };

    db.payments.push(newPayment);

    // If rent outstanding, update resident model
    if (status !== 'PAID' && paymentType === 'RENT') {
      const resIndex = db.residents.findIndex(r => r.id === residentId);
      if (resIndex !== -1) {
        db.residents[resIndex].outstandingAmount += parseFloat(amount);
      }
    }

    saveDB(db);
    return NextResponse.json({ success: true, payment: newPayment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
