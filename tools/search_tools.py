# TripPlanner/tools/search_tools.py
import os
import requests
from crewai.tools import BaseTool
from langchain_community.tools import DuckDuckGoSearchRun
from bs4 import BeautifulSoup

# Initialize DuckDuckGo
ddg_search = DuckDuckGoSearchRun()

# -------------------------
# 1) DuckDuckGo Search Tool
# -------------------------
class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "Searches the web using DuckDuckGo search engine. Returns relevant search results."

    def _run(self, query: str) -> str:
        try:
            print(f"[WebSearch] Searching for: {query}")
            result = ddg_search.run(query)
            if result and len(result.strip()) > 0:
                return result
            return "[NO RESULT] DuckDuckGo returned no results."
        except Exception as e:
            return f"[ERROR] DuckDuckGo search failed: {e}"

# ==========================================================
# 2) FIXED WIKIPEDIA TOOL (WORKS IN PAKISTAN + HAS SCRAPER)
# ==========================================================
class WikipediaSearchTool(BaseTool):
    name: str = "wikipedia_search"
    description: str = "Fetches summary from Wikipedia. Has REST API + HTML fallback."

    def _run(self, title: str) -> str:
        try:
            title_clean = title.replace(" ", "_")
            api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title_clean}"
            headers = {
                "User-Agent": "TripPlanner/1.0 (Educational Project)",
                "Accept": "application/json"
            }

            print(f"[Wikipedia] API Fetch: {title_clean}")
            r = requests.get(api_url, headers=headers, timeout=10)

            # -----------------------
            # REST API response OK
            # -----------------------
            if r.status_code == 200:
                try:
                    data = r.json()
                    extract = data.get("extract", "").strip()
                    if extract:
                        return extract
                except:
                    pass  # API responded but JSON failed → fall back

            # ========================================
            # Fallback #1: Try desktop HTML page scrape
            # ========================================
            page_url = f"https://en.wikipedia.org/wiki/{title_clean}"
            print(f"[Wikipedia] Fallback HTML scrape: {page_url}")
            r2 = requests.get(page_url, headers=headers, timeout=10)

            if r2.status_code == 200:
                soup = BeautifulSoup(r2.text, "lxml")

                p = soup.select_one("p")
                if p:
                    text = p.get_text().strip()
                    if len(text) > 30:
                        return text

            # ========================================
            # Fallback #2: Try searching the title
            # ========================================
            print("[Wikipedia] Fallback #2: Running DuckDuckGo location search")
            search_result = ddg_search.run(f"{title} wikipedia summary")
            if search_result:
                return search_result

            return "[NO RESULT] Wikipedia had no summary available."

        except Exception as e:
            return f"[ERROR] Wikipedia lookup failed: {str(e)}"


# -------------------------
# 3) OpenWeather Tool
# -------------------------
class WeatherLookupTool(BaseTool):
    name: str = "weather_lookup"
    description: str = "Fetches current weather for a destination using OpenWeather API."

    def _run(self, destination: str, start_date: str = None, end_date: str = None) -> str:
        try:
            api_key = os.getenv("OPENWEATHER_API_KEY")
            if not api_key:
                return "[ERROR] OPENWEATHER_API_KEY missing in .env"
            
            city = destination.split(",")[0].strip()
            q = requests.utils.quote(city)
            url = f"https://api.openweathermap.org/data/2.5/weather?q={q}&appid={api_key}&units=metric"
            
            print(f"[Weather] Fetching weather for: {city}")
            r = requests.get(url, timeout=10)
            data = r.json()
            
            if "weather" not in data or "main" not in data:
                return f"[NO RESULT] Could not fetch weather for {destination}"
            
            desc = data["weather"][0]["description"].capitalize()
            temp = data["main"].get("temp")
            feels_like = data["main"].get("feels_like")
            humidity = data["main"].get("humidity")
            
            return f"{city} weather: {desc}, {temp}°C (feels like {feels_like}°C), humidity {humidity}%."
        except Exception as e:
            return f"[ERROR] Weather lookup failed: {e}"

# -------------------------
# 4) Safety Advisory Tool
# -------------------------
class SafetyAdvisoryTool(BaseTool):
    name: str = "safety_advisories"
    description: str = "Provides general safety information for destination using Wikipedia."

    def _run(self, destination: str) -> str:
        try:
            city = destination.split(",")[0].strip()
            title = city.replace(" ", "_")

            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
            headers = {
                'User-Agent': 'TripPlanner/1.0 (Educational Project)',
                'Accept': 'application/json'
            }

            print(f"[Safety] Fetching safety info for: {city}")
            r = requests.get(url, headers=headers, timeout=10)

            if r.status_code != 200:
                return "General safety: Exercise normal travel precautions."

            data = r.json()
            extract = data.get("extract", "")
            return extract[:300] + ("..." if len(extract) > 300 else "")

        except:
            return "General safety: Exercise normal travel precautions."
