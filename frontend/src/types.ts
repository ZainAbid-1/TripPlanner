// src/types.ts

export interface Activity {
  time: string;
  type: "Travel" | "Dining" | "Activity" | "Accommodation";
  title: string;
  description: string;
  estimated_cost_usd?: number;
}

export interface DailyPlan {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
}

export interface FlightOption {
  airline: string;
  price_usd: number;
  duration_hours: number;
  stops: number;
  booking_url?: string;
}

export interface HotelOption {
  name: string;
  price_per_night_usd: number;
  rating: number;
  summary: string;
  booking_url?: string;
}

export interface FinalItinerary {
  trip_title: string;
  destination: string;
  trip_summary: string;
  chosen_flight: FlightOption;
  chosen_hotel: HotelOption;
  budget_overview: string;
  daily_plans: DailyPlan[];
  // We can infer these for the UI
  total_budget?: number; 
  travelers?: string; 
}