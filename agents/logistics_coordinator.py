from crewai import Agent
from tools.booking_tools import search_flights, search_hotels

def create_logistics_agent(llm):
    return Agent(
        role="Logistics Coordinator",
        goal="Find the most cost-effeactive and convenient flight and accommodation options.",
        backstory="You are an expert in travel logistics with access to real-time travel data.",
        tools=[search_flights, search_hotels],
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
