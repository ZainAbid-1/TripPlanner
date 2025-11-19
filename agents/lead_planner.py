from crewai import Agent
from schemas.itinerary_schemas import DeconstructedQuery

def create_lead_planner_agent(llm):
    """
    Creates a LeadPlanner agent that deconstructs a user trip query
    into structured data (DeconstructedQuery) for downstream agents.
    """
    return Agent(
        role="Lead Planner",
        goal="Deconstruct user trip requests into structured trip data.",
        backstory="You are an expert travel planner who transforms unstructured user queries into precise data for booking flights and hotels.",
        tools=[],  # No external tools yet, just LLM reasoning
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def deconstruct_trip_query(agent, user_query):
    """
    Uses the LeadPlanner agent to process a user's trip request
    and return a DeconstructedQuery object.
    """
    task = agent.create_task(
        description=f"Deconstruct this user query into structured trip data:\n{user_query}",
        expected_output="A valid DeconstructedQuery object",
        output_pydantic=DeconstructedQuery
    )
    
    crew = agent.create_crew(tasks=[task], verbose=True)
    result = crew.kickoff()
    return result
