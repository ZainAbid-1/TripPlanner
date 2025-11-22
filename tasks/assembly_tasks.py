# src/tasks/assembly_tasks.py
from textwrap import dedent
from crewai import Task
from schemas.itinerary_schemas import (
    FinalItinerary,
    DestinationAnalysis,
    LogisticsAnalysis,
    DailyPlan
)

def create_assembly_task(
    agent,
    destination_analysis: DestinationAnalysis,
    logistics_analysis: LogisticsAnalysis,
    daily_plans: list[DailyPlan]
):
    """
    Creates the final task for the Lead Planner to aggregate everything into a FinalItinerary.
    """
    
    # Serialize inputs to JSON strings
    dest_json = destination_analysis.model_dump_json()
    logistics_json = logistics_analysis.model_dump_json()
    
    # Daily plans is a list, so we dump it carefully
    plans_json = "\n".join([plan.model_dump_json() for plan in daily_plans])

    return Task(
        description=dedent(f"""
            You have gathered all the necessary components for the client's trip.
            Now, assemble the Final Itinerary.

            **1. Destination Research:**
            {dest_json}

            **2. Logistics (Flights & Hotels):**
            {logistics_json}

            **3. Daily Activities:**
            {plans_json}

            **Your Goal:**
            - Select the BEST flight from the options provided (lowest price with reasonable duration).
            - Select the BEST hotel from the options provided (best value/rating balance).
            - Create a catchy 'trip_title'.
            - Write a 'trip_summary' that sells the experience.
            - Provide a 'budget_overview' analyzing the costs.
            - Include the full list of 'daily_plans'.

            Return a valid FinalItinerary JSON object.
        """),
        expected_output="A valid FinalItinerary JSON object.",
        agent=agent,
        output_pydantic=FinalItinerary
    )