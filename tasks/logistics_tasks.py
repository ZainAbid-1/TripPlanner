# src/tasks/logistics_tasks.py
from crewai import Task
from schemas.itinerary_schemas import DeconstructedQuery, LogisticsAnalysis

def create_logistics_task(agent, query_data: DeconstructedQuery):
    """
    Creates a task for the Logistics Coordinator to find flight and hotel options.

    Args:
        agent: The Logistics Coordinator agent.
        query_data: A DeconstructedQuery object containing the trip details.

    Returns:
        A crewai Task object.
    """
    # Create a formatted string from the Pydantic model for the description
    trip_details = query_data.model_dump_json(indent=2)

    return Task(
        description=f"""
        Find the best flight and hotel options based on the provided trip details.
        
        You must use your tools to search for both flights and hotels.
        
        Your final output MUST be a valid LogisticsAnalysis JSON object, containing a summary
        and lists of the best flight and hotel options you found.

        Trip Details:
        {trip_details}
        """,
        expected_output="A single, valid LogisticsAnalysis JSON object. The output must be ONLY the JSON object, with no other text, commentary, or formatting.",
        agent=agent,
        output_pydantic=LogisticsAnalysis
    )