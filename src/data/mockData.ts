import { Airport, Flight, BaggageOption, Seat } from '@/types/booking';

export const airports: Airport[] = [
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'DMM', name: 'King Fahd International Airport', city: 'Dammam', country: 'Saudi Arabia' },
  { code: 'MED', name: 'Prince Mohammad Bin Abdulaziz Airport', city: 'Madinah', country: 'Saudi Arabia' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
];

export const mockFlights: Flight[] = [
  {
    id: 'SV-001',
    flightNumber: 'SV 101',
    airline: 'Saudi Airlines',
    departure: {
      airport: airports[0], // Riyadh
      time: '08:00',
      date: '2025-02-15',
    },
    arrival: {
      airport: airports[1], // Jeddah
      time: '10:15',
      date: '2025-02-15',
    },
    duration: '2h 15m',
    price: 450,
    currency: 'IDR',
    class: 'economy',
    seatsAvailable: 45,
    aircraft: 'Boeing 787',
  },
  {
    id: 'SV-002',
    flightNumber: 'SV 103',
    airline: 'Saudi Airlines',
    departure: {
      airport: airports[0],
      time: '14:30',
      date: '2025-02-15',
    },
    arrival: {
      airport: airports[1],
      time: '16:45',
      date: '2025-02-15',
    },
    duration: '2h 15m',
    price: 520,
    currency: 'IDR',
    class: 'economy',
    seatsAvailable: 32,
    aircraft: 'Airbus A320',
  },
  {
    id: 'SV-003',
    flightNumber: 'SV 201',
    airline: 'Saudi Airlines',
    departure: {
      airport: airports[0],
      time: '06:00',
      date: '2025-02-15',
    },
    arrival: {
      airport: airports[4], // Dubai
      time: '09:30',
      date: '2025-02-15',
    },
    duration: '3h 30m',
    price: 890,
    currency: 'IDR',
    class: 'economy',
    seatsAvailable: 28,
    aircraft: 'Boeing 777',
  },
  {
    id: 'SV-004',
    flightNumber: 'SV 401',
    airline: 'Saudi Airlines',
    departure: {
      airport: airports[1], // Jeddah
      time: '22:00',
      date: '2025-02-15',
    },
    arrival: {
      airport: airports[6], // London
      time: '04:30',
      date: '2025-02-16',
    },
    duration: '7h 30m',
    price: 2850,
    currency: 'IDR',
    class: 'business',
    seatsAvailable: 12,
    aircraft: 'Boeing 787 Dreamliner',
  },
];

export const baggageOptions: BaggageOption[] = [
  { id: 'cabin-7', type: 'cabin', weight: 7, price: 0, description: 'Carry-on bag (included)' },
  { id: 'checked-20', type: 'checked', weight: 20, price: 100, description: 'Standard checked baggage' },
  { id: 'checked-30', type: 'checked', weight: 30, price: 180, description: 'Large checked baggage' },
  { id: 'checked-40', type: 'checked', weight: 40, price: 280, description: 'Extra large baggage' },
];

export function generateSeatMap(rows: number = 30, columns: string[] = ['A', 'B', 'C', 'D', 'E', 'F']): Seat[] {
  const seats: Seat[] = [];
  const exitRows = [12, 13];
  const premiumRows = [1, 2, 3];
  
  for (let row = 1; row <= rows; row++) {
    columns.forEach((col, colIndex) => {
      const isWindow = colIndex === 0 || colIndex === columns.length - 1;
      const isAisle = colIndex === 2 || colIndex === 3;
      const isExit = exitRows.includes(row);
      const isPremium = premiumRows.includes(row);
      
      let type: Seat['type'] = 'standard';
      let price = 0;
      
      if (isPremium) {
        type = 'premium';
        price = 150;
      } else if (isExit) {
        type = 'exit-row';
        price = 80;
      } else if (isWindow || isAisle) {
        type = 'extra-legroom';
        price = 40;
      }
      
      seats.push({
        id: `${row}${col}`,
        row,
        column: col,
        type,
        price,
        isAvailable: Math.random() > 0.3,
        isWindow,
        isAisle,
      });
    });
  }
  
  return seats;
}
