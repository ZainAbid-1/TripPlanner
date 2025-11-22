import os
import re
import json
from typing import List
from dotenv import load_dotenv
from crewai import Crew, LLM

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
    FinalItinerary,
    DailyPlan
)

load_dotenv()

class TripPlannerCrew:
    def __init__(self):
        def get_llm(env_var_name: str):
            api_key = os.getenv(env_var_name) or os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError(f"Missing API Key: Set {env_var_name} or GOOGLE_API_KEY in .env")
            
            return LLM(
                model="gemini/gemini-2.0-flash-lite-preview",
                api_key=api_key,
                temperature=0.7,
                 safety_settings=[
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_NONE",
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_NONE",
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_NONE",
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_NONE",
                    },
                ]
            )

        print("🔑 Initializing Agent LLMs...")
        self.planner_llm = get_llm("GOOGLE_API_KEY_PLANNER")
        self.analyst_llm = get_llm("GOOGLE_API_KEY_ANALYST")
        self.logistics_llm = get_llm("GOOGLE_API_KEY_LOGISTICS")
        self.curator_llm = get_llm("GOOGLE_API_KEY_CURATOR")

    def run(self, user_query: str) -> dict:
        print(f"\n✈️  STARTING TRIP PLANNER FOR: '{user_query}'")

        # ====================================================
        # STAGE 1: LEAD PLANNER
        # ====================================================
        print("\n🕵️  Stage 1: Deconstructing User Query...")
        planner_agent = create_lead_planner_agent(self.planner_llm)
        planner_task = create_planner_task(planner_agent, user_query)
        
        crew_s1 = Crew(
            agents=[planner_agent], 
            tasks=[planner_task], 
            verbose=True,
            max_rpm=10
        )
        result_s1 = crew_s1.kickoff()
        
        trip_details: DeconstructedQuery = result_s1.pydantic
        print(f"✅ Trip Details Extracted: {trip_details}")

        # ====================================================
        # 🛑 STRICT VALIDATION GATE (THE BOUNCER)
        # ====================================================
        missing = []

        # 1. Destination
        if not trip_details.destination or trip_details.destination.lower() in ["none", "null", "", "unknown"]:
            missing.append("Where do you want to go?")

        # 2. Origin
        if not trip_details.origin or trip_details.origin.lower() in ["none", "null", "", "unknown"]:
            missing.append("Where are you flying from?")

        # 3. Dates
        if not trip_details.start_date:
            missing.append("When do you want to start the trip?")
        if not trip_details.end_date:
            missing.append("When do you want to return?")

        # 4. Travelers
        if not trip_details.travelers or trip_details.travelers.lower() in ["none", "null", "", "0"]:
            missing.append("How many people are traveling?")

        # 5. Budget
        if not trip_details.budget_usd or trip_details.budget_usd == 0:
            missing.append("What is your total budget in USD?")

        # --- FINAL DECISION ---
        if missing:
            # Format list with bullets
            missing_str = "\n• " + "\n• ".join(missing)
            # Throw special error that Frontend recognizes
            raise ValueError(f"Missing Stuff:{missing_str}")

        print(f"✅ Validation Passed. All details present.")

        # ====================================================
        # STAGE 2: PARALLEL RESEARCH
        # ====================================================
        print("\n🌍 Stage 2: Researching & Booking...")
        
        dest_agent = create_destination_analyst_agent(self.analyst_llm)
        logistics_agent = create_logistics_agent(self.logistics_llm)
        
        dest_task = create_destination_task(dest_agent, trip_details)
        logistics_task = create_logistics_task(logistics_agent, trip_details)

        crew_s2 = Crew(
            agents=[dest_agent, logistics_agent],
            tasks=[dest_task, logistics_task],
            verbose=True,
            max_rpm=10
        )
        crew_s2.kickoff()

        destination_output: DestinationAnalysis = dest_task.output.pydantic
        logistics_output: LogisticsAnalysis = logistics_task.output.pydantic

        # ====================================================
        # STAGE 3: EXPERIENCE CURATOR
        # ====================================================
        print("\n🎨 Stage 3: Curating Daily Activities...")
        
        from datetime import datetime
        try:
            s_date = datetime.strptime(trip_details.start_date, "%Y-%m-%d")
            e_date = datetime.strptime(trip_details.end_date, "%Y-%m-%d")
            duration = (e_date - s_date).days + 1
        except:
            duration = 5 # Fallback

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
        
        crew_s3 = Crew(
            agents=[curator_agent], 
            tasks=[curation_task], 
            verbose=True,
            max_rpm=10
        )
        result_s3 = crew_s3.kickoff()
        
        # Robust JSON Parsing
        raw_output = str(result_s3.raw)
        clean_output = re.sub(r'```json\s*', '', raw_output)
        clean_output = re.sub(r'```', '', clean_output).strip()

        daily_plans_list = []
        try:
            data = json.loads(clean_output)
            daily_plans_list = data.get('days', [])
        except json.JSONDecodeError:
            print("⚠️ Error parsing Curator JSON. Using empty list.")
            daily_plans_list = []

        # ====================================================
        # STAGE 4: ASSEMBLY
        # ====================================================
        print("\n📑 Stage 4: Assembling Final Itinerary...")
        
        daily_plan_objects = []
        for day in daily_plans_list:
            try:
                daily_plan_objects.append(DailyPlan(**day))
            except Exception as e:
                print(f"⚠️ Skipping invalid day: {e}")

        assembly_task = create_assembly_task(
            planner_agent,
            destination_output,
            logistics_output,
            daily_plan_objects
        )

        crew_s4 = Crew(
            agents=[planner_agent], 
            tasks=[assembly_task], 
            verbose=True,
            max_rpm=10
        )
        result_s4 = crew_s4.kickoff()
        
        final_itinerary: FinalItinerary = result_s4.pydantic
        return final_itinerary.model_dump()