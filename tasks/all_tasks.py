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
    Includes current date context for relative date parsing.
    """
    today = datetime.now()
    current_date_str = today.strftime("%Y-%m-%d (%A)")
    
    return Task(
        description=dedent(f"""
            Analyze this user trip request: '{user_query}'
            
            **CONTEXT:**
            - Today's Date: {current_date_str}
            
            **CRITICAL RULES (STRICT COMPLIANCE):**
            1. **NO ASSUMPTIONS**: If not explicitly stated, set to null/0
            2. **Origin**: Only extract if clearly stated (e.g., "from London")
            3. **Travelers**: Only extract if mentioned (e.g., "2 people", "family of 4")
            4. **Budget**: Only extract if money amount is mentioned
            5. **Dates**: Only infer if time context given (e.g., "next week", "in June")
               - If month without year, use NEXT occurrence after {current_date_str}
               - If vague like "soon", set to null
            6. **Interests**: Extract any mentioned preferences (beach, culture, food, etc.)
            
            **OUTPUT**: Return ONLY a valid DeconstructedQuery JSON object.
            
            **EXAMPLES:**
            Input: "Trip to Paris next month for 2 people, $3000 budget"
            Output: {{destination: "Paris", origin: null, travelers: "2", budget_usd: 3000, ...}}
            
            Input: "5-day Tokyo vacation"
            Output: {{destination: "Tokyo", origin: null, travelers: null, budget_usd: 0, ...}}
        """),
        expected_output="A valid DeconstructedQuery JSON object with null for missing fields.",
        agent=agent,
        output_pydantic=DeconstructedQuery
    )

# =====================================================
# STAGE 2A: DESTINATION RESEARCH
# =====================================================
def create_destination_task(agent, query_data: DeconstructedQuery) -> Task:
    """Task for Destination Analyst: Research destination"""
    
    interests_context = ""
    if query_data.interests:
        interests_context = f"\n**User Interests**: {', '.join(query_data.interests)}"
    
    return Task(
        description=dedent(f"""
            Research this destination and create a comprehensive travel guide.
            
            **DESTINATION**: {query_data.destination}
            **DATES**: {query_data.start_date} to {query_data.end_date}
            {interests_context}
            
            **YOUR TOOLS:**
            - web_search: For current attractions and recommendations
            - wikipedia_search: For destination overview and history
            - weather_lookup: For current weather conditions
            - safety_advisories: For travel safety information
            
            **INSTRUCTIONS:**
            1. Start with Wikipedia for destination overview
            2. Get current weather conditions
            3. Search for top attractions and activities
            4. Get safety and cultural information
            5. Compile everything into a DestinationAnalysis JSON
            
            **FOCUS AREAS:**
            - Key neighborhoods/regions to visit
            - Must-see attractions (5-10 items)
            - Weather and what to pack
            - Cultural norms and safety tips
            - Best time to visit (if relevant)
            
            **OUTPUT**: DestinationAnalysis JSON with all fields populated.
        """),
        expected_output="A valid DestinationAnalysis JSON object with comprehensive destination info.",
        agent=agent,
        output_pydantic=DestinationAnalysis
    )

# =====================================================
# STAGE 2B: LOGISTICS SEARCH
# =====================================================
def create_logistics_task(agent, query_data: DeconstructedQuery) -> Task:
    """Task for Logistics Coordinator: Find flights and hotels"""
    
    return Task(
        description=dedent(f"""
            Find the best flight and hotel options for this trip.
            
            **TRIP DETAILS:**
            - Origin: {query_data.origin}
            - Destination: {query_data.destination}
            - Departure: {query_data.start_date}
            - Return: {query_data.end_date}
            - Travelers: {query_data.travelers}
            - Budget: ${query_data.budget_usd} USD total
            
            **YOUR TOOLS:**
            - Flight Search Tool: Returns structured flight data with booking URLs
            - Hotel Search Tool: Returns structured hotel data with booking URLs
            
            **INSTRUCTIONS:**
            1. Use Flight Search Tool with these parameters:
               - origin: {query_data.origin}
               - destination: {query_data.destination}
               - start_date: {query_data.start_date}
               - travelers: {query_data.travelers}
            
            2. Use Hotel Search Tool with these parameters:
               - destination: {query_data.destination}
               - budget_usd: {query_data.budget_usd}
               - start_date: {query_data.start_date}
               - end_date: {query_data.end_date}
            
            3. The tools return dictionaries with:
               - flight_options: List of FlightOption dicts
               - hotel_options: List of HotelOption dicts
               - booking_url: Google Flights/Hotels URL
            
            4. Extract the data and create a LogisticsAnalysis JSON:
               - Include ALL flight options from the tool
               - Include ALL hotel options from the tool
               - Store booking URLs in booking_link_flights and booking_link_hotels
               - Write a logistics_summary explaining the options
            
            **CRITICAL**: Copy the booking URLs EXACTLY from tool output.
            
            **OUTPUT**: LogisticsAnalysis JSON with verified booking URLs.
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
    
    # Calculate duration
    try:
        from datetime import datetime
        start = datetime.strptime(trip_details.start_date, "%Y-%m-%d")
        end = datetime.strptime(trip_details.end_date, "%Y-%m-%d")
        num_days = (end - start).days + 1
    except:
        num_days = 5
    
    interests_str = ", ".join(trip_details.interests) if trip_details.interests else "general sightseeing"
    
    # Prepare attractions list
    attractions_list = "\n".join([f"- {a}" for a in destination_data.attractions[:10]])
    
    # Get hotel name for check-in
    hotel_name = "your hotel"
    if logistics_data.hotel_options:
        hotel_name = logistics_data.hotel_options[0].name
    
    return Task(
        description=dedent(f"""
            Create a detailed {num_days}-day itinerary for {trip_details.destination}.
            
            **USER INTERESTS**: {interests_str}
            
            **AVAILABLE ATTRACTIONS** (use these in your itinerary):
            {attractions_list}
            
            **HOTEL FOR CHECK-IN**: {hotel_name}
            
            **INSTRUCTIONS:**
            1. DO NOT use any tools or search for information
            2. Create {num_days} days of activities
            3. Structure each day with 4-6 activities
            4. Include realistic timing (e.g., "09:00 AM", "02:00 PM")
            5. Balance activities based on user interests
            6. First day should include:
               - Arrival activity
               - Check-in at {hotel_name}
               - Light evening activity
            7. Last day should include:
               - Morning activity
               - Check-out
               - Departure preparation
            8. Middle days should be full of experiences
            
            **ACTIVITY TYPES** (vary throughout the itinerary):
            - Sightseeing (museums, landmarks, viewpoints)
            - Dining (breakfast, lunch, dinner at local spots)
            - Cultural experiences (markets, neighborhoods, local life)
            - Relaxation (parks, cafes, leisure time)
            - Adventure (if user interested)
            - Shopping (if time permits)
            
            **PACING GUIDELINES:**
            - Morning: 2 activities (09:00-12:00)
            - Afternoon: 2-3 activities (14:00-18:00)
            - Evening: 1-2 activities (19:00-22:00)
            - Include breaks and travel time
            
            **OUTPUT FORMAT** (CRITICAL - Must be valid JSON):
            {{
                "days": [
                    {{
                        "day": 1,
                        "date": "{trip_details.start_date}",
                        "title": "Arrival & City Introduction",
                        "activities": [
                            {{
                                "time": "10:00 AM",
                                "type": "Arrival",
                                "title": "Airport Arrival",
                                "description": "Land at airport and transfer to hotel",
                                "estimated_cost_usd": 30,
                                "location": "Airport"
                            }},
                            {{
                                "time": "02:00 PM",
                                "type": "Accommodation",
                                "title": "Hotel Check-in",
                                "description": "Check in at {hotel_name}",
                                "estimated_cost_usd": 0,
                                "location": "{hotel_name}"
                            }}
                        ]
                    }}
                ]
            }}
            
            Return ONLY the JSON object, no markdown formatting.
        """),
        expected_output="Valid JSON object with 'days' array containing DailyPlan structures.",
        agent=agent
    )

