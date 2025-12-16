# schemas/itinerary_schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

# ==============================================================================
# Stage 1: Initial Query Deconstruction
# ==============================================================================

class DeconstructedQuery(BaseModel):
    destination: Optional[str] = Field(None, description="Primary destination. Set to null if not specified.")
    origin: Optional[str] = Field(None, description="Origin city. Set to null if not specified.")
    
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD). Set to null if not specified.")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD). Set to null if not specified.")
    
    travelers: Optional[str] = Field(None, description="Number of travelers. Set to null if not specified.")
    budget_usd: Optional[int] = Field(None, description="Total budget in USD. Set to 0 or null if not specified.")
    
    interests: List[str] = Field(default_factory=list, description="Specific user interests.")
    
    @field_validator('start_date', 'end_date')
    @classmethod
    def validate_date_format(cls, v):
        """Validate date is in YYYY-MM-DD format"""
        if v is None:
            return v
        try:
            # Check strictly format YYYY-MM-DD
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            return None  # Invalid date becomes null so main.py can patch it
    
    @field_validator('budget_usd', mode='before')
    @classmethod
    def validate_budget(cls, v):
        """Ensure budget is reasonable and handle string inputs like '$2000'"""
        if v is None:
            return 0
        try:
            # Handle strings like "$2000" or "2,000"
            clean_v = str(v).replace("$", "").replace(",", "").strip()
            val = int(float(clean_v))
            if val < 0: return 0
            if val > 1000000: return 1000000
            return val
        except:
            return 0

# ==============================================================================
# Stage 2: Research & Logistics
# ==============================================================================

class FlightSegment(BaseModel):
    """Individual flight segment for connecting flights"""
    leg: int = Field(description="Leg number (1, 2, etc.)")
    airline: str = Field(description="Airline for this segment")
    flight_number: str = Field(default="", description="Flight number")
    from_airport: str = Field(alias="from", default="", description="Departure airport code")
    to_airport: str = Field(alias="to", default="", description="Arrival airport code")
    departure: str = Field(default="", description="Departure time")
    arrival: str = Field(default="", description="Arrival time")
    
    class Config:
        populate_by_name = True

class FlightOption(BaseModel):
    airline: str = Field(default="Unknown Airline")
    price_usd: int = Field(default=0)
    duration_hours: float = Field(default=0.0)
    stops: int = Field(default=0)
    booking_url: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    flight_type: Optional[str] = Field(None, description="Type of flight (direct, connecting, etc.)")
    segments: Optional[List[FlightSegment]] = Field(None, description="Detailed segments for connecting flights")

    @field_validator('booking_url', mode='before')
    @classmethod
    def validate_flight_url(cls, v):
        """Ensure booking URL is valid Google Flights URL without localhost"""
        if v is None or v == "":
            return None
        url_str = str(v).strip()
        # Remove any localhost prefixes that might have been added
        if "localhost:3000" in url_str:
            # Extract the actual URL after localhost
            parts = url_str.split("localhost:3000/")
            if len(parts) > 1:
                url_str = parts[1]
                if not url_str.startswith("http"):
                    url_str = "https://" + url_str
        # Validate it's a proper Google Flights URL
        if url_str.startswith("https://www.google.com/travel/flights"):
            return url_str
        # If invalid, return generic Google Flights search
        return "https://www.google.com/travel/flights"
    
    @field_validator('price_usd', mode='before')
    @classmethod
    def parse_int_safely(cls, v):
        if v is None or v == "": return 0
        try:
            return int(float(str(v).replace("$", "").replace(",", "")))
        except: return 0

    @field_validator('duration_hours', mode='before')
    @classmethod
    def parse_float_safely(cls, v):
        if v is None or v == "": return 0.0
        try:
            return float(v)
        except: return 0.0
    
    @field_validator('stops', mode='before')
    @classmethod
    def parse_stops_safely(cls, v):
        if v is None or v == "": return 0
        try:
            return int(v)
        except: return 0

