import os
import json
import asyncio
import re
import time
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
from utils.budget_analyzer import BudgetAnalyzer

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
        if not api_key or api_key == "YOUR_NEW_KEY_1" or api_key == "YOUR_NEW_KEY_2" or api_key == "YOUR_NEW_KEY_3" or api_key == "YOUR_NEW_KEY_4":
            raise ValueError(f"Missing or invalid API Key: Set {env_var_name} or GOOGLE_API_KEY with a valid key from https://aistudio.google.com/apikey")
        
        return LLM(
            model="gemini/gemini-robotics-er-1.5-preview", 
            api_key=api_key,
            temperature=0.3,
            max_tokens=4000,
            timeout=300, 
            max_retries=5,
            rpm=15
        )
    
    def _check_missing_info(self, query_data: DeconstructedQuery) -> dict:
        """Check what critical information is missing and return questions"""
        missing = {}
        
        # Check destination (CRITICAL - cannot proceed without it)
        if not query_data.destination or query_data.destination.strip() == "":
            missing["destination"] = {
                "question": "Where would you like to travel to? (e.g., Paris, Dubai, Tokyo)",
                "type": "text",
                "required": True,
                "priority": 1,
                "hint": "Please specify a city or country name"
            }
        
        # Check origin (IMPORTANT for flights - should ask)
        if not query_data.origin or query_data.origin.strip() == "":
            missing["origin"] = {
                "question": "Where are you traveling from?",
                "type": "text",
                "required": True,
                "priority": 2,
                "hint": "City name (e.g., Lahore, London, New York)"
            }
        
        # Check budget (IMPORTANT - should ask, don't assume)
        if not query_data.budget_usd or query_data.budget_usd < 100:
            missing["budget_usd"] = {
                "question": "What is your total budget for this trip in USD?",
                "type": "number",
                "required": True,
                "priority": 3,
                "hint": "Enter amount in USD (e.g., 1000, 2500, 5000)"
            }
        
        # Check dates (IMPORTANT - need to know when user wants to travel)
        if not query_data.start_date or query_data.start_date.strip() == "":
            missing["start_date"] = {
                "question": "When do you want to start your trip?",
                "type": "text",
                "required": True,
                "priority": 4,
                "hint": "e.g., 'next weekend', '2025-12-20', 'in 2 weeks'"
            }
        
        # Check duration (IMPORTANT - affects hotel and activities)
        if not query_data.end_date or query_data.end_date.strip() == "":
            missing["duration"] = {
                "question": "How many days will you be staying?",
                "type": "number",
                "required": True,
                "priority": 5,
                "hint": "Enter number of days (e.g., 3, 5, 7)"
            }
        
        # Check travelers (IMPORTANT for pricing and recommendations)
        if not query_data.travelers or query_data.travelers.strip() == "":
            missing["travelers"] = {
                "question": "How many people are traveling?",
                "type": "number",
                "required": True,
                "priority": 6,
                "hint": "Enter number of travelers (e.g., 1, 2, 4)"
            }
        
        return missing
    
    def _sanitize_and_patch_query(self, query_data: DeconstructedQuery, auto_fill: bool = True) -> DeconstructedQuery:
        """
        Sanitize and optionally auto-fill missing data
        
        Args:
            query_data: The parsed query
            auto_fill: If True, auto-fill missing data. If False, leave missing data as-is.
        """
        if not auto_fill:
            return query_data
            
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
        
        if not query_data.travelers:
            query_data.travelers = "1"
            
        return query_data
    
    def _update_query_with_answers(self, query_data: DeconstructedQuery, answers: dict) -> DeconstructedQuery:
        """Update the query data with user-provided answers"""
        if "destination" in answers and answers["destination"]:
            query_data.destination = str(answers["destination"]).strip()
        
        if "origin" in answers and answers["origin"]:
            query_data.origin = str(answers["origin"]).strip()
        
        if "start_date" in answers and answers["start_date"]:
            date_str = str(answers["start_date"]).strip().lower()
            if "next weekend" in date_str or date_str == "":
                today = datetime.now()
                days_ahead = (4 - today.weekday() + 7) % 7
                if days_ahead == 0: days_ahead = 7
                next_friday = today + timedelta(days=days_ahead)
                query_data.start_date = next_friday.strftime("%Y-%m-%d")
            elif "in" in date_str and ("week" in date_str or "day" in date_str):
                import re
                match = re.search(r'in (\d+) (week|day)', date_str)
                if match:
                    num = int(match.group(1))
                    unit = match.group(2)
                    days_to_add = num * 7 if unit == "week" else num
                    future_date = datetime.now() + timedelta(days=days_to_add)
                    query_data.start_date = future_date.strftime("%Y-%m-%d")
                else:
                    query_data.start_date = date_str
            else:
                query_data.start_date = date_str
        
        if "duration" in answers and answers["duration"]:
            try:
                days = int(answers["duration"])
                if days > 0 and query_data.start_date:
                    start = datetime.strptime(query_data.start_date, "%Y-%m-%d")
                    # Duration of N days means end_date = start_date + (N-1) days
                    # e.g., 5 days from Dec 12 = Dec 12, 13, 14, 15, 16 = end on Dec 16
                    end = start + timedelta(days=days - 1)
                    query_data.end_date = end.strftime("%Y-%m-%d")
                    print(f"✅ Calculated end_date from duration: {days} days → {query_data.end_date}")
            except Exception as e:
                print(f"⚠️ Failed to parse duration: {e}")
                pass
        
        if "budget_usd" in answers and answers["budget_usd"]:
            try:
                budget_val = str(answers["budget_usd"]).replace("$", "").replace(",", "").strip()
                query_data.budget_usd = int(float(budget_val))
            except:
                pass
        
        if "travelers" in answers and answers["travelers"]:
            query_data.travelers = str(int(answers["travelers"]))
        
        return query_data

    def _extract_duration_from_query(self, query: str, start_date: str = None) -> str:
        """
        Extract duration from query text using regex patterns
        Returns end_date as string in YYYY-MM-DD format, or None if not found
        """
        # Patterns: "for 5 days", "5-day trip", "5 day trip", etc.
        patterns = [
            r'for\s+(\d+)\s+days?',
            r'(\d+)-day',
            r'(\d+)\s+days?\s+trip'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query.lower())
            if match:
                days = int(match.group(1))
                if days > 0 and start_date:
                    try:
                        start = datetime.strptime(start_date, "%Y-%m-%d")
                        end = start + timedelta(days=days - 1)
                        print(f"✅ Python extracted duration from query: {days} days → end_date = {end.strftime('%Y-%m-%d')}")
                        return end.strftime("%Y-%m-%d")
                    except:
                        pass
        return None

    async def run_async(self, user_query: str, ask_if_missing: bool = True, additional_answers: dict = None) -> dict:
        """
        Main execution method
        
        Args:
            user_query: The user's trip request
            ask_if_missing: If True, return missing info questions instead of auto-filling
            additional_answers: Previously provided answers to missing info questions
        
        Returns:
            Either a complete itinerary dict OR a dict with "missing_info" key
        """
        start_time = datetime.now()
        print(f"\n✈️  STARTING OPTIMIZED TRIP PLANNER")
        print(f"📝 Query: '{user_query}'")
        
        # --- STAGE 1: PARSING ---
        print("\n🕵️  [Stage 1/4] Parsing your request...")
        try:
            trip_details_raw = await self._run_stage_1(user_query)
            
            print(f"🔍 DEBUG: start_date={trip_details_raw.start_date}, end_date='{trip_details_raw.end_date}'")
            
            # Python fallback: Extract duration from query if LLM missed it
            # Check for both None and empty string
            if trip_details_raw.start_date and (not trip_details_raw.end_date or trip_details_raw.end_date.strip() == ""):
                print(f"🔧 Attempting Python fallback to extract duration from query...")
                extracted_end_date = self._extract_duration_from_query(user_query, trip_details_raw.start_date)
                if extracted_end_date:
                    trip_details_raw.end_date = extracted_end_date
            
            # If we have additional answers from user, apply them first
            if additional_answers:
                print(f"📝 Applying user-provided answers: {list(additional_answers.keys())}")
                trip_details_raw = self._update_query_with_answers(trip_details_raw, additional_answers)
            
            # Check if critical info is missing
            missing_info = self._check_missing_info(trip_details_raw)
            
            # If asking is enabled and we have missing info, return questions
            if ask_if_missing and missing_info:
                print(f"❓ Missing information detected: {list(missing_info.keys())}")
                
                # Create a rephrased query suggestion with what we know so far
                rephrased_parts = []
                if trip_details_raw.destination:
                    rephrased_parts.append(f"to {trip_details_raw.destination}")
                if trip_details_raw.origin:
                    rephrased_parts.append(f"from {trip_details_raw.origin}")
                if trip_details_raw.start_date:
                    rephrased_parts.append(f"on {trip_details_raw.start_date}")
                if trip_details_raw.budget_usd and trip_details_raw.budget_usd >= 100:
                    rephrased_parts.append(f"budget ${trip_details_raw.budget_usd}")
                if trip_details_raw.travelers:
                    rephrased_parts.append(f"for {trip_details_raw.travelers} traveler(s)")
                
                suggested_query = "Trip " + " ".join(rephrased_parts) if rephrased_parts else user_query
                
                return {
                    "status": "needs_more_info",
                    "missing_info": missing_info,
                    "original_query": user_query,
                    "parsed_so_far": trip_details_raw.model_dump(),
                    "suggested_query": suggested_query
                }
            
            # Otherwise, auto-fill and continue
            trip_details = self._sanitize_and_patch_query(trip_details_raw, auto_fill=True)
            print(f"✅ Parsed & Patched: {trip_details.destination} | {trip_details.start_date} | ${trip_details.budget_usd}")
            self._validate_or_raise(trip_details)
        except Exception as e:
            print(f"❌ Stage 1 Failed: {e}")
            raise ValueError("Could not understand the trip request. Please be more specific.")

        # --- STAGE 2: RESEARCH ---
        print("\n🚀 [Stage 2/4] Researching destination & logistics (PARALLEL)...")
        
        # Add small delay to avoid rate limiting
        await asyncio.sleep(1)
        
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
        if not logistics_output.outbound_flight_options: logistics_output.outbound_flight_options = []
        if not logistics_output.return_flight_options: logistics_output.return_flight_options = []
        if not logistics_output.hotel_options: logistics_output.hotel_options = []
            
        # --- STAGE 3: CURATION ---
        print("\n🎨 [Stage 3/4] Creating your personalized itinerary...")
        
        # Add small delay to avoid rate limiting
        await asyncio.sleep(1)
        
        daily_plans = await self._run_curation(trip_details, destination_output, logistics_output)
        
        # --- STAGE 4: ASSEMBLY ---
        print("\n📑 [Stage 4/4] Assembling final itinerary...")
        
        # Add small delay to avoid rate limiting
        await asyncio.sleep(1)
        final_itinerary = await self._run_assembly(destination_output, logistics_output, daily_plans, trip_details)
        
        end_time = datetime.now()
        print(f"\n🎉 COMPLETE! Time: {(end_time - start_time).total_seconds():.1f}s")
        
        # ✅ CRITICAL: Convert to dict BEFORE returning (Pydantic serialization)
        result_dict = final_itinerary.model_dump()
        
        # ✅ Ensure all nested objects are serializable
        result_dict = self._sanitize_for_json(result_dict)
        
        return result_dict
    
    # ✅ NEW: Helper to ensure JSON serialization
    def _sanitize_for_json(self, obj):
        """Recursively remove non-serializable objects"""
        if isinstance(obj, dict):
            return {k: self._sanitize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._sanitize_for_json(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool, type(None))):
            return obj
        elif hasattr(obj, '__dict__'):
            # Convert objects to dict
            return self._sanitize_for_json(obj.__dict__)
        else:
            # Last resort: convert to string
            return str(obj)
    
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
        except: 
            days = 3

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
            daily_plans = [DailyPlan(**day) for day in data.get('days', [])]
            
            # ✅ VALIDATION: Check if activities mention wrong cities/attractions
            requested_dest = trip_details.destination.lower()
            wrong_attractions = {
                'eiffel tower': 'Paris',
                'louvre': 'Paris',
                'notre dame': 'Paris',
                'big ben': 'London',
                'tower bridge': 'London',
                'burj khalifa': 'Dubai',
                'statue of liberty': 'New York'
            }
            
            for day_plan in daily_plans:
                for activity in day_plan.activities:
                    activity_title = activity.get('title', '').lower() if isinstance(activity, dict) else getattr(activity, 'title', '').lower()
                    for wrong_attraction, city in wrong_attractions.items():
                        if wrong_attraction in activity_title and city.lower() not in requested_dest:
                            print(f"⚠️ WRONG ATTRACTION DETECTED: '{activity_title}' is from {city}, but user requested {trip_details.destination}")
                            print(f"🔧 This indicates LLM hallucination. Consider regenerating the itinerary.")
            
            return daily_plans
        except Exception as e:
            print(f"⚠️ Curation Failed: {e}. Generating fallback plan.")
            return [DailyPlan(day=1, title="Arrival", activities=[
                {"time": "14:00", "type": "Check-in", "title": "Hotel Check-in", "description": "Arrive and settle in.", "estimated_cost_usd": 0}
            ])]
            
    async def _run_assembly(self, dest_data, log_data, daily_plans, trip_details):
        agent = create_lead_planner_agent(self.planner_llm)
        task = create_assembly_task(agent, dest_data, log_data, daily_plans)
        crew = Crew(agents=[agent], tasks=[task], verbose=False)
        
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, crew.kickoff)
            itinerary = result.pydantic
            
            # ✅ VALIDATION: Check if destination matches
            requested_dest = trip_details.destination.lower()
            itinerary_dest = itinerary.destination.lower()
            
            # Check for common wrong cities that might appear
            wrong_cities = ['paris', 'london', 'dubai', 'tokyo', 'new york', 'rome']
            for wrong_city in wrong_cities:
                if wrong_city in itinerary_dest and wrong_city not in requested_dest:
                    print(f"⚠️ DESTINATION MISMATCH DETECTED: LLM generated '{itinerary.destination}' but user requested '{trip_details.destination}'")
                    print(f"🔧 Correcting destination to: {trip_details.destination}")
                    itinerary.destination = trip_details.destination
                    # Also fix trip_title if it contains wrong city
                    if wrong_city in itinerary.trip_title.lower():
                        itinerary.trip_title = f"Trip to {trip_details.destination}"
                        
        except Exception as e:
            print(f"⚠️ Assembly Failed: {e}. Generating safe fallback.")
            
            # Create Safe Dummy Flights if missing
            safe_flight = log_data.flight_options[0] if log_data.flight_options else FlightOption(
                airline="Check Online", 
                price_usd=0, 
                duration_hours=0, 
                stops=0, 
                booking_url="https://www.google.com/flights", 
                departure_time="TBA", 
                arrival_time="TBA"
            )
            
            safe_outbound = log_data.outbound_flight_options[0] if log_data.outbound_flight_options else safe_flight
            safe_return = log_data.return_flight_options[0] if log_data.return_flight_options else safe_flight
            
            # Create Safe Dummy Hotel if missing
            safe_hotel = log_data.hotel_options[0] if log_data.hotel_options else HotelOption(
                name="Check Local Availability", 
                price_per_night_usd=0, 
                rating=0, 
                summary="Details unavailable", 
                booking_url="https://www.booking.com", 
                address="City Center", 
                amenities=[]
            )

            itinerary = FinalItinerary(
                trip_title=f"Trip to {dest_data.key_regions[0] if dest_data.key_regions else 'Destination'}",
                destination=dest_data.key_regions[0] if dest_data.key_regions else "Your Destination",
                trip_summary="Here is your generated itinerary based on available data.",
                chosen_flight=safe_flight,
                chosen_outbound_flight=safe_outbound,
                chosen_return_flight=safe_return,
                chosen_hotel=safe_hotel,
                all_flights=log_data.flight_options or [],
                all_outbound_flights=log_data.outbound_flight_options or [],
                all_return_flights=log_data.return_flight_options or [],
                all_hotels=log_data.hotel_options or [],
                budget_overview="Estimated based on typical costs.",
                daily_plans=daily_plans or [],
                total_estimated_cost=0
            )
        
        # ✅ BUDGET ANALYSIS
        try:
            flight_cost = itinerary.chosen_flight.price_usd if itinerary.chosen_flight else 0
            hotel_per_night = itinerary.chosen_hotel.price_per_night_usd if itinerary.chosen_hotel else 0
            trip_duration = len(daily_plans)
            hotel_total = hotel_per_night * trip_duration
            
            # Calculate activities cost from daily plans
            activities_cost = 0
            for day_plan in daily_plans:
                if hasattr(day_plan, 'activities'):
                    for activity in day_plan.activities:
                        if isinstance(activity, dict):
                            activities_cost += activity.get('estimated_cost_usd', 0)
                        elif hasattr(activity, 'estimated_cost_usd'):
                            activities_cost += activity.estimated_cost_usd
            
            # Perform budget analysis
            budget_analysis = BudgetAnalyzer.analyze_budget(
                user_budget=trip_details.budget_usd,
                trip_duration_days=trip_duration,
                flight_cost=flight_cost,
                hotel_cost=hotel_total,
                activities_cost=activities_cost
            )
            
            # Update budget_overview with analysis
            budget_message = BudgetAnalyzer.get_budget_message_for_itinerary(budget_analysis)
            recommendations_text = "\n".join(budget_analysis["recommendations"][:3])
            
            itinerary.budget_overview = f"{budget_message}\n\n**Budget Breakdown:**\n" \
                                       f"- Flights: ${flight_cost:,.0f}\n" \
                                       f"- Accommodation: ${hotel_total:,.0f}\n" \
                                       f"- Activities: ${activities_cost:,.0f}\n" \
                                       f"- Daily Expenses Budget: ${budget_analysis['daily_remaining']:,.0f}/day\n\n" \
                                       f"**Recommendations:**\n{recommendations_text}"
            
            # Update total cost
            itinerary.total_estimated_cost = int(budget_analysis['breakdown']['total'])
            
            print(f"💰 Budget Analysis: {budget_analysis['tier_label']} ({budget_analysis['utilization_percent']}% utilization)")
            
        except Exception as budget_error:
            print(f"⚠️ Budget analysis failed: {budget_error}")
            # Keep original budget_overview if analysis fails
        
        return itinerary

    def _validate_or_raise(self, trip_details):
        missing = []
        if not trip_details.destination: 
            missing.append("Destination")
        if not trip_details.start_date: 
            missing.append("Start Date")
        if missing: 
            raise ValueError(f"VALIDATION: Missing {', '.join(missing)}")
            
    def _get_fallback_destination(self, dest):
        return DestinationAnalysis(
            summary=f"Welcome to {dest}. A wonderful place to visit.", 
            weather_forecast="Please check local forecasts.",
            attractions=["City Center", "Local Museum", "Central Park"]
        )
        
    def _get_fallback_logistics(self):
        return LogisticsAnalysis(flight_options=[], hotel_options=[])

    def run(self, user_query: str, ask_if_missing: bool = True, additional_answers: dict = None) -> dict:
        """Synchronous wrapper for run_async"""
        return asyncio.run(self.run_async(user_query, ask_if_missing, additional_answers))

if __name__ == "__main__":
    crew = OptimizedTripPlannerCrew()
    result = crew.run("Trip to Dubai next weekend")
    print(json.dumps(result, indent=2))