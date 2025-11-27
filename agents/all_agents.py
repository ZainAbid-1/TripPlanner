# agents/all_agents.py
from crewai import Agent
from tools.search_tools import web_search_tool, wikipedia_tool, weather_tool, safety_tool
from tools.booking_tools import search_flights, search_hotels

# =====================================================
# LEAD PLANNER AGENT
# =====================================================
def create_lead_planner_agent(llm):
    """
    Lead Planner: Deconstructs user queries into structured data.
    No external tools - pure LLM reasoning for speed.
    """
    return Agent(
        role="Lead Travel Planner",
        goal="Parse user trip requests into precise, structured data for booking systems.",
        backstory=(
            "You are an expert travel planner with years of experience understanding "
            "customer needs. You extract key details from vague requests and structure "
            "them into actionable booking parameters. You NEVER make assumptions - if "
            "information is missing, you mark it as null."
        ),
        tools=[],  # No tools for speed
        verbose=False,  # Reduced logging for performance
        allow_delegation=False,
        llm=llm
    )

# =====================================================
# DESTINATION ANALYST AGENT
# =====================================================
def create_destination_analyst_agent(llm):
    """
    Destination Analyst: Researches destinations using real-time data.
    Has access to web search, Wikipedia, weather, and safety tools.
    """
    return Agent(
        role="Destination Research Specialist",
        goal=(
            "Research destinations thoroughly using real-time data. "
            "Provide practical, accurate information about attractions, weather, "
            "culture, and safety. Output must be structured JSON."
        ),
        backstory=(
            "You are a seasoned travel researcher with access to live data sources. "
            "You combine information from multiple reliable sources to create "
            "comprehensive destination guides. You prioritize accuracy and "
            "practicality over generic descriptions."
        ),
        tools=[
            web_search_tool,
            wikipedia_tool,
            weather_tool,
            safety_tool
        ],
        verbose=False,
        allow_delegation=False,
        llm=llm,
        max_iter=5  # Limit iterations for speed
    )

# =====================================================
# LOGISTICS COORDINATOR AGENT
# =====================================================
def create_logistics_agent(llm):
    """
    Logistics Coordinator: Finds flights and hotels using real APIs.
    Returns structured data with verified URLs.
    """
    return Agent(
        role="Travel Logistics Coordinator",
        goal=(
            "Find the best flight and hotel options within budget. "
            "Use real-time APIs to get accurate pricing. "
            "Return structured data with verified booking URLs."
        ),
        backstory=(
            "You are a travel logistics expert with direct access to flight and hotel "
            "booking systems. You find the best value options, prioritize customer "
            "preferences, and always provide verified booking links. You understand "
            "that pricing and availability change constantly, so you work efficiently."
        ),
        tools=[
            search_flights,
            search_hotels
        ],
        verbose=False,
        allow_delegation=False,
        llm=llm,
        max_iter=4  # Limit search iterations
    )

# =====================================================
# EXPERIENCE CURATOR AGENT
# =====================================================
def create_experience_curator_agent(llm, trip_duration_days: int, interests: list):
    """
    Experience Curator: Creates day-by-day itineraries.
    NO TOOLS - Uses only the data provided by other agents.
    """
    interests_str = ", ".join(interests) if interests else "general sightseeing"
    
    return Agent(
        role="Travel Experience Curator",
        goal=(
            f"Create a perfect {trip_duration_days}-day itinerary tailored to "
            f"interests: {interests_str}. Use ONLY the provided research data. "
            "Do NOT search for new information."
        ),
        backstory=(
            "You are a master itinerary designer who transforms raw travel data "
            "into unforgettable experiences. You take the attractions, hotels, and "
            "logistics provided by your team and weave them into a cohesive, "
            "day-by-day plan. You never need to search for information - you work "
            "with what you have and make it shine. You understand pacing, rest "
            "periods, and how to balance activities throughout the day."
        ),
        tools=[],  # CRITICAL: No tools for speed
        verbose=False,
        allow_delegation=False,
        llm=llm
    )