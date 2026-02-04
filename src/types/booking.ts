// Core booking system types

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departure: {
    airport: Airport;
    time: string;
    date: string;
  };
  arrival: {
    airport: Airport;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  layovers?: {
    duration: number;
    name: string;
    id: string;
  }[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  class: 'economy' | 'business' | 'first';
  baggage: string;
  aircraft: string;
}

export interface Seat {
  id: string;
  row: number;
  column: string;
  type: 'standard' | 'extra-legroom' | 'exit-row' | 'premium';
  price: number;
  isAvailable: boolean;
  isWindow: boolean;
  isAisle: boolean;
}

export interface BaggageOption {
  id: string;
  type: 'cabin' | 'checked';
  weight: number;
  price: number;
  description: string;
}

export interface Passenger {
  id: string;
  title: 'Mr' | 'Mrs' | 'Ms' | 'Dr';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  email?: string;
  phone?: string;
  seat?: Seat;
  baggage?: BaggageOption[];
}

export interface Booking {
  id: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  flight: Flight;
  passengers: Passenger[];
  totalPrice: number;
  serviceFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails {
  bookingId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  transactionId?: string;
  paymentMethod?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  booking: Booking;
  payment: PaymentDetails;
  issuedAt: string;
  dueDate: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'user';
  firstName: string;
  lastName: string;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  class: 'economy' | 'business' | 'first';
  tripType: 'one-way' | 'round-trip';
}
