import os
import requests
from crewai.tools import BaseTool
from typing import Dict, List
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.cache_manager import cache

load_dotenv()

# --- Constants ---
COMMON_IATA_CODES = {
    "lahore": "LHE", "jeddah": "JED", "karachi": "KHI", "islamabad": "ISB",
    "riyadh": "RUH", "dubai": "DXB", "london": "LON", "new york": "NYC",
    "paris": "PAR", "tokyo": "TYO", "istanbul": "IST", 
    "madinah": "MED", "medina": "MED", "makkah": "JED", "mecca": "JED", 
    "dammam": "DMM", "multan": "MUX", "sialkot": "SKT"
}

AIRLINE_MAP = {
    "XY": "Flynas", "SV": "Saudia", "PK": "PIA", "EK": "Emirates",
    "QR": "Qatar Airways", "FZ": "FlyDubai", "PA": "Airblue",
    "ER": "Serene Air", "PF": "Air Sial", "BA": "British Airways",
    "J9": "Jazeera Airways", "TK": "Turkish Airlines", "WY": "Oman Air"
}

def get_safe_date(date_str):
    if date_str and date_str.lower() != "none":
        return date_str
    today = datetime.now()
    days_ahead = (4 - today.weekday() + 7) % 7
    if days_ahead == 0: days_ahead = 7
    next_friday = today + timedelta(days=days_ahead)
    return next_friday.strftime("%Y-%m-%d")

# =====================================================
# AMADEUS API HELPER
# =====================================================
class AmadeusClient:
    def _init_(self):
        self.api_key = os.getenv("AMADEUS_API_KEY")
        self.api_secret = os.getenv("AMADEUS_API_SECRET")
        self.base_url = "https://test.api.amadeus.com" 
        self._token = None
        self._token_expiry = None

    def get_access_token(self) -> str:
        if self._token and self._token_expiry and datetime.now() < self._token_expiry: return self._token
        try:
            auth_url = f"{self.base_url}/v1/security/oauth2/token"
            auth_data = {"grant_type": "client_credentials", "client_id": self.api_key, "client_secret": self.api_secret}
            response = requests.post(auth_url, data=auth_data, timeout=30)
            if response.status_code != 200: return None
            data = response.json()
            self._token = data.get("access_token")
            expires_in = data.get("expires_in", 1800)
            self._token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)
            return self._token
        except: return None

    def get_iata_code(self, city_name: str) -> str:
        clean_name = city_name.lower().strip()
        if clean_name in COMMON_IATA_CODES: return COMMON_IATA_CODES[clean_name]
        try:
            token = self.get_access_token()
            if not token: return city_name[:3].upper()
            url = f"{self.base_url}/v1/reference-data/locations"
            headers = {"Authorization": f"Bearer {token}"}
            params = {"subType": "CITY", "keyword": city_name, "view": "LIGHT"}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json().get('data', [])
                if data: return data[0].get('iataCode')
            return city_name[:3].upper()
        except: return city_name[:3].upper()
    
    def search_flights(self, origin: str, destination: str, departure_date: str, adults: int = 1) -> Dict:
        try:
            token = self.get_access_token()
            if not token: return {"error": "Auth failed"}
            origin_code = self.get_iata_code(origin)
            dest_code = self.get_iata_code(destination)
            
            search_url = f"{self.base_url}/v2/shopping/flight-offers"
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "originLocationCode": origin_code, "destinationLocationCode": dest_code,
                "departureDate": departure_date, "adults": adults, "max": 10, "currencyCode": "USD"
            }
            response = requests.get(search_url, headers=headers, params=params, timeout=30)
            return response.json() if response.status_code == 200 else {"error": f"API {response.status_code}"}
        except Exception as e: return {"error": str(e)}

amadeus_client = AmadeusClient()

