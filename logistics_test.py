import os
from dotenv import load_dotenv
from crewai import Task, Crew, LLM

# Import your custom components
from schemas.itinerary_schemas import DeconstructedQuery, LogisticsAnalysis
from agents.logistics_coordinator import create_logistics_agent
from tasks.logistics_tasks import create_logistics_task # <-- ADDED THIS IMPORT

# Load environment variables
load_dotenv()

# --- Initialize LLM (Restored to your original implementation) ---
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in your .env file")

# This works properly with LiteLLM
llm = LLM(
    model="gemini/gemini-2.0-flash-lite-preview",
    api_key=google_api_key,
    temperature=0.7
)

#  Main test function
def run_test():
    print("--- Testing Logistics Coordinator Agent ---")

    # Create the agent by calling your imported function
    logistics_agent = create_logistics_agent(llm=llm)

    # Sample trip query
    query_data = DeconstructedQuery(
        destination="Rome, Italy",
        start_date="2025-10-10",
        end_date="2025-10-20",
        travelers="2 adults",
        budget_usd=6000,
        interests=["culture", "food", "architecture"],
        origin="Madinah, Saudia Arabia"
    )

    # --- MODIFIED PART ---
    # Create Crew Task by calling the imported function
    logistics_task = create_logistics_task(
        agent=logistics_agent,
        query_data=query_data
    )
    # --- END MODIFIED PART ---

    # Create Crew and run the task
    crew = Crew(
        agents=[logistics_agent],
        tasks=[logistics_task],
        verbose=True
    )

    result = crew.kickoff()
    print("\n--- Agent Final JSON Output ---")
    print(result)

if __name__ == "__main__":
    run_test()