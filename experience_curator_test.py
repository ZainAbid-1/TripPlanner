# experience_curator_test.py
import os
from dotenv import load_dotenv
from datetime import datetime
from crewai import Crew, LLM

# Import schemas and agent/task creation functions
from schemas.itinerary_schemas import (
    DeconstructedQuery,
    DestinationAnalysis,
    LogisticsAnalysis,
    FlightOption,
    HotelOption
)
from agents.experience_curator import create_experience_curator_agent
from tasks.curation_tasks import create_curation_task

# Load environment variables
load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")

if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in your .env file")

# Initialize LLM
llm = LLM(
    model="gemini/gemini-2.0-flash-lite-preview",
    api_key=google_api_key,
    temperature=0.7
)

def run_curator_test():
    """Tests the Experience Curator agent with a dynamic trip duration and interests."""
    print("--- Testing Experience Curator Agent (Dynamic) ---")

    # 2. Create mock input data for Lahore, Pakistan
    mock_deconstructed_query = DeconstructedQuery(
        destination="Lahore, Pakistan",
        start_date="2025-04-10",
        end_date="2025-04-15", # This implies a 6-day trip
        travelers="2 adults",
        budget_usd=3000,
        interests=["Mughal architecture", "history", "food", "local markets"],
        origin="Dubai, UAE"
    )

    mock_destination_analysis = DestinationAnalysis(
        summary="Lahore, the cultural capital of Pakistan, is a city rich with history, vibrant food scenes, and stunning Mughal architecture. It's a journey through time, from the ancient walled city to modern urban life.",
        weather_forecast="April in Lahore is warm and pleasant, with average temperatures around 25-35°C (77-95°F). It's typically dry, making it perfect for exploring.",
        key_regions=["Walled City (Androon Lahore) for history", "Gulberg for modern shopping and dining", "DHA for upscale cafes"],
        attractions=["Badshahi Mosque", "Lahore Fort (Shahi Qila)", "Wazir Khan Mosque", "Shalimar Gardens", "Anarkali Bazaar", "Gawalmandi Food Street"],
        cultural_and_safety_tips="Dress modestly, especially when visiting religious sites. Bargaining is common in local markets. Enjoy the famous Lahori hospitality, but stay aware of your surroundings in crowded areas."
    )

    mock_logistics_analysis = LogisticsAnalysis(
        flight_options=[], # Not essential for this test
        hotel_options=[
            HotelOption(name="Pearl Continental Hotel Lahore", price_per_night_usd=150, rating=4.6, summary="A landmark luxury hotel with multiple dining options and excellent service."),
            HotelOption(name="Avari Hotel Lahore", price_per_night_usd=130, rating=4.5, summary="Known for its beautiful gardens, pool, and high-end amenities.")
        ],
        logistics_summary="Top-tier hotels are available at a reasonable price, offering a comfortable and luxurious stay."
    )

    # --- THIS IS THE CORRECTED DYNAMIC PART ---
    # Dynamically calculate the trip duration directly from the test data
    start_date = datetime.strptime(mock_deconstructed_query.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(mock_deconstructed_query.end_date, "%Y-%m-%d")
    trip_duration_days = (end_date - start_date).days + 1
    # --- END OF CORRECTION ---

    # 1. Create the agent, now passing the truly dynamic data
    curator_agent = create_experience_curator_agent(
        llm=llm,
        trip_duration_days=trip_duration_days, # Now passing the calculated variable
        interests=mock_deconstructed_query.interests
    )

    # 3. Create the task, passing all necessary context
    curation_task = create_curation_task(
        agent=curator_agent,
        deconstructed_query=mock_deconstructed_query,
        destination_analysis=mock_destination_analysis,
        logistics_analysis=mock_logistics_analysis
    )

    # 4. Create and run the Crew
    crew = Crew(
        agents=[curator_agent],
        tasks=[curation_task],
        verbose=True
    )

    result = crew.kickoff()

    print("\n--- Experience Curator Final JSON Output ---")
    print(result)

if __name__ == "__main__":
    run_curator_test()