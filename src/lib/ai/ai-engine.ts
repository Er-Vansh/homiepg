import { getDB, Building, Room, Bed, Resident } from '../db/db';

export interface AIInsights {
  occupancyForecast: { month: string; rate: number }[];
  expectedVacancies: { bedId: string; roomNumber: string; buildingName: string; date: string; residentName: string }[];
  demandForecast: { city: string; area: string; score: number; trend: 'UP' | 'DOWN' | 'STABLE'; advice: string }[];
  priceRecommendations: { buildingId: string; buildingName: string; currentRent: number; recommendedRent: number; reason: string }[];
  revenueInsights: { category: string; value: number; recommendation: string }[];
  expenseOptimization: { category: string; potentialSavings: number; tips: string[] };
}

export function generateAIInsights(ownerId?: string): AIInsights {
  const db = getDB();
  // Filter buildings for owner if provided, else analyze all
  const ownerBuildings = ownerId 
    ? db.buildings.filter(b => b.ownerId === ownerId)
    : db.buildings;
  
  const bldIds = ownerBuildings.map(b => b.id);
  const ownerRooms = db.rooms.filter(r => bldIds.includes(r.buildingId));
  const rIds = ownerRooms.map(r => r.id);
  const ownerBeds = db.beds.filter(b => rIds.includes(b.roomId));
  const ownerResidents = db.residents.filter(r => bldIds.includes(r.buildingId));

  // 1. Occupancy Forecast (Next 6 months)
  const totalBedsCount = ownerBeds.length || 1;
  const occupiedBedsCount = ownerBeds.filter(b => b.status === 'OCCUPIED').length;
  const currentOccupancyRate = (occupiedBedsCount / totalBedsCount) * 100;
  
  const months = ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
  const occupancyForecast = months.map((m, idx) => {
    // Add seasonal variations (students join in Jul-Aug, slight dip in Nov-Dec)
    let rate = currentOccupancyRate;
    if (idx === 0) rate += 5; // Jul
    if (idx === 1) rate += 8; // Aug
    if (idx === 2) rate += 6; // Sep
    if (idx === 3) rate += 2; // Oct
    if (idx === 4) rate -= 3; // Nov
    if (idx === 5) rate -= 5; // Dec
    return {
      month: m,
      rate: Math.min(100, Math.max(0, Math.round(rate))),
    };
  });

  // 2. Expected Vacancies
  const expectedVacancies = ownerBeds
    .filter(b => b.status === 'OCCUPIED' && b.expectedVacantDate)
    .map(b => {
      const room = ownerRooms.find(r => r.id === b.roomId);
      const building = ownerBuildings.find(bl => bl.id === room?.buildingId);
      const resident = ownerResidents.find(res => res.bedId === b.id);
      return {
        bedId: b.id,
        roomNumber: room?.roomNumber || 'Unknown',
        buildingName: building?.name || 'Unknown',
        date: b.expectedVacantDate!,
        residentName: resident?.name || 'Anonymous Resident',
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Demand Forecast (Location-based)
  const demandForecast = [
    {
      city: 'Noida',
      area: 'Sector 62',
      score: 85,
      trend: 'UP' as const,
      advice: 'High demand due to colleges reopening and fresh tech hires at Adobe & Samsung. Recommend raising rents by 5-8% for single-sharing AC rooms.',
    },
    {
      city: 'Bangalore',
      area: 'Koramangala',
      score: 92,
      trend: 'UP' as const,
      advice: 'Premium tech hub. Single occupancy rooms are in severe shortage. Raise price or offer early renewals for long-term tenants.',
    },
    {
      city: 'Pune',
      area: 'Viman Nagar',
      score: 78,
      trend: 'STABLE' as const,
      advice: 'Stable student demand. Keep occupancy high by offering free gym/laundry credits or zero-deposit renewal schemes.',
    },
  ];

  // 4. Price Recommendation
  const priceRecommendations = ownerBuildings.map(b => {
    const roomsInBld = ownerRooms.filter(r => r.buildingId === b.id);
    const avgPrice = roomsInBld.reduce((sum, r) => sum + r.price, 0) / (roomsInBld.length || 1);
    
    // Suggest price hike if occupancy in the city is high, or drop if low
    const hasGym = b.amenities.includes('Gym');
    const hasFood = b.amenities.includes('Food Included');
    let recommendation = b.baseRent;
    let reason = 'Pricing is optimal based on size and current local amenities.';

    if (hasGym && hasFood && b.baseRent < 15000) {
      recommendation = Math.round(b.baseRent * 1.12);
      reason = 'Your listing includes Food and Gym. Comparable properties in this locality charge 12% higher base rents.';
    } else if (!hasGym && b.baseRent > 14000) {
      recommendation = Math.round(b.baseRent * 0.95);
      reason = 'Lower demand for high rent without fitness facility. A 5% discount can boost occupancy by 20%.';
    }

    return {
      buildingId: b.id,
      buildingName: b.name,
      currentRent: b.baseRent,
      recommendedRent: recommendation,
      reason,
    };
  });

  // 5. Revenue Insights
  const monthlyRevenue = ownerResidents.reduce((sum, r) => sum + r.rentAmount, 0);
  const outstandingRev = ownerResidents.reduce((sum, r) => sum + r.outstandingAmount, 0);
  
  const revenueInsights = [
    {
      category: 'Realized Revenue',
      value: monthlyRevenue,
      recommendation: 'Steady monthly collections. Consider setting up automated UPI autopay mandates to eliminate delay in rent transfers.',
    },
    {
      category: 'Outstanding Rent',
      value: outstandingRev,
      recommendation: outstandingRev > 0 
        ? `Rs. ${outstandingRev} is outstanding. Automate daily SMS/WhatsApp payment links to tenants with pending bills.` 
        : 'All accounts settled. Great job maintaining zero outstanding!',
    },
  ];

  // 6. Expense Optimization
  const ownerExpenses = db.expenses.filter(e => bldIds.includes(e.buildingId));
  const foodExpense = ownerExpenses.filter(e => e.category === 'FOOD').reduce((sum, e) => sum + e.amount, 0);
  const electricityExpense = ownerExpenses.filter(e => e.category === 'ELECTRICITY').reduce((sum, e) => sum + e.amount, 0);

  const expenseOptimization = {
    category: 'Operational Outflow',
    potentialSavings: Math.round((foodExpense + electricityExpense) * 0.12),
    tips: [
      electricityExpense > 10000 
        ? 'Switch to sub-metered rooms and bill AC usage directly to tenants. Can save up to 25% on communal energy costs.' 
        : 'Optimize lobby lighting with motion-sensors and switch to 5-star BEE rated inverter ACs.',
      foodExpense > 15000
        ? 'Procure grains in bulk (50kg bags) from wholesale distributors instead of weekly retail grocery runs. Potential savings: 15%.'
        : 'Track food waste logs daily to customize meal portions based on resident attendance checklists.',
    ],
  };

  return {
    occupancyForecast,
    expectedVacancies,
    demandForecast,
    priceRecommendations,
    revenueInsights,
    expenseOptimization,
  };
}

// AI Customer Chatbot response engine
export function askAIChatbot(message: string): string {
  const db = getDB();
  const buildings = db.buildings;
  const msgLower = message.toLowerCase();

  // 1. Greet
  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
    return "Hello! I am HomiePG Assistant, your AI-powered coliving finder. I can help you search PGs, check real-time bed availabilities, or answer questions about pricing, locations, and house rules. How can I help you today?";
  }

  // 2. City or Area query
  for (const b of buildings) {
    if (msgLower.includes(b.city.toLowerCase()) || msgLower.includes(b.area.toLowerCase())) {
      const bldRooms = db.rooms.filter(r => r.buildingId === b.id);
      const bldRoomIds = bldRooms.map(r => r.id);
      const bldBeds = db.beds.filter(bd => bldRoomIds.includes(bd.roomId));
      const availBedsCount = bldBeds.filter(bd => bd.status === 'AVAILABLE').length;

      return `Yes, we have a premium property called "${b.name}" located in ${b.area}, ${b.city}. Rent starts at Rs. ${b.baseRent}/month + security deposit of Rs. ${b.baseDeposit}. It currently has ${availBedsCount} available beds. Nearby landmarks include: ${b.nearbyMetro.join(', ') || 'Bus station'}. Amenities: ${b.amenities.slice(0, 5).join(', ')}, etc. Would you like me to show you how to book it?`;
    }
  }

  // 3. Price or Budget query
  if (msgLower.includes('price') || msgLower.includes('budget') || msgLower.includes('cost') || msgLower.includes('rent')) {
    const cheapBld = [...buildings].sort((a, b) => a.baseRent - b.baseRent)[0];
    if (cheapBld) {
      return `Our most budget-friendly PG is "${cheapBld.name}" in ${cheapBld.city} starting at Rs. ${cheapBld.baseRent}/month. We also have luxury listings in Koramangala, Bangalore starting at Rs. 16,000/month. What is your budget range?`;
    }
  }

  // 4. Amenities Query
  if (msgLower.includes('wifi') || msgLower.includes('ac') || msgLower.includes('food') || msgLower.includes('gym')) {
    return "Most of our HomiePG properties include high-speed Wi-Fi, 3-time meals, daily housekeeping, 24/7 power backup, and CCTV security. Elite properties like 'HomiePG Elite Noida' and 'Stanza Premium Koramangala' also include a fully equipped gym, AC, and recreation lounges.";
  }

  // 5. Booking process Query
  if (msgLower.includes('how to book') || msgLower.includes('booking') || msgLower.includes('reserve')) {
    return "Booking is simple! 1. Go to the search page, 2. Select your preferred PG, 3. View the live floor layout, 4. Click on any green-colored bed (Available), 5. Click 'Book Now', upload your verification proof, and submit. The owner will review and confirm instantly!";
  }

  // 6. Default AI response
  return "I understand you're looking for PG accommodation. To help you better, please let me know your preferred city (Noida, Bangalore, or Pune), sharing type preference (Single/Double/Triple), and budget. I will list matching options with live vacancies immediately!";
}
