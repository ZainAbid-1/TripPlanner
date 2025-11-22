# src/tasks/curation_tasks.py
from textwrap import dedent
from datetime import datetime
from crewai import Task
from schemas.itinerary_schemas import (
    DeconstructedQuery,
    DestinationAnalysis,
    LogisticsAnalysis
)

def create_curation_task(
    agent,
    deconstructed_query: DeconstructedQuery,
    destination_analysis: DestinationAnalysis,
    logistics_analysis: LogisticsAnalysis
):
    # Calculate trip duration safely
    try:
        s_date = datetime.strptime(deconstructed_query.start_date, "%Y-%m-%d")
        e_date = datetime.strptime(deconstructed_query.end_date, "%Y-%m-%d")
        trip_duration_days = (e_date - s_date).days + 1
    except:
        trip_duration_days = 3

    interests_str = ", ".join(deconstructed_query.interests)
    
    # Serialize context
    dest_json = destination_analysis.model_dump_json()
    logistics_json = logistics_analysis.model_dump_json()

    return Task(
        description=dedent(f"""
            You are the final architect of this trip.
            
            **GOAL:** 
            Create a {trip_duration_days}-day itinerary for {deconstructed_query.destination}.
            
            **CONTEXT TO USE:**
            1. **Logistics:** Use the flight/hotel info provided below.
               {logistics_json}
            2. **Research:** Use these attractions/regions.
               {dest_json}
            3. **Interests:** {interests_str}

            **INSTRUCTIONS:**
            - Do NOT use any more tools. You have all the info you need.
            - Create a day-by-day plan.
            - For the first day, include "Check-in at [Hotel Name]" using the hotel from the Logistics data.
            - For the last day, include "Departure" using the flight from the Logistics data.
            - Return the output as a CLEAN JSON object with a 'days' key.

            **OUTPUT FORMAT:**
            {{
                "days": [
                    {{
                        "day": 1, 
                        "title": "Arrival", 
                        "activities": [
                            {{ "time": "10:00 AM", "title": "...", "description": "...", "type": "Activity", "estimated_cost_usd": 20 }}
                        ]
                    }}
                ]
            }}
        """),
        expected_output="A valid JSON object containing the day-by-day itinerary.",
        agent=agent
        # No output_pydantic/json here to avoid strict validation crashes
    )