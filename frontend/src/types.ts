export interface Activity {
  time: string;
  type: string;
  title: string;
  description: string;
  estimated_cost_usd: number;
  location?: string;
  booking_required?: boolean;
}

export interface DailyPlan {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
  daily_budget?: number;
}

export interface FlightSegment {
  leg: number;
  airline: string;
  flight_number: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
}

export interface FlightOption {
  airline: string;
  price_usd: number;
  duration_hours: number;
  stops: number;
  booking_url?: string;
  departure_time?: string;
  arrival_time?: string;
  flight_type?: string;
  segments?: FlightSegment[];
}

export interface HotelOption {
  name: string;
  price_per_night_usd: number;
  rating: number;
  summary: string;
  booking_url?: string;
  address?: string;
  amenities: string[];
}

export interface FinalItinerary {
  trip_title: string;
  destination: string;
  trip_summary: string;
  chosen_flight: FlightOption;
  chosen_hotel: HotelOption;
  chosen_outbound_flight?: FlightOption;
  chosen_return_flight?: FlightOption;
  all_flights?: FlightOption[];
  all_outbound_flights?: FlightOption[];
  all_return_flights?: FlightOption[];
  all_hotels?: HotelOption[];
  budget_overview: string;
  daily_plans: DailyPlan[];
  total_estimated_cost?: number;
  travel_tips?: string;
}