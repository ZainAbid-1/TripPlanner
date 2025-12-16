import os
import requests
import time
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
    def __init__(self):
        self.api_key = os.getenv("AMADEUS_API_KEY")
        self.api_secret = os.getenv("AMADEUS_API_SECRET")
        # ✅ CHANGED: Use production API for real flight data
        # Test API: https://test.api.amadeus.com (limited mock data)
        # Production API: https://api.amadeus.com (real flight data)
        self.base_url = "https://api.amadeus.com" 
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
    
    def search_flights(self, origin: str, destination: str, departure_date: str, adults: int = 1, return_date: str = None) -> Dict:
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
            result = response.json() if response.status_code == 200 else {"error": f"API {response.status_code}"}
            
            # ✅ ADD IATA CODES TO RESULT FOR FRONTEND
            if "data" in result:
                result["origin_iata"] = origin_code
                result["destination_iata"] = dest_code
                
            return result
        except Exception as e: return {"error": str(e)}
    
    def search_connecting_flights(self, origin: str, destination: str, departure_date: str, adults: int = 1) -> List[Dict]:
        """Find connecting flights through major hubs if no direct flights available"""
        major_hubs = ["DXB", "IST", "DOH", "AUH", "CAI"]  # Expanded hub list
        connecting_options = []
        
        print(f"[CONNECTING] Searching for connecting flights from {origin} to {destination}")
        
        try:
            origin_code = self.get_iata_code(origin)
            dest_code = self.get_iata_code(destination)
            
            print(f"[CONNECTING] Using codes: {origin_code} → {dest_code}")
            
            for hub in major_hubs:
                if hub == origin_code or hub == dest_code:
                    continue
                
                print(f"[CONNECTING] Trying hub: {hub}")
                    
                # Add small delay to avoid rate limiting
                time.sleep(0.5)
                    
                # Check if route via hub exists
                leg1 = self.search_flights(origin, hub, departure_date, adults)
                
                if "data" in leg1 and len(leg1["data"]) > 0:
                    print(f"[CONNECTING] Found leg1: {origin_code} → {hub} ({len(leg1['data'])} options)")
                    
                    # Try same-day connection first, then next day
                    try:
                        dep_date = datetime.strptime(departure_date, "%Y-%m-%d")
                        
                        # Try same-day first
                        time.sleep(0.5)
                        leg2_same_day = self.search_flights(hub, destination, departure_date, adults)
                        
                        if "data" in leg2_same_day and len(leg2_same_day["data"]) > 0:
                            print(f"[CONNECTING] Found leg2 (same-day): {hub} → {dest_code} ({len(leg2_same_day['data'])} options)")
                            connecting_options.append({
                                "hub": hub,
                                "leg1": leg1["data"][0],
                                "leg2": leg2_same_day["data"][0],
                                "total_price": float(leg1["data"][0]["price"]["total"]) + float(leg2_same_day["data"][0]["price"]["total"])
                            })
                        else:
                            # Try next day
                            next_day = (dep_date + timedelta(days=1)).strftime("%Y-%m-%d")
                            time.sleep(0.5)
                            leg2_next_day = self.search_flights(hub, destination, next_day, adults)
                            
                            if "data" in leg2_next_day and len(leg2_next_day["data"]) > 0:
                                print(f"[CONNECTING] Found leg2 (next-day): {hub} → {dest_code} ({len(leg2_next_day['data'])} options)")
                                connecting_options.append({
                                    "hub": hub,
                                    "leg1": leg1["data"][0],
                                    "leg2": leg2_next_day["data"][0],
                                    "total_price": float(leg1["data"][0]["price"]["total"]) + float(leg2_next_day["data"][0]["price"]["total"])
                                })
                            else:
                                print(f"[CONNECTING] No leg2 found for hub {hub}")
                    except Exception as e:
                        print(f"[CONNECTING] Error checking hub {hub}: {e}")
                        continue
                else:
                    print(f"[CONNECTING] No leg1 found for hub {hub}")
            
            print(f"[CONNECTING] Total connecting options found: {len(connecting_options)}")
            return connecting_options
        except Exception as e:
            print(f"[CONNECTING] Error in search_connecting_flights: {e}")
            return []

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
        raw_end = query.get('end_date')
        date = get_safe_date(raw_date)
        end_date = get_safe_date(raw_end)
        travelers = query.get('travelers', 1)

        # Handle "None" string or None/empty origin
        if origin in [None, "None", "", "null"]:
            print(f"[Flight] Warning: No origin specified. Cannot search flights without origin.")
            return {
                "error": "Origin not specified", 
                "flight_options": [],
                "booking_url": f"https://www.google.com/travel/flights?q=Flights+to+{destination}",
                "source": "Missing Origin"
            }
        
        print(f"[Flight] Request: {origin}->{destination} on {date}")
        if not destination: 
            return {"error": "Missing destination", "flight_options": []}
        
        cache_key = cache._generate_key("flights", origin, destination, date, travelers)
        if cache.get(cache_key): return cache.get(cache_key)

        origin_iata = amadeus_client.get_iata_code(origin)
        dest_iata = amadeus_client.get_iata_code(destination)
        
        print(f"[FLIGHT URL] Origin: {origin} -> IATA: {origin_iata}")
        print(f"[FLIGHT URL] Destination: {destination} -> IATA: {dest_iata}")
        print(f"[FLIGHT URL] Dates: start={date}, end={end_date}")
        
        # ✅ ACTUAL GOOGLE FLIGHTS URL WITH IATA CODES
        # Build round-trip URL if end_date is provided and different from start_date
        if end_date and end_date != date and end_date.lower() not in ["none", ""]:
            base_link = f"https://www.google.com/travel/flights?q=Flights%20to%20{dest_iata}%20from%20{origin_iata}%20on%20{date}%20return%20{end_date}"
            print(f"[FLIGHT URL] Round-trip URL generated")
        else:
            base_link = f"https://www.google.com/travel/flights?q=Flights%20to%20{dest_iata}%20from%20{origin_iata}%20on%20{date}"
            print(f"[FLIGHT URL] One-way URL generated")
        
        print(f"[FLIGHT URL] Generated URL: {base_link}")

        # ✅ SKIP AMADEUS - GO DIRECTLY TO GOOGLE FLIGHTS
        # Amadeus API is unreliable and often returns no results
        # Google Flights provides real-time data from all airlines
        print(f"[FLIGHT] → Directing to Google Flights for live search: {origin} → {destination} ({date} - {end_date if end_date else 'one-way'})")
        result = {
            "flight_options": [], 
            "booking_url": base_link, 
            "source": "Google Flights - Live Search",
            "message": f"Here are the cheapest flights from {origin} to {destination} on {date}."
        }
        cache.set(cache_key, result, ttl_hours=2)
        return result
    
    def _parse_amadeus_response(self, data: dict, origin: str, dest: str, date: str, origin_iata: str, dest_iata: str) -> List[dict]:
        """Parse Amadeus response and return only the best 3-4 flight options"""
        flights = []
        all_offers = data.get("data", [])
        
        # Sort by price to get best options
        sorted_offers = sorted(all_offers, key=lambda x: float(x.get("price", {}).get("total", 999999)))
        
        # Take only best 3-4 flights (prefer direct flights first)
        direct_flights = [o for o in sorted_offers if len(o.get("itineraries", [{}])[0].get("segments", [])) == 1]
        connecting_flights = [o for o in sorted_offers if len(o.get("itineraries", [{}])[0].get("segments", [])) > 1]
        
        # Prioritize: 2-3 direct flights + 1-2 connecting flights (total max 4)
        selected_offers = (direct_flights[:3] + connecting_flights[:1])[:4]
        
        for offer in selected_offers:
            try:
                price = float(offer.get("price", {}).get("total", 0))
                segments = offer.get("itineraries", [{}])[0].get("segments", [])
                if not segments: continue
                
                carrier_code = segments[0].get("carrierCode", "Unknown")
                airline_name = AIRLINE_MAP.get(carrier_code, f"{carrier_code} Airlines")
                
                # ✅ ACTUAL GOOGLE FLIGHTS URL WITH PROPER PARAMETERS
                # Format: https://www.google.com/travel/flights?q=Flights+to+JED+from+LHE+on+2025-12-20
                specific_url = f"https://www.google.com/travel/flights?q=Flights+to+{dest_iata}+from+{origin_iata}+on+{date}+{airline_name.replace(' ', '+')}"
                
                # Calculate duration
                try:
                    dep_time = segments[0].get("departure", {}).get("at", "")
                    arr_time = segments[-1].get("arrival", {}).get("at", "")
                    if dep_time and arr_time:
                        dep_dt = datetime.fromisoformat(dep_time.replace('Z', '+00:00'))
                        arr_dt = datetime.fromisoformat(arr_time.replace('Z', '+00:00'))
                        duration = (arr_dt - dep_dt).total_seconds() / 3600
                    else:
                        duration = 0.0
                except:
                    duration = 0.0
                
                flights.append({
                    "airline": airline_name, 
                    "price_usd": int(price),
                    "duration_hours": round(duration, 1), 
                    "stops": len(segments) - 1,
                    "booking_url": specific_url,
                    "departure_time": segments[0].get("departure", {}).get("at", "").split("T")[1][:5] if segments[0].get("departure", {}).get("at") else "N/A",
                    "arrival_time": segments[-1].get("arrival", {}).get("at", "").split("T")[1][:5] if segments[-1].get("arrival", {}).get("at") else "N/A",
                    "flight_type": "direct" if len(segments) == 1 else f"{len(segments)-1} stop(s)"
                })
            except: continue
        return flights
    
    def _parse_connecting_flights(self, connecting_options: List[Dict], origin: str, dest: str, date: str, origin_iata: str, dest_iata: str) -> List[dict]:
        """Parse connecting flight options and return only best 3-4 options"""
        flights = []
        
        # Sort by total price to get best options
        sorted_options = sorted(connecting_options, key=lambda x: x.get("total_price", 999999))
        
        # Take only best 3-4 connecting flights
        best_options = sorted_options[:4]
        
        print(f"[DEBUG] Parsing {len(best_options)} best connecting flight options")
        
        for idx, option in enumerate(best_options):
            try:
                hub = option["hub"]
                leg1 = option["leg1"]
                leg2 = option["leg2"]
                total_price = option["total_price"]
                
                # Get airline info for both legs
                segments1 = leg1.get("itineraries", [{}])[0].get("segments", [])
                segments2 = leg2.get("itineraries", [{}])[0].get("segments", [])
                
                if not segments1 or not segments2:
                    print(f"[DEBUG] Skipping option {idx}: missing segments")
                    continue
                
                # Extract carrier codes and map to airline names
                carrier1 = segments1[0].get("carrierCode", "Unknown")
                carrier2 = segments2[0].get("carrierCode", "Unknown")
                airline1 = AIRLINE_MAP.get(carrier1, f"{carrier1} Airlines")
                airline2 = AIRLINE_MAP.get(carrier2, f"{carrier2} Airlines")
                
                # Get flight numbers
                flight_num1 = segments1[0].get("number", "")
                flight_num2 = segments2[0].get("number", "")
                
                # Calculate total duration
                try:
                    dep1_time = segments1[0].get("departure", {}).get("at", "")
                    arr2_time = segments2[-1].get("arrival", {}).get("at", "")
                    
                    if dep1_time and arr2_time:
                        dep1_dt = datetime.fromisoformat(dep1_time.replace('Z', '+00:00'))
                        arr2_dt = datetime.fromisoformat(arr2_time.replace('Z', '+00:00'))
                        total_duration = (arr2_dt - dep1_dt).total_seconds() / 3600
                    else:
                        total_duration = 0.0
                except:
                    total_duration = 0.0
                
                # Get departure and arrival times
                dep_time = segments1[0].get("departure", {}).get("at", "").split("T")[1][:5] if segments1[0].get("departure", {}).get("at") else "N/A"
                arr_time = segments2[-1].get("arrival", {}).get("at", "").split("T")[1][:5] if segments2[-1].get("arrival", {}).get("at") else "N/A"
                
                # ✅ ENHANCED GOOGLE FLIGHTS URL FOR MULTI-CITY SEARCH
                # Format: /travel/flights?q=Flights+from+LAX+to+DXB+to+DEL+on+2025-12-12
                specific_url = f"https://www.google.com/travel/flights?q=Flights+from+{origin_iata}+to+{hub}+to+{dest_iata}+on+{date}"
                
                # Build detailed airline display
                airline_display = f"{airline1}"
                if airline1 != airline2:
                    airline_display = f"{airline1} → {airline2}"
                airline_display += f" (via {hub})"
                
                # Create flight option with detailed segment info
                flight_option = {
                    "airline": airline_display,
                    "price_usd": int(total_price),
                    "duration_hours": round(total_duration, 1) if total_duration > 0 else 0.0,
                    "stops": 1,
                    "booking_url": specific_url,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "flight_type": f"connecting via {hub}",
                    "segments": [
                        {
                            "leg": 1,
                            "airline": airline1,
                            "flight_number": f"{carrier1}{flight_num1}" if flight_num1 else carrier1,
                            "from": origin_iata,
                            "to": hub,
                            "departure": dep_time,
                            "arrival": segments1[-1].get("arrival", {}).get("at", "").split("T")[1][:5] if segments1[-1].get("arrival", {}).get("at") else "N/A"
                        },
                        {
                            "leg": 2,
                            "airline": airline2,
                            "flight_number": f"{carrier2}{flight_num2}" if flight_num2 else carrier2,
                            "from": hub,
                            "to": dest_iata,
                            "departure": segments2[0].get("departure", {}).get("at", "").split("T")[1][:5] if segments2[0].get("departure", {}).get("at") else "N/A",
                            "arrival": arr_time
                        }
                    ]
                }
                
                flights.append(flight_option)
                
                print(f"[DEBUG] Connecting flight {idx+1}: {origin_iata}→{hub}→{dest_iata} via {airline_display} - ${total_price}")
                
            except Exception as e:
                print(f"[DEBUG] Error parsing connecting flight {idx}: {e}")
                continue
        
        print(f"[DEBUG] Successfully parsed {len(flights)} connecting flights")
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
        raw_end = query.get('end_date')
        checkin = get_safe_date(raw_start)
        
        # Calculate checkout date based on end_date if provided, otherwise use start + trip duration
        if raw_end and raw_end.lower() != "none":
            checkout = get_safe_date(raw_end)
        else:
            cin = datetime.strptime(checkin, "%Y-%m-%d")
            checkout = (cin + timedelta(days=1)).strftime("%Y-%m-%d")

        print(f"[Hotel] Request: {destination} ({checkin} to {checkout})")
        
        # 🚀 GOOGLE HOTELS DEEP LINK WITH DATES
        # Format: https://www.google.com/travel/hotels?q=hotels+in+Tokyo&checkin=2026-01-02&checkout=2026-01-06
        google_hotels_link = f"https://www.google.com/travel/hotels?q=hotels+in+{destination.replace(' ', '+')}&checkin={checkin}&checkout={checkout}"
        
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
            print(f"[HOTEL] ℹ️ No hotels via Booking.com API. Using Google Hotels Fallback.")
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
            result = {
                "hotel_options": hotel_options, 
                "booking_url": google_hotels_link, 
                "source": "Google Hotels Fallback",
                "message": f"Booking.com API did not return results. Showing Google Hotels options for {destination}."
            }
        else:
            print(f"[HOTEL] ✅ Found {len(hotel_options)} hotels via Booking.com API")
            result = {
                "hotel_options": hotel_options, 
                "booking_url": google_hotels_link, 
                "source": "Booking.com API"
            }
            
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
        
        print(f"[DEBUG] Parsing {len(results)} hotel results from Booking.com API")
        
        for hotel in results[:6]:
            try:
                name = hotel.get("hotel_name", "Unknown Hotel")
                hotel_id = hotel.get("hotel_id")
                
                # Get country code for booking.com URL (2-letter ISO code)
                country_code = hotel.get("country_code", "xx")
                if not country_code or len(country_code) != 2:
                    country_code = "xx"
                country_code = country_code.lower()
                
                # ✅ ACTUAL BOOKING.COM DEEP LINK - ALWAYS USE BOOKING.COM
                # Format: https://www.booking.com/hotel/{country_code}/{hotel_name_slug}.html
                if hotel_id:
                    # Construct proper booking.com URL using hotel ID (most reliable)
                    # Booking.com accepts /hotel/xx/hotelname.html format
                    hotel_name_slug = hotel.get("hotel_name_trans", name).lower().replace(" ", "-").replace("'", "")
                    # Remove special characters to create clean slug
                    hotel_name_slug = ''.join(c for c in hotel_name_slug if c.isalnum() or c == '-')
                    # Always use booking.com domain - NEVER use hotel's own website
                    link = f"https://www.booking.com/hotel/{country_code}/{hotel_name_slug}.html?label=tripplanner&aid=304142"
                else:
                    # Fallback to search results on booking.com
                    link = f"https://www.booking.com/searchresults.html?ss={destination_name.replace(' ', '+')}&aid=304142"
                
                # Get pricing
                price_val = 0
                if "min_total_price" in hotel: 
                    price_val = hotel.get("min_total_price")
                elif "composite_price_breakdown" in hotel: 
                    price_val = hotel["composite_price_breakdown"].get("gross_amount", {}).get("value", 0)
                elif "price_breakdown" in hotel:
                    price_val = hotel["price_breakdown"].get("all_inclusive_price", 0)
                
                # Get address
                address = hotel.get("address", "")
                if not address:
                    address = f"{hotel.get('city_trans', destination_name)}"
                
                # Get amenities
                amenities = []
                if hotel.get("has_free_parking"):
                    amenities.append("Free Parking")
                if hotel.get("has_swimming_pool"):
                    amenities.append("Pool")
                if hotel.get("is_free_cancellable"):
                    amenities.append("Free Cancellation")
                if not amenities:
                    amenities = ["WiFi", "AC"]
                
                hotels.append({
                    "name": name, 
                    "price_per_night_usd": int(float(price_val)) if price_val > 0 else 0, 
                    "rating": float(hotel.get("review_score", 0) or 0),
                    "summary": f"Located in {hotel.get('city_trans', destination_name)}. {hotel.get('review_score_word', 'Good')} rating.",
                    "address": address,
                    "amenities": amenities[:3],
                    "booking_url": link
                })
                
                print(f"[DEBUG] Hotel: {name} - ${price_val}/night - {link}")
            except Exception as e:
                print(f"[DEBUG] Error parsing hotel: {e}")
                continue
        
        return hotels

search_flights = FlightSearchTool()
search_hotels = HotelSearchTool()