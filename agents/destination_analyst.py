# TripPlanner/agents/destination_analyst.py
from crewai import Agent
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