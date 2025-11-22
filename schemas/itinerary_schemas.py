from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Any

# ==============================================================================
# Stage 1: Initial Query Deconstruction
# ==============================================================================

class DeconstructedQuery(BaseModel):
    # We use Optional[str] so the AI can set them to None if the user didn't mention them.
    destination: Optional[str] = Field(None, description="The primary destination. Set to null if not specified.")
    origin: Optional[str] = Field(None, description="The origin city. Set to null if not specified.")
    
    start_date: Optional[str] = Field(None, description="The start date (YYYY-MM-DD). Set to null if not specified.")
    end_date: Optional[str] = Field(None, description="The end date (YYYY-MM-DD). Set to null if not specified.")
    
    travelers: Optional[str] = Field(None, description="Number of travelers. Set to null if not specified.")
    budget_usd: Optional[int] = Field(None, description="Total budget in USD. Set to 0 or null if not specified.")
    
    interests: List[str] = Field(default_factory=list, description="Specific user interests.")

# ==============================================================================
# Stage 2: Research & Logistics
# ==============================================================================

class FlightOption(BaseModel):
    airline: str = Field(default="Unknown Airline")
    price_usd: int = Field(default=0)
    duration_hours: float = Field(default=0.0)
    stops: int = Field(default=0)
    booking_url: Optional[str] = None

    # Safety validators to prevent crashes if AI creates invalid types
    @field_validator('price_usd', 'stops', mode='before')
    @classmethod
    def parse_int_safely(cls, v):
        if v is None or v == "": return 0
        try: return int(v)
        except: return 0

    @field_validator('duration_hours', mode='before')
    @classmethod
    def parse_float_safely(cls, v):
        if v is None or v == "": return 0.0
        try: return float(v)
        except: return 0.0

class HotelOption(BaseModel):
    name: str = Field(default="Unknown Hotel")
    price_per_night_usd: int = Field(default=0)
    rating: float = Field(default=0.0)
    summary: str = Field(default="Details not available")
    booking_url: Optional[str] = None

    @field_validator('price_per_night_usd', mode='before')
    @classmethod
    def parse_int_safely(cls, v):
        if v is None or v == "": return 0
        try: return int(v)
        except: return 0

    @field_validator('rating', mode='before')
    @classmethod
    def parse_float_safely(cls, v):
        if v is None or v == "": return 0.0
        try: return float(v)
        except: return 0.0
    
    @field_validator('summary', mode='before')
    @classmethod
    def parse_string_safely(cls, v):
        if v is None: return "Details not available"
        return str(v)

class DestinationAnalysis(BaseModel):
    summary: str = Field(default="Summary unavailable")
    weather_forecast: str = Field(default="Weather data unavailable")
    key_regions: List[str] = Field(default_factory=list)
    attractions: List[str] = Field(default_factory=list)
    cultural_and_safety_tips: str = Field(default="Exercise normal precautions")

class LogisticsAnalysis(BaseModel):
    flight_options: List[FlightOption] = Field(default_factory=list)
    hotel_options: List[HotelOption] = Field(default_factory=list)
    logistics_summary: str = Field(default="Details below.")

# ==============================================================================
# Stage 3 & 4: Final Itinerary
# ==============================================================================

class Activity(BaseModel):
    time: str
    type: str
    title: str
    description: str
    estimated_cost_usd: Optional[int] = 0

    @field_validator('estimated_cost_usd', mode='before')
    @classmethod
    def handle_none_cost(cls, v):
        if v is None or v == "": return 0
        return v

class DailyPlan(BaseModel):
    day: int
    date: str = ""
    title: str
    activities: List[Activity] = Field(default_factory=list)

class FinalItinerary(BaseModel):
    trip_title: str
    destination: str
    trip_summary: str
    chosen_flight: FlightOption
    chosen_hotel: HotelOption
    budget_overview: str
    daily_plans: List[DailyPlan]