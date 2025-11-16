# tools/booking_tools.py

from crewai.tools import BaseTool
from langchain_community.tools import DuckDuckGoSearchRun

# Initialize DuckDuckGo
search = DuckDuckGoSearchRun()

# Flight Search Tool
class SearchFlightsTool(BaseTool):
    name: str = "Flight Search Tool"
    description: str = "Search for flight options. Input must follow DeconstructedQuery schema."
    def _run(self, query: dict) -> str:
        prompt = (
            f"Google Flights from {query['origin']} to {query['destination']} "
            f"from {query['start_date']} to {query['end_date']} for {query['travelers']}"
        )
        print(f"[Flight Tool] Query -> {prompt}")
        return search.run(prompt)

# Hotel Search Tool
class SearchHotelsTool(BaseTool):
    name: str = "Hotel Search Tool"
    description: str = "Search for hotel options. Input must follow DeconstructedQuery schema."

    def _run(self, query: dict) -> str:
        prompt = (
            f"Booking.com hotels in {query['destination']} for {query['travelers']}, "
            f"{query['start_date']} to {query['end_date']}, budget under {query['budget_usd']}"
        )
        print(f"[Hotel Tool] Query -> {prompt}")
        return search.run(prompt)

# Export instantiated tools
search_flights = SearchFlightsTool()
search_hotels = SearchHotelsTool()