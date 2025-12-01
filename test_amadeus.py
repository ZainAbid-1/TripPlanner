import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("AMADEUS_API_KEY")
API_SECRET = os.getenv("AMADEUS_API_SECRET")
BASE_URL = "https://test.api.amadeus.com"

# STEP 1 — Get access token
def get_token():
    url = f"{BASE_URL}/v1/security/oauth2/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": API_KEY,
        "client_secret": API_SECRET
    }
    res = requests.post(url, data=data)
    token = res.json().get("access_token", None)
    print("🔐 Access Token:", token)
    return token

# STEP 2 — Make a test flight search & print rate limits
def check_rate_limit():
    token = get_token()
    if not token:
        print("❌ Failed to get token.")
        return
    
    url = f"{BASE_URL}/v2/shopping/flight-offers"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "originLocationCode": "LHE",
        "destinationLocationCode": "DXB",
        "departureDate": "2025-12-05",
        "adults": 1,
        "max": 1
    }

    res = requests.get(url, headers=headers, params=params)

    print("\n📊 --- RATE LIMIT DETAILS ---")
    print("Total Allowed:", res.headers.get("X-RateLimit-Limit"))
    print("Remaining Calls:", res.headers.get("X-RateLimit-Remaining"))
    print("Resets At (UTC):", res.headers.get("X-RateLimit-Reset"))
    print("-----------------------------\n")

check_rate_limit()
