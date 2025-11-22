# src/tasks/logistics_tasks.py
from crewai import Task
from schemas.itinerary_schemas import DeconstructedQuery, LogisticsAnalysis

def create_logistics_task(agent, query_data: DeconstructedQuery):
    trip_details = query_data.model_dump_json(indent=2)

    return Task(
        description=f"""
        Find flight and hotel options.
        
        **MANDATORY URL INSTRUCTIONS:**
        The Tool Output contains a section called:
        `!!! IMPORTANT: USE THIS BOOKING LINK FOR ALL FLIGHTS/HOTELS !!!`
        
        1. Copy that EXACT URL.
        2. Paste it into the `booking_url` field for EVERY Flight Option you list.
        3. Paste it into the `booking_url` field for EVERY Hotel Option you list.
        4. DO NOT leave `booking_url` null.
        5. DO NOT invent your own URL like "www.expedia.com". Use the one provided.

        **DATA EXTRACTION:**
        - Extract Airline Name and Price from the "FLIGHT DETAILS FOUND" section.
        - Extract Hotel Name and Price from the "HOTEL DETAILS FOUND" section.

        Trip Details:
        {trip_details}
        """,
        expected_output="A LogisticsAnalysis JSON object with valid prices and the provided booking_url filled in.",
        agent=agent,
        output_pydantic=LogisticsAnalysis
    )