class HotelOption(BaseModel):
    name: str = Field(default="Unknown Hotel")
    price_per_night_usd: int = Field(default=0)
    rating: float = Field(default=0.0)
    summary: str = Field(default="Details not available")
    booking_url: Optional[str] = None
    address: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)

    @field_validator('booking_url', mode='before')
    @classmethod
    def validate_hotel_url(cls, v):
        """Ensure booking URL is ALWAYS a booking.com or Google Hotels URL, never a hotel website"""
        if v is None or v == "":
            return None
        url_str = str(v).strip()
        
        # Remove any localhost prefixes
        if "localhost:3000" in url_str:
            parts = url_str.split("localhost:3000/")
            if len(parts) > 1:
                url_str = parts[1]
                if not url_str.startswith("http"):
                    url_str = "https://" + url_str
        
        # Allow booking.com URLs (preferred)
        if url_str.startswith("https://www.booking.com") or url_str.startswith("https://booking.com"):
            return url_str
        
        # Allow Google Hotels URLs as fallback when Booking.com API fails
        if url_str.startswith("https://www.google.com/travel/hotels"):
            return url_str
        
        # If it's a hotel website or invalid URL, replace with booking.com search
        # Extract hotel name for search if possible
        print(f"[VALIDATION] Rejected non-booking.com/google URL: {url_str}")
        return "https://www.booking.com/searchresults.html"
    
    @field_validator('price_per_night_usd', mode='before')
    @classmethod
    def parse_int_safely(cls, v):
        if v is None or v == "": return 0
        try:
            return int(float(str(v).replace("$", "").replace(",", "")))
        except: return 0

    @field_validator('rating', mode='before')
    @classmethod
    def parse_float_safely(cls, v):
        if v is None or v == "": return 0.0
        try:
            return float(v)
        except: return 0.0
    
    @field_validator('summary', mode='before')
    @classmethod
    def parse_string_safely(cls, v):
        if v is None: return "Details not available"
        return str(v)[:500]  # Limit length

class DestinationAnalysis(BaseModel):
    summary: str = Field(default="Summary unavailable")
    weather_forecast: str = Field(default="Weather data unavailable")
    key_regions: List[str] = Field(default_factory=list)
    attractions: List[str] = Field(default_factory=list)
    cultural_and_safety_tips: str = Field(default="Exercise normal precautions")
    best_time_to_visit: Optional[str] = None
    local_cuisine: List[str] = Field(default_factory=list)

class LogisticsAnalysis(BaseModel):
    flight_options: List[FlightOption] = Field(default_factory=list)
    outbound_flight_options: List[FlightOption] = Field(default_factory=list, description="Outbound flight options")
    return_flight_options: List[FlightOption] = Field(default_factory=list, description="Return flight options")
    hotel_options: List[HotelOption] = Field(default_factory=list)
    logistics_summary: str = Field(default="Details below.")
    booking_link_flights: Optional[str] = None
    booking_link_hotels: Optional[str] = None

# ==============================================================================
# Stage 3 & 4: Final Itinerary
# ==============================================================================

class Activity(BaseModel):
    time: str
    type: str
    title: str
    description: str
    estimated_cost_usd: Optional[int] = 0
    location: Optional[str] = None
    booking_required: Optional[bool] = False

    @field_validator('estimated_cost_usd', mode='before')
    @classmethod
    def handle_none_cost(cls, v):
        if v is None or v == "": return 0
        try:
            return int(float(str(v).replace("$", "").replace(",", "")))
        except: return 0

class DailyPlan(BaseModel):
    day: int
    date: str = ""
    title: str
    activities: List[Activity] = Field(default_factory=list)
    daily_budget: Optional[int] = 0

class FinalItinerary(BaseModel):
    trip_title: str
    destination: str
    origin: Optional[str] = Field(None, description="Origin city for trip")
    start_date: Optional[str] = Field(None, description="Trip start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="Trip end date (YYYY-MM-DD)")
    trip_summary: str
    
    # Selected Options
    chosen_flight: FlightOption
    chosen_hotel: HotelOption
    
    # Separate outbound and return flights
    chosen_outbound_flight: Optional[FlightOption] = Field(None, description="Selected outbound flight")
    chosen_return_flight: Optional[FlightOption] = Field(None, description="Selected return flight")
    
    # Full lists for frontend
    all_flights: List[FlightOption] = Field(default_factory=list, description="Full list of flight options found")
    all_outbound_flights: List[FlightOption] = Field(default_factory=list, description="All outbound flight options")
    all_return_flights: List[FlightOption] = Field(default_factory=list, description="All return flight options")
    all_hotels: List[HotelOption] = Field(default_factory=list, description="Full list of hotel options found")
    
    budget_overview: str
    daily_plans: List[DailyPlan]
    total_estimated_cost: Optional[int] = 0
    travel_tips: Optional[str] = None