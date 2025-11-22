# src/tools/activity_tools.py
from crewai.tools import BaseTool
from langchain_community.tools import DuckDuckGoSearchRun

# Initialize the search tool
search_tool = DuckDuckGoSearchRun()

class FindActivitiesTool(BaseTool):
    name: str = "Activity Finder Tool"
    description: str = "Searches for activities and attractions based on destination and interests. Input should be a string like 'Cultural attractions in Rome'."

    def _run(self, query: str) -> str:
        """Searches for activities using DuckDuckGo."""
        print(f"[Activity Tool] Searching for: {query}")
        return search_tool.run(f"Top-rated {query}")

class FindRestaurantsTool(BaseTool):
    name: str = "Restaurant Finder Tool"
    description: str = "Searches for restaurants based on destination and culinary preferences. Input should be a string like 'Best pasta restaurants in Rome'."

    def _run(self, query: str) -> str:
        """Searches for restaurants using DuckDuckGo."""
        print(f"[Restaurant Tool] Searching for: {query}")
        return search_tool.run(f"Top-rated {query}")

class FindLocalToursTool(BaseTool):
    name: str = "Local Tours Finder Tool"
    description: str = "Searches for local tours and guided experiences. Input should be a string like 'Guided walking tours of the Colosseum'."

    def _run(self, query: str) -> str:
        """Searches for local tours using DuckDuckGo."""
        print(f"[Tours Tool] Searching for: {query}")
        return search_tool.run(f"Viator or GetYourGuide tours for {query}")

# Instantiate the tools for export
find_activities = FindActivitiesTool()
find_restaurants = FindRestaurantsTool()
find_local_tours = FindLocalToursTool()