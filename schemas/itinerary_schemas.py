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
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            return None  # Invalid date becomes null
    
    @field_validator('budget_usd')
    @classmethod
    def validate_budget(cls, v):
        """Ensure budget is reasonable"""
        if v is None:
            return 0
        if v < 0:
            return 0
        if v > 1000000:  # Prevent unrealistic budgets
            return 1000000
        return v

# ==============================================================================
# Stage 2: Research & Logistics
# ==============================================================================

class FlightOption(BaseModel):
    airline: str = Field(default="Unknown Airline")
    price_usd: int = Field(default=0)
    duration_hours: float = Field(default=0.0)
    stops: int = Field(default=0)
    booking_url: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None

    @field_validator('price_usd', mode='before')
    @classmethod
    def parse_int_safely(cls, v):
        if v is None or v == "":
            return 0
        try:
            price = int(float(v))
            # Validate reasonable price range
            if price <= 0 or price > 50000:
                return 0
            return price
        except:
            return 0

    @field_validator('duration_hours', mode='before')
    @classmethod
    def parse_float_safely(cls, v):
        if v is None or v == "":
            return 0.0
        try:
            duration = float(v)
            if duration <= 0 or duration > 48:  # Reasonable flight duration
                return 0.0
            return duration
        except:
            return 0.0
    
    @field_validator('stops', mode='before')
    @classmethod
    def parse_stops_safely(cls, v):
        if v is None or v == "":
            return 0
        try:
            stops = int(v)
            return max(0, min(stops, 5))  # 0-5 stops max
        except:
            return 0

class HotelOption(BaseModel):
    name: str = Field(default="Unknown Hotel")
    price_per_night_usd: int = Field(default=0)
    rating: float = Field(default=0.0)
    summary: str = Field(default="Details not available")
    booking_url: Optional[str] = None
    address: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)

    @field_validator('price_per_night_usd', mode='before')
    @classmethod
    def parse_int_safely(cls, v):
        if v is None or v == "":
            return 0
        try:
            price = int(float(v))
            if price <= 0 or price > 10000:
                return 0
            return price
        except:
            return 0

    @field_validator('rating', mode='before')
    @classmethod
    def parse_float_safely(cls, v):
        if v is None or v == "":
            return 0.0
        try:
            rating = float(v)
            return max(0.0, min(rating, 10.0))  # 0-10 scale
        except:
            return 0.0
    
    @field_validator('summary', mode='before')
    @classmethod
    def parse_string_safely(cls, v):
        if v is None:
            return "Details not available"
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
        if v is None or v == "":
            return 0
        try:
            cost = int(float(v))
            return max(0, min(cost, 5000))  # Reasonable activity cost
        except:
            return 0

class DailyPlan(BaseModel):
    day: int
    date: str = ""
    title: str
    activities: List[Activity] = Field(default_factory=list)
    daily_budget: Optional[int] = 0

class FinalItinerary(BaseModel):
    trip_title: str
    destination: str
    trip_summary: str
    chosen_flight: FlightOption
    chosen_hotel: HotelOption
    budget_overview: str
    daily_plans: List[DailyPlan]
    total_estimated_cost: Optional[int] = 0
    travel_tips: Optional[str] = None