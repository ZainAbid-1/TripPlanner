# src/tasks/destination_tasks.py
from crewai import Task
from schemas.itinerary_schemas import DeconstructedQuery, DestinationAnalysis

def create_destination_task(agent, query_data: DeconstructedQuery):
    """
    Creates a task for the Destination Analyst to research the location.

    Args:
        agent: The Destination Analyst agent.
        query_data: A DeconstructedQuery object containing the trip details.

    Returns:
        A crewai Task object.
    """
    return Task(
        description=f"""
        Analyze this destination and produce a detailed destination report.
        Use real-time tools: DuckDuckGo search, Wikipedia, OpenWeather, and safety extraction.
        
        Focus on:
        1. A compelling summary.
        2. Current weather conditions.
        3. Key regions/neighborhoods.
        4. Top attractions relevant to the user's interests.
        5. Cultural norms and safety advisories.

        You MUST return a valid DestinationAnalysis JSON object.

        Trip Query:
        {query_data.model_dump_json(indent=2)}
        """,
        expected_output="A valid DestinationAnalysis JSON object. The output must be ONLY the JSON object.",
        agent=agent,
        output_pydantic=DestinationAnalysis
    )