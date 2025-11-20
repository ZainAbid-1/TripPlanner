# TripPlanner/agents/destination_analyst.py
from crewai import Agent
from crewai import Task, Crew
from schemas.itinerary_schemas import DestinationAnalysis
from tools.search_tools import (
    WebSearchTool,
    WikipediaSearchTool,
    WeatherLookupTool,
    SafetyAdvisoryTool
)

def create_destination_analyst_agent(llm):
    """
    Creates Destination Analyst agent that uses real web, weather, Wikipedia, and safety data.
    """
    return Agent(
        role="Destination Analyst",
        goal="Research destinations and produce a structured DestinationAnalysis JSON output.",
        backstory=(
            "You are a highly skilled travel analyst who uses real-time web search, "
            "weather data, and Wikipedia to provide practical travel advice."
        ),
        tools=[
            WebSearchTool(),
            WikipediaSearchTool(),
            WeatherLookupTool(),
            SafetyAdvisoryTool()
        ],
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def analyze_destination(agent, deconstructed_query):
    """
    Runs the Destination Analyst to produce a DestinationAnalysis object.
    deconstructed_query can be a Pydantic model or a dict with required fields.
    """
    # Accept either Pydantic object or dict
    if hasattr(deconstructed_query, "destination"):
        destination = deconstructed_query.destination
        start_date = getattr(deconstructed_query, "start_date", "")
        end_date = getattr(deconstructed_query, "end_date", "")
        travelers = getattr(deconstructed_query, "travelers", "")
        interests = getattr(deconstructed_query, "interests", [])
        budget = getattr(deconstructed_query, "budget_usd", "")
    else:
        destination = deconstructed_query.get("destination", "")
        start_date = deconstructed_query.get("start_date", "")
        end_date = deconstructed_query.get("end_date", "")
        travelers = deconstructed_query.get("travelers", "")
        interests = deconstructed_query.get("interests", [])
        budget = deconstructed_query.get("budget_usd", "")

    task_desc = f"""
    Produce a structured destination analysis for:
    Destination: {destination}
    Dates: {start_date} to {end_date}
    Travelers: {travelers}
    Interests: {interests}
    Budget: {budget}

    Use your tools to research neighborhoods, top attractions, weather, safety, and local tips.
    Return JSON exactly in this structure:
    {{
        "brief": "...",
        "neighborhoods": [...],
        "top_attractions": [...],
        "weather_summary": "...",
        "safety_summary": "...",
        "local_tips": [...]
    }}
    """

    task = Task(
        description=task_desc,
        agent=agent,
        expected_output="A structured DestinationAnalysis JSON object."
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    result = crew.kickoff()
    return result