# =====================================================
# FLIGHT SEARCH TOOL (Generates Google Flights URLs)
# =====================================================
class FlightSearchTool(BaseTool):
    name: str = "Flight Search Tool"
    description: str = "Search for flights using Amadeus API."

    def _run(self, query: dict) -> dict:
        if 'query' in query and isinstance(query['query'], dict): query = query['query']
        
        origin = query.get('origin')
        destination = query.get('destination')
        raw_date = query.get('start_date')
        date = get_safe_date(raw_date)
        travelers = query.get('travelers', 1)

        print(f"[Flight] Request: {origin}->{destination} on {date}")
        if not origin or not destination: return {"error": "Missing params", "flight_options": []}

        # Generic Fallback Link
        base_link = f"https://www.google.com/travel/flights?q=Flights+from+{origin}+to+{destination}+on+{date}"
        
        cache_key = cache._generate_key("flights", origin, destination, date, travelers)
        if cache.get(cache_key): return cache.get(cache_key)

        if amadeus_client.api_key:
            api_result = amadeus_client.search_flights(origin, destination, date, int(travelers) if str(travelers).isdigit() else 1)
            
            if "data" in api_result and len(api_result["data"]) > 0:
                print(f"[DEBUG] Amadeus returned {len(api_result['data'])} flights")
                flight_options = self._parse_amadeus_response(api_result, origin, destination, date)
                result = {"flight_options": flight_options, "booking_url": base_link, "source": "Amadeus API"}
                cache.set(cache_key, result, ttl_hours=2)
                return result

        return {"flight_options": [], "booking_url": base_link, "source": "No Data Found"}
    
    def _parse_amadeus_response(self, data: dict, origin: str, dest: str, date: str) -> List[dict]:
        flights = []
        for offer in data.get("data", [])[:10]:
            try:
                price = float(offer.get("price", {}).get("total", 0))
                segments = offer.get("itineraries", [{}])[0].get("segments", [])
                if not segments: continue
                
                carrier_code = segments[0].get("carrierCode", "Unknown")
                airline_name = AIRLINE_MAP.get(carrier_code, f"{carrier_code} Airlines")
                
                # 🚀 GOOGLE FLIGHTS DEEP LINK (Specific Airline)
                # Format: https://www.google.com/travel/flights?q=Emirates+Flights+from+Lahore+to+Madinah+on+2025-12-05
                query_str = f"{airline_name} Flights from {origin} to {dest} on {date}"
                specific_url = f"https://www.google.com/travel/flights?q={query_str.replace(' ', '+')}"
                
                flights.append({
                    "airline": airline_name, "price_usd": int(price),
                    "duration_hours": 0.0, "stops": len(segments) - 1,
                    "booking_url": specific_url,
                    "departure_time": segments[0].get("departure", {}).get("at", "").split("T")[1][:5],
                    "arrival_time": segments[-1].get("arrival", {}).get("at", "").split("T")[1][:5]
                })
            except: continue
        return flights

