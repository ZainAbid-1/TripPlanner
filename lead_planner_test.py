import os
from dotenv import load_dotenv
from crewai import Task, Crew, LLM

# Import your LeadPlanner agent creation function
from agents.lead_planner import create_lead_planner_agent
from schemas.itinerary_schemas import DeconstructedQuery
from tasks.planner_tasks import create_planner_task # <-- ADDED THIS IMPORT

# Load environment variables
load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")

if not google_api_key:
    raise ValueError("GOOGLE_API_KEY is not set in your .env file")

# Initialize LLM (Restored to your original implementation)
llm = LLM(
    model="gemini/gemini-2.0-flash-lite-preview",
    api_key=google_api_key,
    temperature=0.7
)

def run_lead_planner_test():
    print("--- Testing Lead Planner Agent ---")

    # Create the agent
    lead_agent = create_lead_planner_agent(llm=llm)

    # Sample user query
    user_query = "I want to plan a 10-day trip from Madinah, from 2025-11-22 to 2025-12-02, Saudi Arabia to Rome, Italy for 2 adults. Budget is $2000. Interests: culture, food, architecture."

    # --- MODIFIED PART ---
    # Create Crew Task by calling the imported function
    planner_task = create_planner_task(
        agent=lead_agent,
        user_query=user_query
    )
    # --- END MODIFIED PART ---

    # Create Crew and run the task
    crew = Crew(
        agents=[lead_agent],
        tasks=[planner_task],
        verbose=True
    )

    result = crew.kickoff()
    print("\n--- Lead Planner Final JSON Output ---")
    print(result)

if __name__ == "__main__":
    run_lead_planner_test()