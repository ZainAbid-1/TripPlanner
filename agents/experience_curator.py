# src/agents/experience_curator.py
from crewai import Agent
from tools.activity_tools import (
    find_activities,
    find_restaurants,
    find_local_tours
)

def create_experience_curator_agent(llm, trip_duration_days: int, interests: list[str]):
    """
    Creates the Experience Curator agent with a dynamic goal.

    Args:
        llm: The language model instance.
        trip_duration_days: The total number of days for the trip.
        interests: A list of the user's interests.

    Returns:
        A crewai Agent object.
    """
    # Create a descriptive string from the list of interests
    interests_str = ", ".join(interests)

    return Agent(
        role="Experience Curator",
        goal=f"""
        Create a detailed, {trip_duration_days}-day itinerary for a trip,
        tailored to a user with interests in {interests_str}.
        """,
        backstory=(
            "You are a seasoned travel curator with a passion for creating unforgettable "
            "experiences. You have a knack for finding hidden gems and crafting "
            "narratives that turn a simple vacation into a lifelong memory. Your itineraries "
            "are not just lists of places, but stories waiting to be lived."
        ),
        tools=[find_activities, find_restaurants, find_local_tours],
        verbose=True,
        allow_delegation=False,
        llm=llm
    )