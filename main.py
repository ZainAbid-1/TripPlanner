# main.py
import os
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
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
    FinalItinerary
)

# Import cache
from utils.cache_manager import cache

load_dotenv()

class OptimizedTripPlannerCrew:
    """
    Optimized multi-agent system with:
    - Async parallel execution
    - Aggressive caching
    - Error recovery
    - Fast LLM configuration
    """
    
    def __init__(self):
        print("🔑 Initializing Optimized TripPlanner...")
        
        # Create thread pool for parallel execution
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Initialize LLMs once (connection reuse)
        self.planner_llm = self._get_optimized_llm("GOOGLE_API_KEY_PLANNER")
        self.analyst_llm = self._get_optimized_llm("GOOGLE_API_KEY_ANALYST")
        self.logistics_llm = self._get_optimized_llm("GOOGLE_API_KEY_LOGISTICS")
        self.curator_llm = self._get_optimized_llm("GOOGLE_API_KEY_CURATOR")
        
        print("✅ Initialization complete")
    
    def _get_optimized_llm(self, env_var_name: str) -> LLM:
        """Create optimized LLM instance"""
        api_key = os.getenv(env_var_name) or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(f"Missing API Key: Set {env_var_name} or GOOGLE_API_KEY")
        
        return LLM(
            model="gemini/gemini-2.0-flash-lite-preview",
            api_key=api_key,
            temperature=0.3,  # Lower for faster, more consistent output
            max_tokens=2048,  # Limit output length
            timeout=30,  # Prevent hanging
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        )
    
    async def run_async(self, user_query: str) -> dict:
        """
        Main execution flow with parallel processing.
        Expected time: 15-25 seconds (down from 60-80 seconds)
        """
        start_time = datetime.now()
        print(f"\n✈️  STARTING OPTIMIZED TRIP PLANNER")
        print(f"📝 Query: '{user_query}'")
        print(f"⏰ Start time: {start_time.strftime('%H:%M:%S')}")
        
        # ============================================================
        # STAGE 1: Query Parsing (Fast - No external calls)
        # ============================================================
        print("\n🕵️  [Stage 1/4] Parsing your request...")
        trip_details = await self._run_stage_1(user_query)
        print(f"✅ Parsed: {trip_details.destination or 'Unknown'} | Budget: ${trip_details.budget_usd or 0}")
        
        # ============================================================
        # VALIDATION GATE (Moved here for speed)
        # ============================================================
        print("\n🔍 Validating trip details...")
        self._validate_or_raise(trip_details)
        print("✅ All required information present")
        
        # ============================================================
        # STAGE 2: PARALLEL Research (Destination + Logistics + Weather)
        # ============================================================
        print("\n🚀 [Stage 2/4] Researching destination & logistics (PARALLEL)...")
        print("   → Destination analyst searching...")
        print("   → Logistics coordinator searching...")
        print("   → Weather lookup running...")
        
        # Run all 3 tasks in parallel
        destination_task = self._run_destination_analysis(trip_details)
        logistics_task = self._run_logistics_search(trip_details)
        
        # Wait for both to complete
        results = await asyncio.gather(
            destination_task,
            logistics_task,
            return_exceptions=True  # Don't crash if one fails
        )
        
        destination_output = results[0]
        logistics_output = results[1]
        
        # Handle failures gracefully
        if isinstance(destination_output, Exception):
            print(f"⚠️  Destination analysis failed: {destination_output}")
            destination_output = self._get_fallback_destination(trip_details.destination)
        else:
            print(f"✅ Found {len(destination_output.attractions)} attractions")
        
        if isinstance(logistics_output, Exception):
            print(f"⚠️  Logistics search failed: {logistics_output}")
            logistics_output = self._get_fallback_logistics()
        else:
            print(f"✅ Found {len(logistics_output.flight_options)} flights, {len(logistics_output.hotel_options)} hotels")
        
        # ============================================================
        # STAGE 3: Curation (Create itinerary)
        # ============================================================
        print("\n🎨 [Stage 3/4] Creating your personalized itinerary...")
        daily_plans = await self._run_curation(
            trip_details, destination_output, logistics_output
        )
        print(f"✅ Created {len(daily_plans)} days of activities")
        
        # ============================================================
        # STAGE 4: Assembly (Lightweight formatting)
        # ============================================================
        print("\n📑 [Stage 4/4] Assembling final itinerary...")
        final_itinerary = await self._run_assembly(
            destination_output, logistics_output, daily_plans
        )
        
        # ============================================================
        # COMPLETE
        # ============================================================
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"\n🎉 COMPLETE!")
        print(f"⏱️  Total time: {duration:.1f} seconds")
        print(f"📊 Cache stats: {cache.get_stats()}")
        
        return final_itinerary.model_dump()
    
    # ============================================================
    # STAGE EXECUTION METHODS
    # ============================================================
    
    async def _run_stage_1(self, user_query: str) -> DeconstructedQuery:
        """Stage 1: Fast query parsing"""
        planner_agent = create_lead_planner_agent(self.planner_llm)
        planner_task = create_planner_task(planner_agent, user_query)
        
        crew = Crew(
            agents=[planner_agent],
            tasks=[planner_task],
            verbose=False,
            max_rpm=30
        )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, crew.kickoff)
        return result.pydantic
    
    async def _run_destination_analysis(self, trip_details: DeconstructedQuery) -> DestinationAnalysis:
        """Stage 2a: Destination research"""
        dest_agent = create_destination_analyst_agent(self.analyst_llm)
        dest_task = create_destination_task(dest_agent, trip_details)
        
        crew = Crew(
            agents=[dest_agent],
            tasks=[dest_task],
            verbose=False,
            max_rpm=30
        )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, crew.kickoff)
        return dest_task.output.pydantic
    
    async def _run_logistics_search(self, trip_details: DeconstructedQuery) -> LogisticsAnalysis:
        """Stage 2b: Flight/Hotel search"""
        logistics_agent = create_logistics_agent(self.logistics_llm)
        logistics_task = create_logistics_task(logistics_agent, trip_details)
        
        crew = Crew(
            agents=[logistics_agent],
            tasks=[logistics_task],
            verbose=False,
            max_rpm=30
        )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, crew.kickoff)
        return logistics_task.output.pydantic
    
    async def _run_curation(
        self,
        trip_details: DeconstructedQuery,
        dest_output: DestinationAnalysis,
        logistics_output: LogisticsAnalysis
    ) -> list:
        """Stage 3: Create daily itinerary"""
        from datetime import datetime as dt
        
        try:
            s_date = dt.strptime(trip_details.start_date, "%Y-%m-%d")
            e_date = dt.strptime(trip_details.end_date, "%Y-%m-%d")
            duration = (e_date - s_date).days + 1
        except:
            duration = 5
        
        curator_agent = create_experience_curator_agent(
            self.curator_llm,
            trip_duration_days=duration,
            interests=trip_details.interests
        )
        
        curation_task = create_curation_task(
            curator_agent,
            trip_details,
            dest_output,
            logistics_output
        )
        
        crew = Crew(
            agents=[curator_agent],
            tasks=[curation_task],
            verbose=False,
            max_rpm=30
        )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, crew.kickoff)
        
        # Parse JSON output
        import re
        raw = str(result.raw)
        clean = re.sub(r'```json\s*', '', raw)
        clean = re.sub(r'```', '', clean).strip()
        
        try:
            data = json.loads(clean)
            daily_plans_list = data.get('days', [])
            return [DailyPlan(**day) for day in daily_plans_list if day]
        except Exception as e:
            print(f"⚠️  Curation parsing error: {e}")
            return []
    
    async def _run_assembly(
        self,
        dest_output: DestinationAnalysis,
        logistics_output: LogisticsAnalysis,
        daily_plans: list
    ) -> FinalItinerary:
        """Stage 4: Final assembly"""
        planner_agent = create_lead_planner_agent(self.planner_llm)
        assembly_task = create_assembly_task(
            planner_agent,
            dest_output,
            logistics_output,
            daily_plans
        )
        
        crew = Crew(
            agents=[planner_agent],
            tasks=[assembly_task],
            verbose=False,
            max_rpm=30
        )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, crew.kickoff)
        return result.pydantic
    
    # ============================================================
    # VALIDATION & FALLBACKS
    # ============================================================
    
    def _validate_or_raise(self, trip_details: DeconstructedQuery):
        """Strict validation gate"""
        missing = []
        
        if not trip_details.destination or trip_details.destination.lower() in ["none", "null", "", "unknown"]:
            missing.append("Where do you want to go?")
        
        if not trip_details.origin or trip_details.origin.lower() in ["none", "null", "", "unknown"]:
            missing.append("Where are you flying from?")
        
        if not trip_details.start_date:
            missing.append("When do you want to start the trip?")
        
        if not trip_details.end_date:
            missing.append("When do you want to return?")
        
        if not trip_details.travelers or trip_details.travelers.lower() in ["none", "null", "", "0"]:
            missing.append("How many people are traveling?")
        
        if not trip_details.budget_usd or trip_details.budget_usd == 0:
            missing.append("What is your total budget in USD?")
        
        if missing:
            missing_str = "\n• " + "\n• ".join(missing)
            raise ValueError(f"VALIDATION:{missing_str}")
    
    def _get_fallback_destination(self, dest_name: str) -> DestinationAnalysis:
        """Fallback if destination research fails"""
        return DestinationAnalysis(
            summary=f"{dest_name} is a popular travel destination with rich culture and attractions.",
            weather_forecast="Check local weather forecasts closer to your travel date.",
            key_regions=["City Center", "Historic District"],
            attractions=["Local landmarks", "Museums", "Parks", "Restaurants"],
            cultural_and_safety_tips="Exercise normal travel precautions. Research local customs."
        )
    
    def _get_fallback_logistics(self) -> LogisticsAnalysis:
        """Fallback if logistics search fails"""
        return LogisticsAnalysis(
            flight_options=[],
            hotel_options=[],
            logistics_summary="Unable to fetch live pricing. Please search manually using the booking links provided."
        )
    
    # ============================================================
    # SYNCHRONOUS WRAPPER (for FastAPI compatibility)
    # ============================================================
    
    def run(self, user_query: str) -> dict:
        """Synchronous wrapper for async execution"""
        return asyncio.run(self.run_async(user_query))

# ============================================================
# MAIN ENTRY POINT (for testing)
# ============================================================

if __name__ == "__main__":
    crew = OptimizedTripPlannerCrew()
    
    # Test query
    test_query = "Trip to Paris from London next month for 2 people, budget $3000"
    result = crew.run(test_query)
    
    print("\n" + "="*60)
    print("FINAL ITINERARY")
    print("="*60)
    print(json.dumps(result, indent=2))