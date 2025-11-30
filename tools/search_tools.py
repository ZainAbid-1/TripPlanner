# tools/search_tools.py
import os
import requests
from crewai.tools import BaseTool
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.cache_manager import cache

# =====================================================
# FAST WEB SEARCH (Serper API - Replace DuckDuckGo)
# =====================================================
class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "Fast web search using Serper API. Returns top relevant results."

    def _run(self, query: str) -> str:
        """Search the web with caching"""
        # Generate cache key
        cache_key = cache._generate_key("web_search", query)
        
        # Check cache first
        cached = cache.get(cache_key)
        if cached:
            print(f"[WebSearch] Cache HIT: {query}")
            return cached
        
        try:
            api_key = os.getenv("SERPER_API_KEY")
            if not api_key:
                print("[WebSearch] SERPER_API_KEY not found, using fallback")
                return self._fallback_search(query)
            
            print(f"[WebSearch] Querying: {query}")
            
            url = "https://google.serper.dev/search"
            headers = {
                "X-API-KEY": api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "q": query,
                "num": 5  # Only top 5 results
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract results
                results = []
                for item in data.get("organic", [])[:3]:
                    title = item.get("title", "")
                    snippet = item.get("snippet", "")
                    results.append(f"• {title}: {snippet}")
                
                output = "\n".join(results) if results else "No results found."
                
                # Cache for 6 hours
                cache.set(cache_key, output, ttl_hours=6)
                return output
            else:
                return self._fallback_search(query)
                
        except Exception as e:
            print(f"[WebSearch] Error: {e}")
            return self._fallback_search(query)
    
    def _fallback_search(self, query: str) -> str:
        """Fallback when API is unavailable"""
        return f"Web search for '{query}' - Please verify information independently."

# =====================================================
# OPTIMIZED WIKIPEDIA (Single Fast API Call)
# =====================================================
class WikipediaSearchTool(BaseTool):
    name: str = "wikipedia_search"
    description: str = "Fast Wikipedia lookup with caching. Returns article summary."

    def _run(self, title: str) -> str:
        """Fetch Wikipedia summary with aggressive caching"""
        # Generate cache key
        cache_key = cache._generate_key("wikipedia", title)
        
        # Check cache (Wikipedia data is very stable, cache for 1 week)
        cached = cache.get(cache_key)
        if cached:
            print(f"[Wikipedia] Cache HIT: {title}")
            return cached
        
        try:
            title_clean = title.replace(" ", "_")
            api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title_clean}"
            headers = {
                "User-Agent": "TripPlanner/2.0 (Educational)",
                "Accept": "application/json"
            }

            print(f"[Wikipedia] Fetching: {title_clean}")
            response = requests.get(api_url, headers=headers, timeout=5)

            if response.status_code == 200:
                data = response.json()
                extract = data.get("extract", "").strip()
                
                if extract:
                    # Cache for 1 week (Wikipedia data changes slowly)
                    cache.set(cache_key, extract, ttl_hours=168)
                    return extract
            
            # Fallback message
            fallback = f"Information about {title} is available on Wikipedia at: https://en.wikipedia.org/wiki/{title_clean}"
            cache.set(cache_key, fallback, ttl_hours=24)
            return fallback

        except Exception as e:
            print(f"[Wikipedia] Error: {e}")
            return f"Unable to fetch Wikipedia data for {title}."

# =====================================================
# FAST WEATHER LOOKUP (Reduced Timeout)
# =====================================================
class WeatherLookupTool(BaseTool):
    name: str = "weather_lookup"
    description: str = "Fetch current weather data using OpenWeather API."

    def _run(self, destination: str, start_date: str = None, end_date: str = None) -> str:
        """Get weather with caching"""
        # Generate cache key
        cache_key = cache._generate_key("weather", destination)
        
        # Check cache (weather data valid for 3 hours)
        cached = cache.get(cache_key)
        if cached:
            print(f"[Weather] Cache HIT: {destination}")
            return cached
        
        try:
            api_key = os.getenv("OPENWEATHER_API_KEY")
            if not api_key:
                return "[Weather] API key not configured. Check weather manually."
            
            city = destination.split(",")[0].strip()
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
            
            print(f"[Weather] Fetching: {city}")
            response = requests.get(url, timeout=3)  # Fast timeout
            
            if response.status_code == 200:
                data = response.json()
                
                if "weather" in data and "main" in data:
                    desc = data["weather"][0]["description"].capitalize()
                    temp = data["main"].get("temp")
                    feels_like = data["main"].get("feels_like")
                    humidity = data["main"].get("humidity")
                    
                    result = (
                        f"{city} weather: {desc}, {temp}°C "
                        f"(feels like {feels_like}°C), humidity {humidity}%. "
                        f"Pack accordingly for your trip."
                    )
                    
                    # Cache for 3 hours
                    cache.set(cache_key, result, ttl_hours=3)
                    return result
            
            return f"Weather data unavailable for {city}. Check local forecasts."
            
        except Exception as e:
            print(f"[Weather] Error: {e}")
            return f"Unable to fetch weather for {destination}."

# =====================================================
# STATIC SAFETY ADVISORY (No API Call)
# =====================================================
class SafetyAdvisoryTool(BaseTool):
    name: str = "safety_advisories"
    description: str = "Provides general travel safety information."

    def _run(self, destination: str) -> str:
        """Return generic but useful safety advice without API calls"""
        return (
            f"Safety tips for {destination}: "
            "1) Check your government's travel advisory website for current warnings. "
            "2) Register with your embassy if traveling internationally. "
            "3) Keep copies of important documents. "
            "4) Avoid displaying valuables. "
            "5) Stay aware of your surroundings. "
            "6) Use reputable transportation services. "
            "Exercise normal precautions and research local laws."
        )

# Export tools
web_search_tool = WebSearchTool()
wikipedia_tool = WikipediaSearchTool()
weather_tool = WeatherLookupTool()
safety_tool = SafetyAdvisoryTool()