import os
from dotenv import load_dotenv
from crewai import Task, Crew, LLM

# Import your custom components
from schemas.itinerary_schemas import DeconstructedQuery, LogisticsAnalysis
from agents.logistics_coordinator import create_logistics_agent

# Load environment variables
load_dotenv()

# --- Initialize LLM ---
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
        budget_usd=2000,
        interests=["culture", "food", "architecture"],
        origin="Madinah, Saudia Arabia"
    )

    # Create Crew Task
    logistics_task = Task(
        description=f"""
        Find the best flight and hotel options for the following trip.
        Ensure you use all the provided information to perform the searches.
        Your final output MUST be a LogisticsAnalysis JSON object.
        Trip Details:
        {query_data.model_dump_json(indent=2)}
        """,
        expected_output="A valid LogisticsAnalysis JSON object, including a summary and multiple flight and hotel options.",
        agent=logistics_agent,
        output_pydantic=LogisticsAnalysis
    )

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