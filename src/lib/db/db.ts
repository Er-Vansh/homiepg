import fs from 'fs';
import path from 'path';

// Define DB Interfaces based on Prisma representation
export interface User {
  id: string;
  email: string;
  passwordHash: string; // for simplicity, store text or simple hash
  name: string;
  role: 'USER' | 'OWNER' | 'SUPER_ADMIN';
  phone?: string;
  createdAt: string;
}

export interface OwnerProfile {
  userId: string;
  isApproved: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
  companyName: string;
  documentUrls: string[];
  subscriptionPlan: 'BASIC' | 'PRO' | 'ENTERPRISE';
}

export interface Building {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  area: string;
  nearbyColleges: string[];
  nearbyCompanies: string[];
  nearbyMetro: string[];
  description: string;
  amenities: string[];
  rules: string[];
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  baseRent: number;
  baseDeposit: number;
  foodCharges: number;
  electricityCharges: number;
  waterCharges: number;
  wifiCharges: number;
  laundryCharges: number;
  parkingCharges: number;
  housekeepingCharges: number;
  createdAt: string;
}

export interface Room {
  id: string;
  buildingId: string;
  floorNumber: number;
  roomNumber: string;
  sharingType: number; // 1, 2, 3, 4
  hasAC: boolean;
  hasWashroom: boolean;
  price: number;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  currentResidentId?: string;
  reservationExpiry?: string;
  expectedVacantDate?: string;
}

export interface Resident {
  id: string;
  ownerId: string;
  buildingId: string;
  roomId: string;
  bedId: string;
  name: string;
  phone: string;
  email: string;
  emergencyContact: string;
  address: string;
  occupation: string;
  college?: string;
  company?: string;
  joiningDate: string;
  leavingDate?: string;
  rentAmount: number;
  securityDeposit: number;
  outstandingAmount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
  kycDocAadhaar?: string;
  kycDocPan?: string;
  kycDocPassport?: string;
  kycDocDriving?: string;
  kycDocPhoto?: string;
  kycDocAgreement?: string;
  kycDocSignature?: string;
  policeVerified: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  buildingId: string;
  roomId: string;
  bedId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  moveInDate: string;
  moveOutDate: string;
  paymentProofUrl?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  residentId: string;
  ownerId: string;
  buildingId: string;
  bookingId?: string;
  amount: number;
  paymentType: 'RENT' | 'DEPOSIT' | 'UTILITIES' | 'LATE_FEES' | 'MAINTENANCE' | 'OTHER';
  status: 'PENDING' | 'PAID' | 'FAILED';
  paymentDate?: string;
  billingPeriod: string;
  invoiceNumber: string;
  receiptNumber?: string;
  proofUrl?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  ownerId: string;
  buildingId: string;
  category: 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET' | 'FOOD' | 'HOUSEKEEPING' | 'SALARY' | 'REPAIRS' | 'MAINTENANCE' | 'MISCELLANEOUS';
  amount: number;
  date: string;
  description: string;
  invoiceUrl?: string;
}

export interface Employee {
  id: string;
  ownerId: string;
  buildingId: string;
  name: string;
  role: 'CARETAKER' | 'GUARD' | 'CLEANER' | 'COOK' | 'MANAGER';
  phone: string;
  salary: number;
  attendance: { [month: string]: number }; // e.g. "2026-06": 28
  rating: number;
}

export interface TicketMessage {
  sender: string;
  message: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  userId: string;
  buildingId?: string;
  subject: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  messages: TicketMessage[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  buildingLimit: number;
  features: string[];
}

export interface FeaturedListing {
  id: string;
  buildingId: string;
  startDate: string;
  endDate: string;
  priority: number;
}

export interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'TOP' | 'SIDEBAR' | 'FOOTER';
  isActive: boolean;
}