# =====================================================
# HOTEL SEARCH TOOL (Fallback to Google Hotels)
# =====================================================
class HotelSearchTool(BaseTool):
    name: str = "Hotel Search Tool"
    description: str = "Search for hotels using Booking.com API."

    def _run(self, query: dict) -> dict:
        if 'query' in query and isinstance(query['query'], dict): query = query['query']
        
        destination = query.get('destination')
        raw_start = query.get('start_date')
        checkin = get_safe_date(raw_start)
        cin = datetime.strptime(checkin, "%Y-%m-%d")
        checkout = (cin + timedelta(days=1)).strftime("%Y-%m-%d")

        print(f"[Hotel] Request: {destination} ({checkin})")
        
        # 🚀 GOOGLE HOTELS DEEP LINK
        # Format: https://www.google.com/travel/hotels?q=hotels+in+Madinah
        google_hotels_link = f"https://www.google.com/travel/hotels?q=hotels+in+{destination.replace(' ', '+')}"
        
        # Check Cache
        cache_key = cache._generate_key("hotels", destination, checkin)
        if cache.get(cache_key): return cache.get(cache_key)

        rapidapi_key = os.getenv("RAPIDAPI_KEY")
        hotel_options = []

        if rapidapi_key:
            dest_info = self._get_destination_info(destination, rapidapi_key)
            if dest_info:
                # Attempt Search (Relaxed)
                api_result = self._search_booking_api(dest_info['dest_id'], dest_info['dest_type'], checkin, checkout, rapidapi_key)
                if api_result.get("result"):
                    hotel_options = self._parse_booking_response(api_result, destination)

        # 🚀 FALLBACK: Generate generic options pointing to Google Hotels
        if not hotel_options:
            print(f"[DEBUG] No hotels via API. Using Google Hotels Fallback.")
            hotel_options = [
                {
                    "name": f"View Hotels in {destination}",
                    "price_per_night_usd": 0,
                    "rating": 0,
                    "summary": f"Check live prices and availability for {destination} on Google Hotels.",
                    "address": "City Center",
                    "amenities": ["Click to View"],
                    "booking_url": google_hotels_link
                },
                {
                    "name": f"Top Rated in {destination}",
                    "price_per_night_usd": 0,
                    "rating": 5.0,
                    "summary": "See top-rated luxury and budget options.",
                    "address": "Popular Locations",
                    "amenities": ["Top Picks"],
                    "booking_url": google_hotels_link
                }
            ]
            
        result = {"hotel_options": hotel_options, "booking_url": google_hotels_link, "source": "Google Hotels Fallback"}
        cache.set(cache_key, result, ttl_hours=4)
        return result
    
    def _get_destination_info(self, city_name: str, api_key: str) -> dict:
        try:
            url = "https://booking-com.p.rapidapi.com/v1/hotels/locations"
            headers = {"X-RapidAPI-Key": api_key, "X-RapidAPI-Host": "booking-com.p.rapidapi.com"}
            res = requests.get(url, headers=headers, params={"name": city_name, "locale": "en-gb"}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for item in data:
                    if item.get("dest_type") == "city": return {"dest_id": item.get("dest_id"), "dest_type": item.get("dest_type")}
                if data: return {"dest_id": data[0].get("dest_id"), "dest_type": data[0].get("dest_type")}
            return None
        except: return None

    def _search_booking_api(self, dest_id: str, dest_type: str, checkin: str, checkout: str, api_key: str) -> dict:
        try:
            url = "https://booking-com.p.rapidapi.com/v1/hotels/search"
            headers = {"X-RapidAPI-Key": api_key, "X-RapidAPI-Host": "booking-com.p.rapidapi.com"}
            # Minimal Params to ensure results
            params = {"dest_id": dest_id, "dest_type": dest_type, "checkin_date": checkin, "checkout_date": checkout, "units": "metric", "sort_order": "popularity", "locale": "en-gb"}
            response = requests.get(url, headers=headers, params=params, timeout=15)
            return response.json() if response.status_code == 200 else {}
        except: return {}
    
    def _parse_booking_response(self, data: dict, destination_name: str) -> List[dict]:
        hotels = []
        results = data.get("result", [])
        for hotel in results[:6]:
            try:
                name = hotel.get("hotel_name", "Unknown Hotel")
                # Fallback to Google Hotels if booking link is messy
                link = f"https://www.google.com/travel/hotels?q={name.replace(' ', '+')}+{destination_name.replace(' ', '+')}"
                
                price_val = 0
                if "min_total_price" in hotel: price_val = hotel.get("min_total_price")
                elif "composite_price_breakdown" in hotel: price_val = hotel["composite_price_breakdown"].get("gross_amount", {}).get("value", 0)
                
                hotels.append({
                    "name": name, 
                    "price_per_night_usd": int(float(price_val)), 
                    "rating": float(hotel.get("review_score", 0) or 0),
                    "summary": f"Located in {hotel.get('city_trans', destination_name)}.",
                    "address": hotel.get("address", ""),
                    "amenities": ["WiFi", "AC"],
                    "booking_url": link
                })
            except: continue
        return hotels

search_flights = FlightSearchTool()
search_hotels = HotelSearchTool()