# =====================================================
# STAGE 4: FINAL ASSEMBLY
# =====================================================
def create_assembly_task(
    agent,
    destination_data: DestinationAnalysis,
    logistics_data: LogisticsAnalysis,
    daily_plans: list
) -> Task:
    """Task for Lead Planner: Assemble final itinerary"""
    
    # Serialize data for prompt
    dest_summary = destination_data.summary[:200]
    weather_info = destination_data.weather_forecast
    
    # Get flight options
    flights_text = "\n".join([
        f"- {f.airline}: ${f.price_usd}, {f.duration_hours}h, {f.stops} stops"
        for f in logistics_data.flight_options[:3]
    ])
    
    # Get hotel options
    hotels_text = "\n".join([
        f"- {h.name}: ${h.price_per_night_usd}/night, Rating: {h.rating}"
        for h in logistics_data.hotel_options[:3]
    ])
    
    return Task(
        description=dedent(f"""
            Assemble the final trip itinerary by selecting the best options.
            
            **DESTINATION SUMMARY:**
            {dest_summary}
            
            **WEATHER:**
            {weather_info}
            
            **FLIGHT OPTIONS:**
            {flights_text}
            
            **HOTEL OPTIONS:**
            {hotels_text}
            
            **DAILY PLANS:**
            {len(daily_plans)} days of activities have been created.
            
            **YOUR TASK:**
            1. Select the BEST flight (lowest price with reasonable duration)
            2. Select the BEST hotel (best value for rating)
            3. Create a catchy trip_title (e.g., "Ultimate 5-Day Paris Adventure")
            4. Write a compelling trip_summary (2-3 sentences selling the experience)
            5. Write a budget_overview analyzing costs:
               - Flight cost
               - Hotel cost (per night × number of nights)
               - Estimated daily spending
               - Total estimated cost
               - Comparison to user's budget
            6. Include the destination name
            7. Include all daily_plans
            8. Calculate total_estimated_cost
            
            **SELECTION CRITERIA:**
            - Flights: Prioritize non-stop or 1-stop, best price
            - Hotels: Balance price and rating (8.0+ rating preferred)
            
            **OUTPUT**: Complete FinalItinerary JSON object.
        """),
        expected_output="A valid FinalItinerary JSON object with all fields populated.",
        agent=agent,
        output_pydantic=FinalItinerary
    )