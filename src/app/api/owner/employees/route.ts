import { NextResponse } from 'next/server';
import { getDB, saveDB, Employee } from '@/lib/db/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDB();
    const list = db.employees.filter(e => e.ownerId === user.id);
    const enriched = list.map(e => {
      const bld = db.buildings.find(b => b.id === e.buildingId);
      return {
        ...e,
        buildingName: bld?.name || 'All Buildings',
      };
    });

    return NextResponse.json({ success: true, employees: enriched });
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
    const { id, name, role, phone, salary, buildingId, attendanceMonth, attendanceDays } = body;

    const db = getDB();

    if (id) {
      // Update employee
      const index = db.employees.findIndex(e => e.id === id && e.ownerId === user.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      if (attendanceMonth && attendanceDays !== undefined) {
        db.employees[index].attendance = {
          ...db.employees[index].attendance,
          [attendanceMonth]: parseInt(attendanceDays),
        };
      } else {
        if (name) db.employees[index].name = name;
        if (role) db.employees[index].role = role;
        if (phone) db.employees[index].phone = phone;
        if (salary) db.employees[index].salary = parseFloat(salary);
        if (buildingId) db.employees[index].buildingId = buildingId;
      }

      saveDB(db);
      return NextResponse.json({ success: true, employee: db.employees[index] });
    }

    // Add new employee
    if (!name || !role || !phone || !salary || !buildingId) {
      return NextResponse.json({ error: 'Missing required employee fields' }, { status: 400 });
    }

    const newEmp: Employee = {
      id: `emp_${Math.random().toString(36).substr(2, 9)}`,
      ownerId: user.id,
      buildingId,
      name,
      role,
      phone,
      salary: parseFloat(salary),
      attendance: {},
      rating: 5.0,
    };

    db.employees.push(newEmp);
    saveDB(db);

    return NextResponse.json({ success: true, employee: newEmp });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
