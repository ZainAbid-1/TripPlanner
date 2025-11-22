import os
from dotenv import load_dotenv
from crewai import Task, Crew, LLM

# Import custom components
from schemas.itinerary_schemas import DeconstructedQuery, DestinationAnalysis
from agents.destination_analyst import create_destination_analyst_agent

# Load .env variables
load_dotenv()

# --- Initialize LLM (same as Logistics & Lead Planner) ---
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in your .env file")

# Same LLM as logistics (Gemini flash-lite)
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

    # Create Crew Task
    destination_task = Task(
        description=f"""
        Analyze this destination and produce a detailed destination report.
        Use real-time tools: DuckDuckGo search, Wikipedia, OpenWeather, and safety extraction.

        You MUST return a valid DestinationAnalysis JSON object.

        Trip Query:
        {query_data.model_dump_json(indent=2)}
        """,
        expected_output="A valid DestinationAnalysis JSON object.",
        agent=destination_agent,
        output_pydantic=DestinationAnalysis
    )

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
