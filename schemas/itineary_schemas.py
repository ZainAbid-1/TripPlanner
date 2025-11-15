# src/schemas/itinerary_schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# ==============================================================================
# Stage 1: Initial Query Deconstruction (Output of Lead Planner's First Task)
# ==============================================================================

class DeconstructedQuery(BaseModel):
    """
    The structured output after the Lead Planner deconstructs the initial user query.
    This becomes the foundational context for all other agents.
    """
    destination: str = Field(..., description="The primary travel destination.")
    start_date: str = Field(..., description="The start date of the trip in YYYY-MM-DD format.")
    end_date: str = Field(..., description="The end date of the trip in YYYY-MM-DD format.")
    travelers: str = Field(..., description="A description of the travelers (e.g., '2 adults', 'family of 4').")
    budget_usd: int = Field(..., description="The total budget for the trip in USD.")
    interests: List[str] = Field(..., description="A list of interests for the trip (e.g., 'romantic', 'adventure', 'culture').")
    origin: Optional[str] = Field(None, description="The origin city or airport, if mentioned.")

# ==============================================================================
# Stage 2: Parallel Research Outputs (Destination & Logistics Reports)
# ==============================================================================

class DestinationAnalysis(BaseModel):
    """
    The detailed research report from the Destination Analyst agent.
    """
    summary: str = Field(..., description="A compelling summary of the destination for the given dates and interests.")
    weather_forecast: str = Field(..., description="Expected weather conditions and packing recommendations.")
    key_regions: List[str] = Field(..., description="List of top 3-5 neighborhoods or regions to visit.")
    attractions: List[str] = Field(..., description="List of 5-7 must-see attractions relevant to the interests.")
    cultural_and_safety_tips: str = Field(..., description="Important cultural norms and safety advisories.")

class FlightOption(BaseModel):
    """Represents a single flight option."""
    airline: str
    price_usd: int
    duration_hours: float
    stops: int
    booking_url: Optional[str] = None

class HotelOption(BaseModel):
    """Represents a single hotel option."""
    name: str
    price_per_night_usd: int
    rating: float
    summary: str
    booking_url: Optional[str] = None

class LogisticsAnalysis(BaseModel):
    """
    The detailed logistics report from the Logistics Coordinator agent.
    """
    flight_options: List[FlightOption] = Field(..., description="A list of the best flight options found.")
    hotel_options: List[HotelOption] = Field(..., description="A list of 3-5 suitable hotel options.")
    logistics_summary: str = Field(..., description="A summary of the recommended choices and total estimated cost for booking.")

# ==============================================================================
# Stage 3 & 4: Curation Input and The Final Itinerary Output
# ==============================================================================

class Activity(BaseModel):
    """
    A single activity or event within a day of the itinerary.
    """
    time: str = Field(..., description="The time of the activity (e.g., '9:00 AM', 'Afternoon').")
    type: Literal["Travel", "Dining", "Activity", "Accommodation"] = Field(..., description="The type of activity.")
    title: str = Field(..., description="A short, descriptive title for the activity.")
    description: str = Field(..., description="A detailed description of the activity.")
    estimated_cost_usd: Optional[int] = Field(None, description="The estimated cost for this activity.")

class DailyPlan(BaseModel):
    """
    A plan for a single day of the trip.
    """
    day: int = Field(..., description="The day number (e.g., 1, 2, 3).")
    date: str = Field(..., description="The date for this day's plan in YYYY-MM-DD format.")
    title: str = Field(..., description="A catchy title for the day (e.g., 'Arrival in Paris & Marais Exploration').")
    activities: List[Activity] = Field(..., description="A list of activities planned for the day.")

class FinalItinerary(BaseModel):
    """
    The complete, final travel itinerary produced by the crew.
    This is the master object that will be saved to the database and sent to the frontend.
    """
    trip_title: str = Field(..., description="A creative and descriptive title for the overall trip.")
    destination: str = Field(..., description="The primary destination.")
    trip_summary: str = Field(..., description="A brief, engaging paragraph summarizing the entire trip experience.")
    chosen_flight: FlightOption = Field(..., description="The final selected flight details.")
    chosen_hotel: HotelOption = Field(..., description="The final selected hotel details.")
    budget_overview: str = Field(..., description="A summary of the budget allocation (flights, hotel, activities).")
    daily_plans: List[DailyPlan] = Field(..., description="The day-by-day itinerary.")