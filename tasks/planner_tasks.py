# src/tasks/planner_tasks.py
from crewai import Task
from schemas.itinerary_schemas import DeconstructedQuery

def create_planner_task(agent, user_query: str):
    """
    Creates a task for the Lead Planner agent to deconstruct a user query.

    Args:
        agent: The Lead Planner agent.
        user_query: The raw string of the user's trip request.

    Returns:
        A crewai Task object.
    """
    return Task(
        description=f"Deconstruct the following user trip query into structured data:\n'{user_query}'",
        expected_output="A single, valid DeconstructedQuery JSON object. The output must be ONLY the JSON object, with no other text, commentary, or formatting.",
        agent=agent,
        output_pydantic=DeconstructedQuery
    )