export interface DBData {
  users: User[];
  ownerProfiles: OwnerProfile[];
  buildings: Building[];
  rooms: Room[];
  beds: Bed[];
  residents: Resident[];
  bookings: Booking[];
  payments: Payment[];
  expenses: Expense[];
  employees: Employee[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  subscriptionPlans: SubscriptionPlan[];
  featuredListings: FeaturedListing[];
  adBanners: AdBanner[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

// Ensure DB file exists or create it with seed data
export function getDB(): DBData {
  if (!fs.existsSync(DB_FILE_PATH)) {
    const seed = getSeedData();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(content) as DBData;
  } catch (e) {
    console.error('Failed to parse database, generating seed', e);
    const seed = getSeedData();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

export function saveDB(data: DBData): void {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate high-fidelity seed data
function getSeedData(): DBData {
  const now = new Date().toISOString();
  
  const users: User[] = [
    {
      id: 'usr_admin',
      email: 'admin@homiepg.com',
      passwordHash: 'Password123',
      name: 'Super Admin Control',
      role: 'SUPER_ADMIN',
      phone: '+919999999999',
      createdAt: now,
    },
    {
      id: 'usr_owner',
      email: 'owner@homiepg.com',
      passwordHash: 'Password123',
      name: 'Rajesh Kumar',
      role: 'OWNER',
      phone: '+919876543210',
      createdAt: now,
    },
    {
      id: 'usr_owner2',
      email: 'owner2@homiepg.com',
      passwordHash: 'Password123',
      name: 'Anjali Sharma',
      role: 'OWNER',
      phone: '+919812345678',
      createdAt: now,
    },
    {
      id: 'usr_user',
      email: 'user@homiepg.com',
      passwordHash: 'Password123',
      name: 'Aarav Sharma',
      role: 'USER',
      phone: '+919988776655',
      createdAt: now,
    },
  ];

  const ownerProfiles: OwnerProfile[] = [
    {
      userId: 'usr_owner',
      isApproved: true,
      verificationStatus: 'VERIFIED',
      companyName: 'Elite Living Spaces Co.',
      documentUrls: ['/kyc/owner_aadhaar.pdf', '/kyc/owner_pan.pdf'],
      subscriptionPlan: 'PRO',
    },
    {
      userId: 'usr_owner2',
      isApproved: false,
      verificationStatus: 'PENDING',
      companyName: 'Urban Nest Accommodations',
      documentUrls: ['/kyc/owner2_aadhaar.pdf'],
      subscriptionPlan: 'BASIC',
    },
  ];

  const buildings: Building[] = [
    {
      id: 'bld_1',
      ownerId: 'usr_owner',
      name: 'HomiePG Elite Residency',
      address: 'Plot 45, Sector 62, Near Metro Station',
      city: 'Noida',
      area: 'Sector 62',
      nearbyColleges: ['JSS Academy of Technical Education', 'Symbiosis Noida'],
      nearbyCompanies: ['Adobe Systems', 'TCS Noida', 'Samsung India'],
      nearbyMetro: ['Sector 62 Metro Station (500m)'],
      description: 'HomiePG Elite Residency provides a premium coliving experience for students and working professionals. Fully managed with zero landlord interference, delicious 3-time meals, and top-tier security.',
      amenities: ['High-speed Wi-Fi', 'Attached Washroom', 'AC', 'Parking', 'Gym', 'Laundry Room', 'CCTV Security', 'Power Backup', 'Food Included', 'Housekeeping'],
      rules: ['No loud music after 10 PM', 'No outside guests overnight without permission', 'Strictly vegetarian cafeteria', 'Smoking only in designated zones'],
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      ],
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      virtualTourUrl: 'https://kuula.co/share/collection/7qYgX',
      baseRent: 12000,
      baseDeposit: 24000,
      foodCharges: 3000,
      electricityCharges: 10,
      waterCharges: 200,
      wifiCharges: 500,
      laundryCharges: 300,
      parkingCharges: 500,
      housekeepingCharges: 200,
      createdAt: now,
    },
    {
      id: 'bld_2',
      ownerId: 'usr_owner',
      name: 'Stanza Premium Living',
      address: '22, Koramangala 4th Block, 80 Feet Road',
      city: 'Bangalore',
      area: 'Koramangala',
      nearbyColleges: ['Christ University', 'Jyoti Nivas College'],
      nearbyCompanies: ['Wipro Technologies', 'Flipkart HQ', 'Razorpay Office'],
      nearbyMetro: ['Trinity Metro Station (3km)', 'Koramangala Bus Depot (100m)'],
      description: 'Modern boys & girls separate wings coliving home. Perfectly optimized for techies in Koramangala. High-end gaming lounge, weekly community events, and single/double premium occupancy models.',
      amenities: ['High-speed Wi-Fi', 'Attached Washroom', 'AC', 'Parking', 'Power Backup', 'CCTV Security', 'Gym', 'Lounge'],
      rules: ['Entry gate closes at 11:30 PM', 'Alcohol prohibited inside rooms', 'Eco-friendly water use requested'],
      images: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      ],
      videoUrl: '',
      virtualTourUrl: '',
      baseRent: 16000,
      baseDeposit: 32000,
      foodCharges: 4000,
      electricityCharges: 9,
      waterCharges: 150,
      wifiCharges: 600,
      laundryCharges: 400,
      parkingCharges: 800,
      housekeepingCharges: 300,
      createdAt: now,
    },
    {
      id: 'bld_3',
      ownerId: 'usr_owner2',
      name: 'Skyline Girls Hostel',
      address: 'Lane 2, Viman Nagar, Opposite Starbucks',
      city: 'Pune',
      area: 'Viman Nagar',
      nearbyColleges: ['Symbiosis International University', 'FLAME University Campus'],
      nearbyCompanies: ['Tech Mahindra Viman Nagar', 'WeWork Pune'],
      nearbyMetro: ['Viman Nagar Bus Stop (200m)'],
      description: 'A safe, clean, and luxurious residence designed exclusively for young women. Equipped with biometric entry, 24/7 warden facility, and professional housekeeping.',
      amenities: ['High-speed Wi-Fi', 'Attached Washroom', 'CCTV Security', 'Food Included', 'Laundry Room', 'Power Backup', 'Security Guard'],
      rules: ['Warden reporting by 10:30 PM', 'No male visitors allowed inside residential floors', 'Quiet hours from 11 PM to 7 AM'],
      images: [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      ],
      videoUrl: '',
      virtualTourUrl: '',
      baseRent: 9500,
      baseDeposit: 19000,
      foodCharges: 2500,
      electricityCharges: 8,
      waterCharges: 100,
      wifiCharges: 0,
      laundryCharges: 200,
      parkingCharges: 0,
      housekeepingCharges: 150,
      createdAt: now,
    },
  ];

  const rooms: Room[] = [];
  const beds: Bed[] = [];
  const residents: Resident[] = [];

  let roomCounter = 1;
  let bedCounter = 1;
  let residentCounter = 1;

  buildings.forEach((b) => {
    // Generate Room 101 (Single Sharing)
    const r1Id = `rm_${roomCounter++}`;
    rooms.push({
      id: r1Id,
      buildingId: b.id,
      floorNumber: 1,
      roomNumber: '101',
      sharingType: 1,
      hasAC: true,
      hasWashroom: true,
      price: b.baseRent * 1.3,
    });
    // Add bed to Room 101
    const b1Id = `bed_${bedCounter++}`;
    beds.push({
      id: b1Id,
      roomId: r1Id,
      bedNumber: '101-A',
      status: 'OCCUPIED',
      currentResidentId: `res_${residentCounter}`,
      expectedVacantDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    // Create Resident for Bed 101-A
    residents.push({
      id: `res_${residentCounter}`,
      ownerId: b.ownerId,
      buildingId: b.id,
      roomId: r1Id,
      bedId: b1Id,
      name: b.id === 'bld_3' ? 'Pooja Hegde' : 'Amit Patel',
      phone: '+919876500001',
      email: b.id === 'bld_3' ? 'pooja@gmail.com' : 'amit.patel@gmail.com',
      emergencyContact: 'Suresh Patel (Father) - +919876500000',
      address: 'A-21, Park Avenue, Vadodara, Gujarat',
      occupation: 'Software Engineer',
      company: b.id === 'bld_1' ? 'Adobe Systems' : 'Flipkart',
      joiningDate: '2026-01-10',
      leavingDate: '2026-12-31',
      rentAmount: b.baseRent * 1.3,
      securityDeposit: b.baseDeposit,
      outstandingAmount: 0,
      status: 'ACTIVE',
      kycDocAadhaar: '/kyc/aadhaar_amit.pdf',
      kycDocPan: '/kyc/pan_amit.pdf',
      policeVerified: true,
    });
    residentCounter++;

    // Generate Room 102 (Double Sharing)
    const r2Id = `rm_${roomCounter++}`;
    rooms.push({
      id: r2Id,
      buildingId: b.id,
      floorNumber: 1,
      roomNumber: '102',
      sharingType: 2,
      hasAC: b.id !== 'bld_3',
      hasWashroom: true,
      price: b.baseRent,
    });
    // Add beds to Room 102
    const b2Id = `bed_${bedCounter++}`;
    const b3Id = `bed_${bedCounter++}`;
    beds.push({
      id: b2Id,
      roomId: r2Id,
      bedNumber: '102-A',
      status: 'OCCUPIED',
      currentResidentId: `res_${residentCounter}`,
      expectedVacantDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    // Create Resident for Bed 102-A
    residents.push({
      id: `res_${residentCounter}`,
      ownerId: b.ownerId,
      buildingId: b.id,
      roomId: r2Id,
      bedId: b2Id,
      name: b.id === 'bld_3' ? 'Sneha Reddy' : 'Vikram Malhotra',
      phone: '+919876500002',
      email: b.id === 'bld_3' ? 'sneha@gmail.com' : 'vikram.m@gmail.com',
      emergencyContact: 'K. R. Reddy (Father) - +919876500099',
      address: 'H-504, Prestige Heights, Hyderabad',
      occupation: 'Student',
      college: b.id === 'bld_3' ? 'Symbiosis Pune' : 'JSS Noida',
      joiningDate: '2026-02-15',
      rentAmount: b.baseRent,
      securityDeposit: b.baseDeposit,
      outstandingAmount: b.baseRent * 0.5,
      status: 'ACTIVE',
      kycDocAadhaar: '/kyc/aadhaar_vikram.pdf',
      policeVerified: false,
    });
    residentCounter++;

    beds.push({
      id: b3Id,
      roomId: r2Id,
      bedNumber: '102-B',
      status: 'AVAILABLE',
    });

    // Generate Room 201 (Triple Sharing)
    const r3Id = `rm_${roomCounter++}`;
    rooms.push({
      id: r3Id,
      buildingId: b.id,
      floorNumber: 2,
      roomNumber: '201',
      sharingType: 3,
      hasAC: false,
      hasWashroom: false,
      price: b.baseRent * 0.8,
    });
    const b4Id = `bed_${bedCounter++}`;
    const b5Id = `bed_${bedCounter++}`;
    const b6Id = `bed_${bedCounter++}`;
    beds.push({
      id: b4Id,
      roomId: r3Id,
      bedNumber: '201-A',
      status: 'AVAILABLE',
    });
    beds.push({
      id: b5Id,
      roomId: r3Id,
      bedNumber: '201-B',
      status: 'AVAILABLE',
    });
    beds.push({
      id: b6Id,
      roomId: r3Id,
      bedNumber: '201-C',
      status: 'AVAILABLE',
    });
  });

  const bookings: Booking[] = [
    {
      id: 'bkg_1',
      userId: 'usr_user',
      buildingId: 'bld_1',
      roomId: 'rm_2',
      bedId: 'bed_3',
      amount: 12000,
      status: 'PENDING',
      moveInDate: '2026-07-05',
      moveOutDate: '2026-12-31',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
      paymentMethod: 'UPI',
      transactionId: 'TXN9988776655',
      createdAt: now,
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay_1',
      residentId: 'res_1',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      amount: 15600,
      paymentType: 'RENT',
      status: 'PAID',
      paymentDate: '2026-06-02T10:00:00Z',
      billingPeriod: 'June 2026',
      invoiceNumber: 'INV-2026-06-001',
      receiptNumber: 'REC-2026-06-001',
      proofUrl: '/proofs/txn_june_res1.png',
      notes: 'Monthly rent paid on time via UPI.',
    },
    {
      id: 'pay_2',
      residentId: 'res_2',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      amount: 12000,
      paymentType: 'RENT',
      status: 'PENDING',
      billingPeriod: 'June 2026',
      invoiceNumber: 'INV-2026-06-002',
      notes: 'Pending partial rent payment.',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp_1',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      category: 'FOOD',
      amount: 24000,
      date: '2026-06-15T18:00:00Z',
      description: 'Weekly grocery supply & cook grocery payment.',
      invoiceUrl: '/invoices/food_june_1.pdf',
    },
    {
      id: 'exp_2',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      category: 'ELECTRICITY',
      amount: 18500,
      date: '2026-06-10T12:00:00Z',
      description: 'Electricity bill payment for May usage.',
      invoiceUrl: '/invoices/elec_june.pdf',
    },
    {
      id: 'exp_3',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      category: 'SALARY',
      amount: 15000,
      date: '2026-06-01T09:00:00Z',
      description: 'Wages for resident caretaker (Ramesh Kumar).',
    },
  ];

  const employees: Employee[] = [
    {
      id: 'emp_1',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      name: 'Ramesh Kumar',
      role: 'CARETAKER',
      phone: '+919911223344',
      salary: 15000,
      attendance: { '2026-06': 30 },
      rating: 4.8,
    },
    {
      id: 'emp_2',
      ownerId: 'usr_owner',
      buildingId: 'bld_1',
      name: 'Bahadur Singh',
      role: 'GUARD',
      phone: '+919922334455',
      salary: 12000,
      attendance: { '2026-06': 29 },
      rating: 4.5,
    },
    {
      id: 'emp_3',
      ownerId: 'usr_owner',
      buildingId: 'bld_2',
      name: 'Kamla Bai',
      role: 'CLEANER',
      phone: '+919933445566',
      salary: 8000,
      attendance: { '2026-06': 26 },
      rating: 4.2,
    },
  ];

  const tickets: Ticket[] = [
    {
      id: 'tkt_1',
      userId: 'usr_user',
      buildingId: 'bld_1',
      subject: 'Wi-Fi connection issues in Floor 2',
      description: 'The Wi-Fi router on the second floor drops connections constantly. It is extremely slow during office hours, and I am unable to join zoom calls.',
      category: 'Internet / Wi-Fi',
      priority: 'MEDIUM',
      status: 'OPEN',
      messages: [
        {
          sender: 'Aarav Sharma',
          message: 'The Wi-Fi router on the second floor drops connections constantly. Please look into it.',
          timestamp: '2026-06-28T09:30:00Z',
        },
      ],
      createdAt: '2026-06-28T09:30:00Z',
    },
    {
      id: 'tkt_2',
      userId: 'usr_owner',
      subject: 'Verification status pending for Skyline Girls Hostel',
      description: 'I uploaded my documentation for the Pune branch listing 3 days ago. It is still marked as pending verification. Please expedite this so I can start accepting resident bookings.',
      category: 'Billing / Listing Approval',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      messages: [
        {
          sender: 'Rajesh Kumar',
          message: 'Please expedite the verification of building: Skyline Girls Hostel.',
          timestamp: '2026-06-27T14:20:00Z',
        },
        {
          sender: 'Super Admin',
          message: 'We are verifying your land deeds and fire clearance certificates. It will be updated shortly.',
          timestamp: '2026-06-28T10:00:00Z',
        },
      ],
      createdAt: '2026-06-27T14:20:00Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log_1',
      userId: 'usr_admin',
      action: 'PLATFORM_METRICS_ACCESSED',
      details: 'Super Admin accessed global dashboard telemetry.',
      ipAddress: '192.168.1.1',
      timestamp: now,
    },
    {
      id: 'log_2',
      userId: 'usr_owner',
      action: 'BUILDING_CREATED',
      details: 'Owner created building: Skyline Girls Hostel in Pune.',
      ipAddress: '192.168.1.15',
      timestamp: '2026-06-26T12:00:00Z',
    },
  ];

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'plan_basic',
      name: 'Basic Listing',
      price: 999,
      buildingLimit: 1,
      features: ['Up to 1 Building listing', 'Live Bed Booking Grid', 'Basic Booking Manager', 'Standard Support'],
    },
    {
      id: 'plan_pro',
      name: 'Professional ERP',
      price: 2499,
      buildingLimit: 5,
      features: ['Up to 5 Buildings listing', 'Live Bed Booking Grid', 'Full ERP Resident Manager', 'Digital KYC document locker', 'Expense Ledger + Reports', 'WhatsApp/Email updates', 'AI Pricing & Vacancy Insights', 'Priority Support'],
    },
    {
      id: 'plan_enterprise',
      name: 'Coliving Enterprise',
      price: 5999,
      buildingLimit: 25,
      features: ['Up to 25 Buildings listing', 'Custom floor designer', 'Full CRM & Helpdesk integration', 'Employee Roster & Attendance ledger', 'Dedicated Account Manager', 'Custom domain mapping', 'Advanced API integrations'],
    },
  ];

  const featuredListings: FeaturedListing[] = [
    {
      id: 'feat_1',
      buildingId: 'bld_1',
      startDate: '2026-06-01',
      endDate: '2026-07-01',
      priority: 1,
    },
  ];

  const adBanners: AdBanner[] = [
    {
      id: 'ad_1',
      title: 'Move in July - Get Rs. 2000 Off Deposit!',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      targetUrl: '/search?discount=JULY2000',
      position: 'TOP',
      isActive: true,
    },
  ];

  return {
    users,
    ownerProfiles,
    buildings,
    rooms,
    beds,
    residents,
    bookings,
    payments,
    expenses,
    employees,
    tickets,
    auditLogs,
    subscriptionPlans,
    featuredListings,
    adBanners,
  };
}
