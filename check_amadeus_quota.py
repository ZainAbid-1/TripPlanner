# check_amadeus_quota.py
import os, requests, time
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

API_KEY = os.getenv("AMADEUS_API_KEY")
API_SECRET = os.getenv("AMADEUS_API_SECRET")

def get_token(base_url):
    url = f"{base_url}/v1/security/oauth2/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": API_KEY,
        "client_secret": API_SECRET
    }
    r = requests.post(url, data=data, timeout=15)
    print(f"\n[Token request -> {base_url}] status:", r.status_code)
    print("token response (truncated):", r.text[:800])
    if r.status_code == 200:
        return r.json().get("access_token")
    return None

def inspect_rate_limit(base_url, token):
    if not token:
        print("No token for", base_url); return
    url = f"{base_url}/v2/shopping/flight-offers"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"originLocationCode":"LHE","destinationLocationCode":"DXB","departureDate":"2025-12-05","adults":1,"max":1}
    r = requests.get(url, headers=headers, params=params, timeout=15)
    print(f"\n[Search -> {base_url}] status:", r.status_code)
    # show all headers so we can see exact names
    all_headers = dict(r.headers)
    print("\nAll response headers:")
    for k, v in all_headers.items():
        print(f"  {k}: {v}")
    # try to find rate-limit-type headers (case-insensitive)
    found = {k:v for k,v in all_headers.items() if 'ratelimit' in k.lower() or 'rate' in k.lower() or 'limit' in k.lower()}
    print("\nDetected candidate rate-limit headers:", found if found else "None found")
    # convert reset header to readable time if present
    reset_keys = [k for k in all_headers if 'reset' in k.lower()]
    for rk in reset_keys:
        val = all_headers.get(rk)
        try:
            ts = int(val)
            print(f"\n{rk} (unix ts) -> {datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        except Exception:
            # sometimes it's an ISO date or other format
            print(f"\n{rk} value (raw): {val}")

    # print small part of body to detect errors
    try:
        print("\nBody (truncated):", r.text[:800])
    except Exception:
        pass

if __name__ == "__main__":
    for base in ["https://test.api.amadeus.com", "https://api.amadeus.com"]:
        print("\n" + "="*40)
        print("Checking base URL:", base)
        token = get_token(base)
        print("Token present?:", bool(token))
        inspect_rate_limit(base, token)
