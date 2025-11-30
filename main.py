# main.py
import os
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from dotenv import load_dotenv
from crewai import Crew, LLM

# Import agents
from agents.all_agents import (
    create_lead_planner_agent,
    create_destination_analyst_agent,
    create_logistics_agent,
    create_experience_curator_agent
)

# Import tasks
from tasks.all_tasks import (
    create_planner_task,
    create_destination_task,
    create_logistics_task,
    create_curation_task,
    create_assembly_task
)

# Import schemas
from schemas.itinerary_schemas import (
    DeconstructedQuery,
    DestinationAnalysis,
    LogisticsAnalysis,
    DailyPlan,
    FinalItinerary,
    FlightOption,
    HotelOption
)

from utils.cache_manager import cache

load_dotenv()

os.environ["CREWAI_TELEMETRY_OPT_OUT"] = "true"
os.environ["CREWAI_REQUEST_TIMEOUT"] = "300" 

class OptimizedTripPlannerCrew:
    def __init__(self):
        print("🔑 Initializing Optimized TripPlanner...")
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        self.planner_llm = self._get_optimized_llm("GOOGLE_API_KEY_PLANNER")
        self.analyst_llm = self._get_optimized_llm("GOOGLE_API_KEY_ANALYST")
        self.logistics_llm = self._get_optimized_llm("GOOGLE_API_KEY_LOGISTICS")
        self.curator_llm = self._get_optimized_llm("GOOGLE_API_KEY_CURATOR")
        
        print("✅ Initialization complete")
    
    def _get_optimized_llm(self, env_var_name: str) -> LLM:
        api_key = os.getenv(env_var_name) or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(f"Missing API Key: Set {env_var_name} or GOOGLE_API_KEY")
        
        return LLM(
            model="gemini/gemini-2.0-flash", 
            api_key=api_key,
            temperature=0.3,
            max_tokens=4000,
            timeout=300, 
            max_retries=3
        )
    
    def _sanitize_and_patch_query(self, query_data: DeconstructedQuery) -> DeconstructedQuery:
        today = datetime.now()
        if not query_data.start_date:
            print("⚠️  LLM failed to output date. Python calculating 'Next Weekend'...")
            days_ahead = (4 - today.weekday() + 7) % 7
            if days_ahead == 0: days_ahead = 7
            next_friday = today + timedelta(days=days_ahead)
            query_data.start_date = next_friday.strftime("%Y-%m-%d")
        
        if not query_data.end_date:
            try:
                start = datetime.strptime(query_data.start_date, "%Y-%m-%d")
                end = start + timedelta(days=3)
                query_data.end_date = end.strftime("%Y-%m-%d")
            except: pass
        
        if not query_data.budget_usd or query_data.budget_usd < 100:
            query_data.budget_usd = 2000
            
        return query_data

    async def run_async(self, user_query: str) -> dict:
        start_time = datetime.now()
        print(f"\n✈️  STARTING OPTIMIZED TRIP PLANNER")
        print(f"📝 Query: '{user_query}'")
        
        # --- STAGE 1: PARSING ---
        print("\n🕵️  [Stage 1/4] Parsing your request...")
        try:
            trip_details_raw = await self._run_stage_1(user_query)
            trip_details = self._sanitize_and_patch_query(trip_details_raw)
            print(f"✅ Parsed & Patched: {trip_details.destination} | {trip_details.start_date} | ${trip_details.budget_usd}")
            self._validate_or_raise(trip_details)
        except Exception as e:
            print(f"❌ Stage 1 Failed: {e}")
            raise ValueError("Could not understand the trip request. Please be more specific.")

        # --- STAGE 2: RESEARCH ---
        print("\n🚀 [Stage 2/4] Researching destination & logistics (PARALLEL)...")
        
        destination_task = self._run_destination_analysis(trip_details)
        logistics_task = self._run_logistics_search(trip_details)
        
        results = await asyncio.gather(destination_task, logistics_task, return_exceptions=True)
        
        destination_output = results[0]
        logistics_output = results[1]
        
        if isinstance(destination_output, Exception) or not destination_output:
            print(f"⚠️ Dest Error: {destination_output}")
            destination_output = self._get_fallback_destination(trip_details.destination)
            
        if isinstance(logistics_output, Exception) or not logistics_output:
            print(f"⚠️ Logistics Error: {logistics_output}")
            logistics_output = self._get_fallback_logistics()
            
        if not logistics_output.flight_options: logistics_output.flight_options = []
        if not logistics_output.hotel_options: logistics_output.hotel_options = []
            
        # --- STAGE 3: CURATION ---
        print("\n🎨 [Stage 3/4] Creating your personalized itinerary...")
        daily_plans = await self._run_curation(trip_details, destination_output, logistics_output)
        
        # --- STAGE 4: ASSEMBLY ---
        print("\n📑 [Stage 4/4] Assembling final itinerary...")
        final_itinerary = await self._run_assembly(destination_output, logistics_output, daily_plans)
        
        end_time = datetime.now()
        print(f"\n🎉 COMPLETE! Time: {(end_time - start_time).total_seconds():.1f}s")
        
        return final_itinerary.model_dump()
    
    # --- HELPER METHODS ---
    async def _run_stage_1(self, user_query: str) -> DeconstructedQuery:
        agent = create_lead_planner_agent(self.planner_llm)
        task = create_planner_task(agent, user_query)
        crew = Crew(agents=[agent], tasks=[task], verbose=False)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, crew.kickoff)
        return result.pydantic
    
    async def _run_destination_analysis(self, trip_details):
        agent = create_destination_analyst_agent(self.analyst_llm)
        task = create_destination_task(agent, trip_details)
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self.executor, crew.kickoff)
        return task.output.pydantic
    
    async def _run_logistics_search(self, trip_details):
        agent = create_logistics_agent(self.logistics_llm)
        task = create_logistics_task(agent, trip_details)
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self.executor, crew.kickoff)
        return task.output.pydantic
    
    async def _run_curation(self, trip_details, dest_data, log_data):
        try:
            s = datetime.strptime(trip_details.start_date, "%Y-%m-%d")
            e = datetime.strptime(trip_details.end_date, "%Y-%m-%d")
            days = (e - s).days + 1
        except: days = 3

        agent = create_experience_curator_agent(self.curator_llm, days, trip_details.interests)
        task = create_curation_task(agent, trip_details, dest_data, log_data)
        crew = Crew(agents=[agent], tasks=[task], verbose=False)
        
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, crew.kickoff)
            
            raw_json = str(result.raw).strip()
            if "```json" in raw_json:
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_json:
                raw_json = raw_json.split("```")[1].split("```")[0].strip()
                
            data = json.loads(raw_json)
            return [DailyPlan(**day) for day in data.get('days', [])]
        except Exception as e:
            print(f"⚠️ Curation Failed: {e}. Generating fallback plan.")
            return [DailyPlan(day=1, title="Arrival", activities=[
                {"time": "14:00", "type": "Check-in", "title": "Hotel Check-in", "description": "Arrive and settle in.", "estimated_cost_usd": 0}
            ])]
            
    async def _run_assembly(self, dest_data, log_data, daily_plans):
        agent = create_lead_planner_agent(self.planner_llm)
        task = create_assembly_task(agent, dest_data, log_data, daily_plans)
        crew = Crew(agents=[agent], tasks=[task], verbose=False)
        
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, crew.kickoff)
            return result.pydantic
        except Exception as e:
            print(f"⚠️ Assembly Failed: {e}. Generating safe fallback.")
            
            # 🚀 ROBUST FALLBACK (Fixes the validation error)
            
            # Create Safe Dummy Flight if missing
            safe_flight = log_data.flight_options[0] if log_data.flight_options else FlightOption(
                airline="Check Online", price_usd=0, duration_hours=0, stops=0, 
                booking_url="https://www.google.com/flights", departure_time="TBA", arrival_time="TBA"
            )
            
            # Create Safe Dummy Hotel if missing
            safe_hotel = log_data.hotel_options[0] if log_data.hotel_options else HotelOption(
                name="Check Local Availability", price_per_night_usd=0, rating=0, summary="Details unavailable", 
                booking_url="https://www.booking.com", address="City Center", amenities=[]
            )

            return FinalItinerary(
                trip_title=f"Trip to {dest_data.key_regions[0] if dest_data.key_regions else 'Destination'}",
                destination="Your Destination",
                trip_summary="Here is your generated itinerary based on available data.",
                chosen_flight=safe_flight,
                chosen_hotel=safe_hotel,
                all_flights=log_data.flight_options,
                all_hotels=log_data.hotel_options,
                budget_overview="Estimated based on typical costs.",
                daily_plans=daily_plans,
                total_estimated_cost=0
            )

    def _validate_or_raise(self, trip_details):
        missing = []
        if not trip_details.destination: missing.append("Destination")
        if not trip_details.start_date: missing.append("Start Date")
        if missing: raise ValueError(f"VALIDATION: Missing {', '.join(missing)}")
            
    def _get_fallback_destination(self, dest):
        return DestinationAnalysis(
            summary=f"Welcome to {dest}. A wonderful place to visit.", 
            weather_forecast="Please check local forecasts.",
            attractions=["City Center", "Local Museum", "Central Park"]
        )
        
    def _get_fallback_logistics(self):
        return LogisticsAnalysis(flight_options=[], hotel_options=[])

    def run(self, user_query: str) -> dict:
        return asyncio.run(self.run_async(user_query))

if __name__ == "__main__":
    crew = OptimizedTripPlannerCrew()
    print(json.dumps(crew.run("Trip to Dubai next weekend"), indent=2))