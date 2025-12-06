# tasks/all_tasks.py
from textwrap import dedent
from datetime import datetime
from crewai import Task
from schemas.itinerary_schemas import (
    DeconstructedQuery,
    DestinationAnalysis,
    LogisticsAnalysis,
    DailyPlan,
    FinalItinerary
)

# =====================================================
# STAGE 1: QUERY PARSING
# =====================================================
def create_planner_task(agent, user_query: str) -> Task:
    """
    Task for Lead Planner: Parse user query into structured data.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    return Task(
        description=dedent(f"""
            Analyze this user trip request: '{user_query}'
            
            **CONTEXT:**
            - Today's Date: {today_str}
            
            **CRITICAL RULES (STRICT COMPLIANCE):**
            1. **NO ASSUMPTIONS**: If not explicitly stated, set to null/0.
            2. **Dates**: 
               - Extract specific dates if mentioned (e.g., "Dec 5th").
               - If user says "Next Weekend", output null (Python will fix it).
               - **DURATION PARSING**: If user mentions duration (e.g., "for 5 days", "5-day trip"):
                 * Extract the start_date if provided
                 * Calculate end_date = start_date + (duration - 1) days
                 * Example: "for 5 days" starting "2025-12-12" → end_date = "2025-12-16"
               - DO NOT guess a random year.
            3. **Origin**: Only extract if clearly stated.
            4. **Travelers**: Only extract if mentioned.
            5. **Budget**: Only extract if money amount is mentioned.
            6. **Interests**: Extract any mentioned preferences.
            
            **OUTPUT**: Return ONLY a valid DeconstructedQuery JSON object.
        """),
        expected_output="A valid DeconstructedQuery JSON object.",
        agent=agent,
        output_pydantic=DeconstructedQuery
    )

# =====================================================
# STAGE 2A: DESTINATION RESEARCH
# =====================================================
def create_destination_task(agent, query_data: DeconstructedQuery) -> Task:
    return Task(
        description=dedent(f"""
            Research {query_data.destination} for a trip from {query_data.start_date} to {query_data.end_date}.
            
            **PRIORITY INSTRUCTIONS:**
            1. **IMMEDIATELY** search for "Top 5 tourist attractions in {query_data.destination}". (Most Important)
            2. Get current weather.
            3. Use Wikipedia for a *brief* overview.
            4. Get safety info.
            
            **OUTPUT**: DestinationAnalysis JSON.
        """),
        expected_output="A valid DestinationAnalysis JSON object.",
        agent=agent,
        output_pydantic=DestinationAnalysis
    )


# =====================================================
# STAGE 2B: LOGISTICS SEARCH (STRICT URL COPYING)
# =====================================================
# ... inside tasks/all_tasks.py ...

def create_logistics_task(agent, query_data: DeconstructedQuery) -> Task:
    """Task for Logistics Coordinator: Find flights and hotels"""
    
    # Build flight search instructions only if origin is available
    flight_instructions = ""
    if query_data.origin and query_data.origin not in ["None", "null", ""]:
        flight_instructions = f"""
            1. **OUTBOUND FLIGHT SEARCH**:
               - Tool: Flight Search Tool
               - Input 'origin': "{query_data.origin}"
               - Input 'destination': "{query_data.destination}"
               - Input 'start_date': "{query_data.start_date}"
               - Input 'travelers': "{query_data.travelers}"
               - **IMPORTANT**: Search for actual OUTBOUND flights using the Amadeus API
               - Store results in 'outbound_flight_options'
               
            1b. **RETURN FLIGHT SEARCH**:
               - Tool: Flight Search Tool
               - Input 'origin': "{query_data.destination}"
               - Input 'destination': "{query_data.origin}"
               - Input 'start_date': "{query_data.end_date}"
               - Input 'travelers': "{query_data.travelers}"
               - **IMPORTANT**: Search for RETURN flights (destination becomes origin and vice versa)
               - Store results in 'return_flight_options'
            """
    else:
        flight_instructions = """
            1. **FLIGHT SEARCH SKIPPED**:
               - Origin not specified by user
               - Set outbound_flight_options to empty list []
               - Set return_flight_options to empty list []
               - User must specify origin for flight search
            """
    
    return Task(
        description=dedent(f"""
            Perform specific searches for this trip:
            
            {flight_instructions}
            
            2. **HOTEL SEARCH** (MANDATORY):
               - Tool: Hotel Search Tool
               - Input 'destination': "{query_data.destination}"
               - Input 'budget_usd': {query_data.budget_usd}
               - Input 'start_date': "{query_data.start_date}"
               - Input 'end_date': "{query_data.end_date}"
               - **IMPORTANT**: Get real hotel data from Booking.com API
            
            **CRITICAL RULES - STRICT ENFORCEMENT**: 
            - Use the Flight Search Tool ONLY if origin is provided above
            - Always use the Hotel Search Tool
            - **BOOKING URLs**: Copy ALL 'booking_url' fields EXACTLY as returned by the tools
            - **NEVER** modify, shorten, or recreate booking URLs
            - **NEVER** use hotel websites (like www.avari.com) - ONLY use booking.com URLs
            - **NEVER** add localhost or any proxy URLs to booking links
            - **NEVER** hallucinate or generate your own URLs
            - Return ALL flight_options exactly as provided (tools will filter to 3-4 best)
            - Return ALL hotel_options exactly as provided by the tool
            
            **OUTPUT**: LogisticsAnalysis JSON with:
            - outbound_flight_options: List of 3-4 best outbound flights from tool (empty if no origin)
            - return_flight_options: List of 3-4 best return flights from tool (empty if no origin)
            - flight_options: Combined list for backward compatibility (copy of outbound_flight_options)
            - hotel_options: List of hotels from API (all with booking.com URLs)
            - Every booking_url must be EXACTLY what the tool returned (no modifications)
        """),
        expected_output="A valid LogisticsAnalysis JSON with flight/hotel options and booking URLs.",
        agent=agent,
        output_pydantic=LogisticsAnalysis
    )

# =====================================================
# STAGE 3: ITINERARY CURATION
# =====================================================
def create_curation_task(
    agent,
    trip_details: DeconstructedQuery,
    destination_data: DestinationAnalysis,
    logistics_data: LogisticsAnalysis
) -> Task:
    """Task for Experience Curator: Create day-by-day itinerary"""
    
    # Calculate duration (Safe logic)
    try:
        start = datetime.strptime(trip_details.start_date, "%Y-%m-%d")
        end = datetime.strptime(trip_details.end_date, "%Y-%m-%d")
        num_days = (end - start).days + 1
    except: num_days = 3
    
    interests_str = ", ".join(trip_details.interests) if trip_details.interests else "general sightseeing"
    attractions_list = "\n".join([f"- {a}" for a in destination_data.attractions[:10]])
    hotel_name = logistics_data.hotel_options[0].name if logistics_data.hotel_options else "Central Hotel"
    
    return Task(
        description=dedent(f"""
            Create a detailed {num_days}-day itinerary for {trip_details.destination}.
            
            **USER INTERESTS**: {interests_str}
            **AVAILABLE ATTRACTIONS**: {attractions_list}
            **HOTEL**: {hotel_name}
            
            **INSTRUCTIONS:**
            1. Plan {num_days} days.
            2. Use ONLY the provided attractions.
            3. Day 1: Check-in at {hotel_name}.
            
            **IMPORTANT JSON FORMAT:**
            Your output MUST be a JSON object with this exact structure. 
            Do NOT return strings for activities. Return OBJECTS.
            
            Example:
            {{
                "days": [
                    {{
                        "day": 1,
                        "title": "Arrival",
                        "activities": [
                            {{
                                "time": "10:00",
                                "type": "Sightseeing",
                                "title": "Visit Museum",
                                "description": "Tour the main hall",
                                "estimated_cost_usd": 20
                            }}
                        ]
                    }}
                ]
            }}
            
            **OUTPUT**: JSON object with 'days' array.
        """),
        expected_output="Valid JSON object with 'days' array containing Activity objects.",
        agent=agent
    )
# =====================================================
# STAGE 4: FINAL ASSEMBLY (HANDLES LISTS)
# =====================================================
def create_assembly_task(
    agent,
    destination_data: DestinationAnalysis,
    logistics_data: LogisticsAnalysis,
    daily_plans: list
) -> Task:
    """Task for Lead Planner: Assemble final itinerary"""
    
    num_days = len(daily_plans)
    num_flights = len(logistics_data.flight_options or [])
    num_hotels = len(logistics_data.hotel_options or [])
    attractions = destination_data.attractions[:5] if destination_data.attractions else []
    
    num_outbound = len(logistics_data.outbound_flight_options or [])
    num_return = len(logistics_data.return_flight_options or [])
    
    return Task(
        description=dedent(f"""
            **CRITICAL INSTRUCTION**: You are assembling the final itinerary. DO NOT CHANGE THE DESTINATION. Follow these rules EXACTLY.
            
            **FLIGHT SELECTION:**
            - Available outbound flights: {num_outbound}
            - Available return flights: {num_return}
            - Select 1 OUTBOUND flight (the cheapest or best value) as 'chosen_outbound_flight'
            - Select 1 RETURN flight (the cheapest or best value) as 'chosen_return_flight'
            - Copy first outbound flight to 'chosen_flight' for backward compatibility
            - Copy ALL {num_outbound} outbound flights to 'all_outbound_flights' list
            - Copy ALL {num_return} return flights to 'all_return_flights' list
            - Copy outbound flights to 'all_flights' for backward compatibility
            
            **HOTEL SELECTION:**
            - Available hotels: {num_hotels}
            - Select 1 hotel (the best rated or best value) as 'chosen_hotel'
            - Copy ALL {num_hotels} hotels to 'all_hotels' list (MUST be identical to logistics data)
            
            **ITINERARY INFORMATION:**
            - Trip Duration: {num_days} days
            - Daily Plans: Use ALL {num_days} days from input (DO NOT SKIP ANY)
            - Key Attractions: {', '.join(attractions)}
            
            **STRICT RULES:**
            1. DO NOT modify or filter the flight/hotel lists
            2. DO NOT change destination, dates, or trip details
            3. Write 1-2 sentence summaries only
            4. All field values must come ONLY from the provided data
            5. NEVER add made-up attractions, hotels, or flights
            6. **CRITICAL**: Copy booking_url fields EXACTLY - no modifications
            7. **NEVER** use hotel websites - only booking.com URLs allowed
            8. **NEVER** add localhost or proxy URLs to any booking links
            9. **IMPORTANT**: Select DIFFERENT flights for outbound and return if possible
            
            **OUTPUT**: Complete FinalItinerary JSON object. Double-check destination matches input data.
        """),
        expected_output="A valid FinalItinerary JSON object with all fields populated correctly from input data.",
        agent=agent,
        output_pydantic=FinalItinerary
    )