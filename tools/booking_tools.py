# tools/booking_tools.py
import os
import requests
from crewai.tools import BaseTool
from typing import Dict, List
import hashlib
from datetime import datetime, timedelta
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.cache_manager import cache

# IATA code mapping (expand as needed)
IATA_CODES = {
    "london": "LON", "new york": "NYC", "paris": "PAR", "tokyo": "TYO",
    "dubai": "DXB", "singapore": "SIN", "los angeles": "LAX", 
    "hong kong": "HKG", "sydney": "SYD", "bangkok": "BKK",
    "rome": "ROM", "barcelona": "BCN", "amsterdam": "AMS",
    "istanbul": "IST", "mumbai": "BOM", "delhi": "DEL",
    "toronto": "YTO", "chicago": "CHI", "miami": "MIA",
    "san francisco": "SFO", "seattle": "SEA", "boston": "BOS"
}

# =====================================================
# AMADEUS API HELPER
# =====================================================
class AmadeusClient:
    """Handles Amadeus API authentication and requests"""
    
    def __init__(self):
        self.api_key = os.getenv("AMADEUS_API_KEY")
        self.api_secret = os.getenv("AMADEUS_API_SECRET")
        self.base_url = "https://test.api.amadeus.com"  # Use production URL in prod
        self._token = None
        self._token_expiry = None
    
    def get_access_token(self) -> str:
        """Get or refresh access token"""
        # Check if we have a valid cached token
        if self._token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._token
        
        # Request new token
        try:
            auth_url = f"{self.base_url}/v1/security/oauth2/token"
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": self.api_key,
                "client_secret": self.api_secret
            }
            
            response = requests.post(auth_url, data=auth_data, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            self._token = data.get("access_token")
            # Token typically expires in 1800 seconds (30 minutes)
            expires_in = data.get("expires_in", 1800)
            self._token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)
            
            return self._token
        except Exception as e:
            print(f"[Amadeus] Token error: {e}")
            return None
    
    def search_flights(self, origin: str, destination: str, departure_date: str, adults: int = 1) -> Dict:
        """Search for flight offers"""
        try:
            token = self.get_access_token()
            if not token:
                return {"error": "Authentication failed"}
            
            # Convert city names to IATA codes
            origin_code = self._get_iata_code(origin)
            dest_code = self._get_iata_code(destination)
            
            search_url = f"{self.base_url}/v2/shopping/flight-offers"
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "originLocationCode": origin_code,
                "destinationLocationCode": dest_code,
                "departureDate": departure_date,
                "adults": adults,
                "max": 5,  # Get top 5 offers
                "currencyCode": "USD"
            }
            
            response = requests.get(search_url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API returned {response.status_code}"}
                
        except Exception as e:
            return {"error": str(e)}
    
    def _get_iata_code(self, city: str) -> str:
        """Convert city name to IATA code"""
        city_lower = city.lower().strip()
        return IATA_CODES.get(city_lower, city[:3].upper())

# Global Amadeus client
amadeus_client = AmadeusClient()

# =====================================================
# FLIGHT SEARCH TOOL (Amadeus API)
# =====================================================
class FlightSearchTool(BaseTool):
    name: str = "Flight Search Tool"
    description: str = "Search for flights using Amadeus API. Returns structured flight data."

    def _run(self, query: dict) -> dict:
        """
        Search for flights and return structured data.
        Returns dict with flight_options and booking_url.
        """
        # Handle nested query dict
        if 'query' in query and isinstance(query['query'], dict):
            query = query['query']

        origin = query.get('origin') or query.get('from')
        destination = query.get('destination') or query.get('to')
        date = query.get('start_date') or query.get('date')
        travelers = query.get('travelers', 1)

        if not origin or not destination:
            return {
                "error": "Missing origin or destination",
                "flight_options": [],
                "booking_url": None
            }

        # Parse travelers
        try:
            adults = int(travelers) if isinstance(travelers, (int, float)) else 1
        except:
            adults = 1

        # Generate cache key
        cache_key = cache._generate_key("flights", origin, destination, date, adults)
        
        # Check cache
        cached_result = cache.get(cache_key)
        if cached_result:
            print(f"[Flight] Cache HIT: {origin} → {destination}")
            return cached_result

        print(f"[Flight] Searching: {origin} → {destination} on {date}")

        # Generate Google Flights booking URL
        google_flights_url = (
            f"https://www.google.com/travel/flights?"
            f"q=Flights%20to%20{destination}%20from%20{origin}%20on%20{date}"
        )

        # Try Amadeus API
        if amadeus_client.api_key and amadeus_client.api_secret:
            api_result = amadeus_client.search_flights(origin, destination, date, adults)
            
            if "data" in api_result:
                # Parse Amadeus response
                flight_options = self._parse_amadeus_response(api_result)
                
                result = {
                    "flight_options": flight_options,
                    "booking_url": google_flights_url,
                    "source": "Amadeus API"
                }
                
                cache.set(cache_key, result, ttl_hours=2)
                return result

        # Fallback: Return estimated data
        fallback_options = self._generate_fallback_flights(origin, destination)
        
        result = {
            "flight_options": fallback_options,
            "booking_url": google_flights_url,
            "source": "Estimated (API unavailable)"
        }
        
        cache.set(cache_key, result, ttl_hours=1)
        return result
    
    def _parse_amadeus_response(self, data: dict) -> List[dict]:
        """Parse Amadeus API response into structured flight options"""
        flights = []
        
        for offer in data.get("data", [])[:5]:
            try:
                price = float(offer.get("price", {}).get("total", 0))
                itinerary = offer.get("itineraries", [{}])[0]
                segments = itinerary.get("segments", [])
                
                if not segments:
                    continue
                
                # Calculate duration (in hours)
                duration_str = itinerary.get("duration", "PT0H")
                duration_hours = self._parse_duration(duration_str)
                
                # Get carrier info
                first_segment = segments[0]
                airline_code = first_segment.get("carrierCode", "Unknown")
                
                # Count stops
                stops = len(segments) - 1
                
                # Get departure/arrival times
                departure = first_segment.get("departure", {})
                arrival = segments[-1].get("arrival", {})
                
                flights.append({
                    "airline": airline_code,
                    "price_usd": int(price),
                    "duration_hours": round(duration_hours, 1),
                    "stops": stops,
                    "departure_time": departure.get("at", ""),
                    "arrival_time": arrival.get("at", "")
                })
            except Exception as e:
                print(f"[Flight] Parse error: {e}")
                continue
        
        return flights
    
    def _parse_duration(self, duration_str: str) -> float:
        """Parse ISO 8601 duration (e.g., 'PT10H30M') to hours"""
        try:
            import re
            hours = re.search(r'(\d+)H', duration_str)
            minutes = re.search(r'(\d+)M', duration_str)
            
            total_hours = 0
            if hours:
                total_hours += int(hours.group(1))
            if minutes:
                total_hours += int(minutes.group(1)) / 60
            
            return total_hours
        except:
            return 0.0
    
    def _generate_fallback_flights(self, origin: str, destination: str) -> List[dict]:
        """Generate estimated flight data when API is unavailable"""
        # Simple distance-based pricing (very rough estimate)
        base_price = 300
        
        return [
            {
                "airline": "Multiple Airlines",
                "price_usd": base_price,
                "duration_hours": 8.0,
                "stops": 0,
                "departure_time": "09:00",
                "arrival_time": "17:00"
            },
            {
                "airline": "Economy Option",
                "price_usd": int(base_price * 0.8),
                "duration_hours": 10.0,
                "stops": 1,
                "departure_time": "14:00",
                "arrival_time": "00:00"
            }
        ]

# =====================================================
# HOTEL SEARCH TOOL (Booking.com via RapidAPI)
# =====================================================
class HotelSearchTool(BaseTool):
    name: str = "Hotel Search Tool"
    description: str = "Search for hotels using Booking.com API."

    def _run(self, query: dict) -> dict:
        """Search for hotels and return structured data"""
        if 'query' in query and isinstance(query['query'], dict):
            query = query['query']

        destination = query.get('destination')
        budget = query.get('budget_usd', 200)
        checkin = query.get('start_date')
        checkout = query.get('end_date')
        
        if not destination:
            return {
                "error": "Missing destination",
                "hotel_options": [],
                "booking_url": None
            }

        # Generate cache key
        cache_key = cache._generate_key("hotels", destination, budget, checkin)
        
        # Check cache
        cached_result = cache.get(cache_key)
        if cached_result:
            print(f"[Hotel] Cache HIT: {destination}")
            return cached_result

        print(f"[Hotel] Searching: {destination}, budget: ${budget}")

        # Generate Google Hotels booking URL
        google_hotels_url = f"https://www.google.com/travel/hotels?q=hotels%20in%20{destination}"

        # Try Booking.com API via RapidAPI
        rapidapi_key = os.getenv("RAPIDAPI_KEY")
        
        if rapidapi_key:
            api_result = self._search_booking_api(destination, checkin, checkout, budget, rapidapi_key)
            
            if api_result.get("hotel_options"):
                result = {
                    "hotel_options": api_result["hotel_options"],
                    "booking_url": google_hotels_url,
                    "source": "Booking.com API"
                }
                cache.set(cache_key, result, ttl_hours=4)
                return result

        # Fallback: Generate estimated hotels
        fallback_hotels = self._generate_fallback_hotels(destination, budget)
        
        result = {
            "hotel_options": fallback_hotels,
            "booking_url": google_hotels_url,
            "source": "Estimated (API unavailable)"
        }
        
        cache.set(cache_key, result, ttl_hours=2)
        return result
    
    def _search_booking_api(self, destination: str, checkin: str, checkout: str, budget: int, api_key: str) -> dict:
        """Search Booking.com via RapidAPI"""
        try:
            # Note: This is a simplified example. Real implementation needs destination_id lookup first
            url = "https://booking-com.p.rapidapi.com/v1/hotels/search"
            headers = {
                "X-RapidAPI-Key": api_key,
                "X-RapidAPI-Host": "booking-com.p.rapidapi.com"
            }
            params = {
                "dest_type": "city",
                "dest": destination,
                "adults_number": 2,
                "order_by": "popularity",
                "filter_by_currency": "USD",
                "room_number": 1,
                "checkout_date": checkout,
                "checkin_date": checkin,
                "units": "metric"
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=8)
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_booking_response(data, budget)
            
        except Exception as e:
            print(f"[Hotel] API error: {e}")
        
        return {"hotel_options": []}
    
    def _parse_booking_response(self, data: dict, budget: int) -> dict:
        """Parse Booking.com API response"""
        hotels = []
        
        for hotel in data.get("result", [])[:5]:
            try:
                name = hotel.get("hotel_name", "Unknown Hotel")
                price = hotel.get("min_total_price", 0) / hotel.get("checkin_checkout_dates_count", 1)
                rating = hotel.get("review_score", 0)
                address = hotel.get("address", "")
                
                # Filter by budget
                if price > budget * 1.5:  # Allow 50% over budget
                    continue
                
                hotels.append({
                    "name": name,
                    "price_per_night_usd": int(price),
                    "rating": round(rating, 1),
                    "summary": f"Located in {address[:50]}",
                    "address": address,
                    "amenities": ["WiFi", "Breakfast"]  # Would parse from API
                })
            except Exception as e:
                print(f"[Hotel] Parse error: {e}")
                continue
        
        return {"hotel_options": hotels}
    
    def _generate_fallback_hotels(self, destination: str, budget: int) -> List[dict]:
        """Generate estimated hotel data"""
        per_night_budget = budget // 5  # Assume 5 nights
        
        return [
            {
                "name": f"Budget Hotel in {destination}",
                "price_per_night_usd": int(per_night_budget * 0.3),
                "rating": 7.5,
                "summary": "Comfortable budget accommodation with essential amenities",
                "address": f"{destination} City Center",
                "amenities": ["WiFi", "Breakfast"]
            },
            {
                "name": f"Mid-Range Hotel in {destination}",
                "price_per_night_usd": int(per_night_budget * 0.6),
                "rating": 8.5,
                "summary": "Well-rated hotel with excellent location and facilities",
                "address": f"{destination} Downtown",
                "amenities": ["WiFi", "Breakfast", "Pool", "Gym"]
            },
            {
                "name": f"Premium Hotel in {destination}",
                "price_per_night_usd": int(per_night_budget * 0.9),
                "rating": 9.2,
                "summary": "Luxury accommodation with top-tier service",
                "address": f"{destination} Premium District",
                "amenities": ["WiFi", "Breakfast", "Pool", "Gym", "Spa"]
            }
        ]

# Export tools
search_flights = FlightSearchTool()
search_hotels = HotelSearchTool()