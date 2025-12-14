import os
import requests
from dotenv import load_dotenv
from crewai import LLM 

load_dotenv()

def print_status(name, success, message):
    icon = "✅" if success else "❌"
    print(f"{icon} {name}: {message}")

# ... (Keep test_amadeus and test_booking_rapidapi the same) ...
def test_amadeus():
    # Reuse the code from the previous step
    api_key = os.getenv("AMADEUS_API_KEY")
    api_secret = os.getenv("AMADEUS_API_SECRET")
    if not api_key or not api_secret:
        print_status("Amadeus", False, "Missing Keys")
        return
    try:
        auth = requests.post("https://test.api.amadeus.com/v1/security/oauth2/token",
            data={"grant_type": "client_credentials", "client_id": api_key, "client_secret": api_secret})
        if auth.status_code == 200:
            print_status("Amadeus", True, "Authentication Successful")
        else:
            print_status("Amadeus", False, f"Auth Failed: {auth.text}")
    except Exception as e:
        print_status("Amadeus", False, str(e))

def test_booking_rapidapi():
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key:
        print_status("Booking.com", False, "Missing Key")
        return
    try:
        # Use the Location Autocomplete endpoint - it's the standard entry point
        url = "https://booking-com.p.rapidapi.com/v1/hotels/locations"
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "booking-com.p.rapidapi.com"
        }
        # Simple search for "London" to see if API responds
        params = {"name": "London", "locale": "en-gb"}
        
        res = requests.get(url, headers=headers, params=params)
        
        if res.status_code == 200:
            print_status("Booking.com", True, "Connection Successful")
        elif res.status_code == 403:
            print_status("Booking.com", False, "Forbidden - Check RapidAPI Subscription")
        else:
            print_status("Booking.com", False, f"Error {res.status_code}: {res.text}")
            
    except Exception as e:
        print_status("Booking.com", False, str(e))

def test_llm_crewai():
    # Check for ANY of your keys
    keys = [
        "GOOGLE_API_KEY", 
        "GOOGLE_API_KEY_PLANNER", 
        "GOOGLE_API_KEY_ANALYST", 
        "GOOGLE_API_KEY_LOGISTICS",
        "GOOGLE_API_KEY_CURATOR"
    ]
    
    # Find the first key that actually has a value
    active_key = next((os.getenv(k) for k in keys if os.getenv(k)), None)
    
    if not active_key:
        print_status("Google LLM", False, "No GOOGLE_API_KEY found in .env (checked all 4 variations)")
        return
        
    try:
        print(f"   (Using key ending in ...{active_key[-4:]})")
        llm = LLM(model="gemini/gemini-1.5-flash", api_key=active_key)
        response = llm.call("Say Hi")
        
        if response:
            print_status("Google LLM", True, "Connected successfully")
        else:
            print_status("Google LLM", False, "Connected but returned empty")
            
    except Exception as e:
        print_status("Google LLM", False, f"Error: {e}")

if __name__ == "__main__":
    print("\n--- TESTING APIS ---")
    test_amadeus()
    test_booking_rapidapi()
    test_llm_crewai()
    print("--------------------\n")