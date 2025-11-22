# src/tools/booking_tools.py
import os
import json
from crewai.tools import BaseTool
from crewai_tools import SerperDevTool

tool = SerperDevTool()

class SearchFlightsTool(BaseTool):
    name: str = "Flight Search Tool"
    description: str = "Search for flight prices. Input: {origin, destination, start_date}."

    def _run(self, query: dict) -> str:
        if 'query' in query and isinstance(query['query'], dict):
            query = query['query']

        origin = query.get('origin') or query.get('from')
        destination = query.get('destination') or query.get('to')
        date = query.get('start_date') or query.get('date')

        if not origin or not destination:
            return "Error: Missing Origin or Destination."

        search_query = f"flights from {origin} to {destination} on {date}"
        
        # 1. Generate the Deep Link
        google_flights_url = f"https://www.google.com/travel/flights?q=Flights%20to%20{destination}%20from%20{origin}%20on%20{date}"
        
        print(f"[Flight Tool] Searching -> {search_query}")
        
        try:
            raw_result = tool.run(search_query=search_query)
            
            # Clean output logic
            if isinstance(raw_result, str):
                try:
                    data = json.loads(raw_result.replace("'", '"'))
                except:
                    data = {}
            else:
                data = raw_result

            results = data.get('organic', [])[:4]
            clean_results = []
            for r in results:
                clean_results.append(f"- Airline/Option: {r.get('title')}\n  Price/Details: {r.get('snippet')}")

            output_text = "\n".join(clean_results)
            
            # 2. Return Link at the TOP
            return f"""
            !!! IMPORTANT: USE THIS BOOKING LINK FOR ALL FLIGHTS !!!
            URL: {google_flights_url}
            
            FLIGHT DETAILS FOUND:
            {output_text}
            """
        except Exception as e:
            return f"Error: {str(e)}"

class SearchHotelsTool(BaseTool):
    name: str = "Hotel Search Tool"
    description: str = "Search for hotel prices. Input: {destination, start_date, budget_usd}."

    def _run(self, query: dict) -> str:
        if 'query' in query and isinstance(query['query'], dict):
            query = query['query']

        destination = query.get('destination')
        budget = query.get('budget_usd', '200')
        
        search_query = f"hotels in {destination} under ${budget}"
        google_hotels_url = f"https://www.google.com/travel/hotels?q=hotels%20in%20{destination}"
        
        print(f"[Hotel Tool] Searching -> {search_query}")
        
        try:
            raw_result = tool.run(search_query=search_query)
            
            if isinstance(raw_result, str):
                try:
                    data = json.loads(raw_result.replace("'", '"'))
                except:
                    data = {}
            else:
                data = raw_result

            results = data.get('organic', [])[:4]
            clean_results = []
            for r in results:
                clean_results.append(f"- Hotel: {r.get('title')}\n  Details: {r.get('snippet')}")

            output_text = "\n".join(clean_results)

            return f"""
            !!! IMPORTANT: USE THIS BOOKING LINK FOR ALL HOTELS !!!
            URL: {google_hotels_url}
            
            HOTEL DETAILS FOUND:
            {output_text}
            """
        except Exception as e:
            return f"Error: {str(e)}"

# Export
search_flights = SearchFlightsTool()
search_hotels = SearchHotelsTool()