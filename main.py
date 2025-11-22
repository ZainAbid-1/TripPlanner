# src/main.py
import os
from typing import List
from dotenv import load_dotenv
from crewai import Crew, LLM
from pydantic import BaseModel, Field

# --- Agent Creators ---
from agents.lead_planner import create_lead_planner_agent
from agents.destination_analyst import create_destination_analyst_agent
from agents.logistics_coordinator import create_logistics_agent
from agents.experience_curator import create_experience_curator_agent

# --- Task Creators ---
from tasks.planner_tasks import create_planner_task
from tasks.destination_tasks import create_destination_task
from tasks.logistics_tasks import create_logistics_task
from tasks.curation_tasks import create_curation_task
from tasks.assembly_tasks import create_assembly_task

# --- Schemas ---
from schemas.itinerary_schemas import (
    DeconstructedQuery,
    DestinationAnalysis,
    LogisticsAnalysis,
    DailyPlan,
    FinalItinerary
)

load_dotenv()

# --- Helper Schema for List Parsing ---
class TripSchedule(BaseModel):
    days: List[DailyPlan] = Field(..., description="The list of daily plans.")

class TripPlannerCrew:
    def __init__(self):
        # Helper to safely get LLM with fallback to main key
        def get_llm(env_var_name: str):
            api_key = os.getenv(env_var_name) or os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError(f"Missing API Key: Set {env_var_name} or GOOGLE_API_KEY in .env")
            
            return LLM(
                model="gemini/gemini-2.0-flash-lite-preview",
                api_key=api_key,
                temperature=0.7
            )

        print("🔑 Initializing Agent LLMs...")
        self.planner_llm = get_llm("GOOGLE_API_KEY_PLANNER")
        self.analyst_llm = get_llm("GOOGLE_API_KEY_ANALYST")
        self.logistics_llm = get_llm("GOOGLE_API_KEY_LOGISTICS")
        self.curator_llm = get_llm("GOOGLE_API_KEY_CURATOR")

    def run(self, user_query: str) -> dict:
        print(f"\n✈️  STARTING TRIP PLANNER FOR: '{user_query}'")

        # ====================================================
        # STAGE 1: LEAD PLANNER (Deconstruct)
        # ====================================================
        print("\n🕵️  Stage 1: Deconstructing User Query...")
        planner_agent = create_lead_planner_agent(self.planner_llm)
        planner_task = create_planner_task(planner_agent, user_query)
        
        crew_s1 = Crew(agents=[planner_agent], tasks=[planner_task], verbose=True)
        result_s1 = crew_s1.kickoff()
        
        trip_details: DeconstructedQuery = result_s1.pydantic
        print(f"✅ Trip Details Extracted: {trip_details}")

        # ====================================================
        # 🛑 STRICT VALIDATION GATE
        # ====================================================
        missing = []

        # Check all critical fields
        if not trip_details.destination or trip_details.destination.lower() == "none":
            missing.append("Destination")
        if not trip_details.origin or trip_details.origin.lower() == "none":
            missing.append("Origin City")
        if not trip_details.start_date or trip_details.start_date.lower() == "none":
            missing.append("Start Date")
        if not trip_details.end_date or trip_details.end_date.lower() == "none":
            missing.append("End Date")
        if not trip_details.travelers or trip_details.travelers.lower() == "none":
            missing.append("Number of Travelers")
        if not trip_details.budget_usd or trip_details.budget_usd == 0:
            missing.append("Budget")

        # Check date logic
        if trip_details.start_date and trip_details.end_date:
            if trip_details.start_date > trip_details.end_date:
                raise ValueError("Invalid Dates: Start Date cannot be after End Date.")

        if missing:
            error_msg = f"We are missing details to plan your trip. Please provide: {', '.join(missing)}."
            raise ValueError(error_msg)

        print(f"✅ Validation Passed. All systems go.")

        # ====================================================
        # STAGE 2: PARALLEL RESEARCH (Analyst & Logistics)
        # ====================================================
        print("\n🌍 Stage 2: Researching & Booking...")
        
        dest_agent = create_destination_analyst_agent(self.analyst_llm)
        logistics_agent = create_logistics_agent(self.logistics_llm)
        
        dest_task = create_destination_task(dest_agent, trip_details)
        logistics_task = create_logistics_task(logistics_agent, trip_details)

        crew_s2 = Crew(
            agents=[dest_agent, logistics_agent],
            tasks=[dest_task, logistics_task],
            verbose=True
        )
        crew_s2.kickoff()

        # Extract outputs directly from tasks
        destination_output: DestinationAnalysis = dest_task.output.pydantic
        logistics_output: LogisticsAnalysis = logistics_task.output.pydantic
        print("✅ Research & Logistics Complete.")

        # ====================================================
        # STAGE 3: EXPERIENCE CURATOR
        # ====================================================
        print("\n🎨 Stage 3: Curating Daily Activities...")
        
        # Calculate days
        from datetime import datetime
        s_date = datetime.strptime(trip_details.start_date, "%Y-%m-%d")
        e_date = datetime.strptime(trip_details.end_date, "%Y-%m-%d")
        duration = (e_date - s_date).days + 1

        curator_agent = create_experience_curator_agent(
            self.curator_llm, 
            trip_duration_days=duration,
            interests=trip_details.interests
        )

        curation_task = create_curation_task(
            curator_agent,
            trip_details,
            destination_output,
            logistics_output
        )
        
        # Use the helper container for List validation
        curation_task.output_pydantic = TripSchedule

        crew_s3 = Crew(agents=[curator_agent], tasks=[curation_task], verbose=True)
        result_s3 = crew_s3.kickoff()
        
        trip_schedule: TripSchedule = result_s3.pydantic
        daily_plans_list = trip_schedule.days
        print(f"✅ Curation Complete: {len(daily_plans_list)} days planned.")

        # ====================================================
        # STAGE 4: LEAD PLANNER (Assembly)
        # ====================================================
        print("\n📑 Stage 4: Assembling Final Itinerary...")
        
        assembly_task = create_assembly_task(
            planner_agent,
            destination_output,
            logistics_output,
            daily_plans_list
        )

        crew_s4 = Crew(agents=[planner_agent], tasks=[assembly_task], verbose=True)
        result_s4 = crew_s4.kickoff()
        
        final_itinerary: FinalItinerary = result_s4.pydantic
        print("✅ Final Itinerary Assembled!")

        return final_itinerary.model_dump()

if __name__ == "__main__":
    # --- LOCAL TEST AREA ---
    planner = TripPlannerCrew()


    good_query = "I want a 3 day trip to Lahore from Madinah, Saudia Arabia for 2 adults, starting March 10th 2025, budget $2000."
    
    try:
        result = planner.run(good_query)
        import json
        print("\n\n👇 FINAL ITINERARY OUTPUT 👇")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"\n❌ ERROR: {e}")