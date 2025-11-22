# src/agents/experience_curator.py
from crewai import Agent

# Note: We removed the tools import because we don't want it searching anymore.

def create_experience_curator_agent(llm, trip_duration_days: int, interests: list[str]):
    interests_str = ", ".join(interests)

    return Agent(
        role="Experience Curator",
        goal=f"""
        Create a detailed, {trip_duration_days}-day itinerary for a trip,
        tailored to a user with interests in {interests_str}.
        """,
        backstory=(
            "You are a seasoned travel curator. You take raw research and logistics data "
            "and weave them into a perfect, day-by-day travel plan. "
            "You don't need to search the web; you simply organize the provided information "
            "into a beautiful itinerary."
        ),
        tools=[], # <--- CRITICAL: No tools. Just pure LLM reasoning.
        verbose=True,
        allow_delegation=False,
        llm=llm
    )