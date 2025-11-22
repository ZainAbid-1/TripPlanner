# destination_analyst_test.py
import os
from dotenv import load_dotenv
from crewai import Crew, LLM

# Import custom components
from schemas.itinerary_schemas import DeconstructedQuery, DestinationAnalysis
from agents.destination_analyst import create_destination_analyst_agent
from tasks.destination_tasks import create_destination_task # <-- ADDED THIS IMPORT

# Load .env variables
load_dotenv()

# --- Initialize LLM ---
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in your .env file")

llm = LLM(
    model="gemini/gemini-2.0-flash-lite-preview",
    api_key=google_api_key,
    temperature=0.7
)

def run_test():
    print("--- Testing Destination Analyst Agent ---")

    # Create agent
    destination_agent = create_destination_analyst_agent(llm=llm)

    # Query object (must match your schema)
    query_data = DeconstructedQuery(
        destination="Dubai, UAE",
        start_date="2025-01-15",
        end_date="2025-01-20",
        travelers="2 adults",
        budget_usd=1500,
        interests=["shopping", "adventure"],
        origin="Madinah, Saudia Arabia"
    )

    # --- MODIFIED PART ---
    # Create Crew Task by calling the imported function
    destination_task = create_destination_task(
        agent=destination_agent,
        query_data=query_data
    )
    # --- END MODIFIED PART ---

    # Create crew and run the task
    crew = Crew(
        agents=[destination_agent],
        tasks=[destination_task],
        verbose=True
    )

    result = crew.kickoff()

    print("\n--- Final Destination Analysis JSON Output ---")
    print(result)

if __name__ == "__main__":
    run_test()