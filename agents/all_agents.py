# agents/all_agents.py
from crewai import Agent
from tools.search_tools import web_search_tool, wikipedia_tool, weather_tool, safety_tool
from tools.booking_tools import search_flights, search_hotels

# =====================================================
# LEAD PLANNER AGENT
# =====================================================
def create_lead_planner_agent(llm):
    return Agent(
        role="Lead Travel Planner",
        goal="Parse user trip requests into precise, structured data and assemble final itineraries.",
        backstory="Expert planner who extracts key details and NEVER makes assumptions. When assembling itineraries, you use ONLY the data provided to you and NEVER change the destination or add attractions not in the provided list. You are extremely careful to preserve the exact destination requested by the user.",
        tools=[],
        verbose=False,
        allow_delegation=False,
        llm=llm
    )

# =====================================================
# DESTINATION ANALYST AGENT (Adjusted Iterations)
# =====================================================
def create_destination_analyst_agent(llm):
    return Agent(
        role="Destination Research Specialist",
        goal="Research destinations using real-time data.",
        backstory="You provide practical, accurate information about attractions and safety.",
        tools=[web_search_tool, wikipedia_tool, weather_tool, safety_tool],
        verbose=True,
        allow_delegation=False,
        llm=llm,
        max_iter=4  # 🚀 CHANGED: Increased to 4 so it has time to find attractions
    )

# =====================================================
# LOGISTICS COORDINATOR AGENT
# =====================================================
def create_logistics_agent(llm):
    return Agent(
        role="Travel Logistics Coordinator",
        goal="Find flight and hotel options.",
        backstory="You find the best value options and provide verified booking links.",
        tools=[search_flights, search_hotels],
        verbose=True,
        allow_delegation=False,
        llm=llm,
        max_iter=3 # Slightly increased to allow for fallback processing
    )

# =====================================================
# EXPERIENCE CURATOR AGENT
# =====================================================
def create_experience_curator_agent(llm, trip_duration_days: int, interests: list):
    interests_str = ", ".join(interests) if interests else "general sightseeing"
    return Agent(
        role="Travel Experience Curator",
        goal=f"Create a {trip_duration_days}-day itinerary for interests: {interests_str}.",
        backstory="You transform data into day-by-day plans. You ONLY use attractions provided to you. You DO NOT search for new info. You NEVER use your general knowledge about cities - you ONLY use the specific attractions list given to you. If given Riyadh attractions, you create a Riyadh itinerary. If given Tokyo attractions, you create a Tokyo itinerary. You NEVER mix cities or add attractions not in the provided list.",
        tools=[],
        verbose=False,
        allow_delegation=False,
        llm=llm
    )