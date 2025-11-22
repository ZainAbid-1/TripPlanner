# src/tasks/curation_tasks.py
from textwrap import dedent
from datetime import datetime
from crewai import Task
from schemas.itinerary_schemas import (
    DeconstructedQuery,
    DestinationAnalysis,
    LogisticsAnalysis,
    DailyPlan
)

def create_curation_task(
    agent,
    deconstructed_query: DeconstructedQuery,
    destination_analysis: DestinationAnalysis,
    logistics_analysis: LogisticsAnalysis
):
    """
    Creates the dynamic task for the Experience Curator agent.

    This task synthesizes all available information to build a complete,
    day-by-day itinerary tailored to the user's specified duration and interests.
    """
    # Calculate trip duration
    start_date = datetime.strptime(deconstructed_query.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(deconstructed_query.end_date, "%Y-%m-%d")
    trip_duration_days = (end_date - start_date).days + 1

    # Format interests into a readable string
    interests_str = ", ".join(deconstructed_query.interests)

    # Convert the analysis models to JSON for the context
    destination_json = destination_analysis.model_dump_json(indent=2)
    logistics_json = logistics_analysis.model_dump_json(indent=2)

    return Task(
        description=dedent(f"""
            Create a detailed, {trip_duration_days}-day itinerary based on the provided research and logistics.
            The itinerary MUST be tailored to the user's interests in: {interests_str}.

            Your final output MUST be a list of {trip_duration_days} valid `DailyPlan` JSON objects, one for each day.
            Each `DailyPlan` must have a catchy title and a list of activities.
            Each `Activity` must have a time, type, title, and detailed description.
            Incorporate the recommended attractions and regions from the research.
            The itinerary must begin on {deconstructed_query.start_date} and end on {deconstructed_query.end_date}.

            **User's Core Request:**
            - Destination: {deconstructed_query.destination}
            - Trip Length: {trip_duration_days} days
            - Interests: {interests_str}

            **Destination Research Digest:**
            {destination_json}

            **Booking & Logistics Information:**
            {logistics_json}
        """),
        expected_output=f"A JSON object containing a list of {trip_duration_days} `DailyPlan` objects. The output must be ONLY the JSON object, with no other text, commentary, or formatting.",
        agent=agent,
        output_pydantic=DailyPlan
    )