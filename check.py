import os
import sys
from dotenv import load_dotenv
from google import genai
from google.genai.errors import APIError

# 1. Load the environment variable
# Assuming you have a .env file that contains the GOOGLE_API_KEY_PLANNER
load_dotenv()

# The key you specified
API_KEY_ENV_VAR = "GOOGLE_API_KEY_PLANNER"
api_key = os.getenv(API_KEY_ENV_VAR)

if not api_key:
    print(f"FATAL: The environment variable '{API_KEY_ENV_VAR}' is not set.")
    sys.exit(1)

# 2. Configure the client with your key
# Note: The 'google-genai' library automatically looks for GOOGLE_API_KEY, 
# but we explicitly configure it to ensure it uses the one we loaded.
try:
    client = genai.Client(api_key=api_key)
except Exception as e:
    print(f"Error initializing Gemini client: {e}")
    sys.exit(1)


# 3. List the available models
print("\n--- Listing Models Available for your API Key ---")
try:
    # Use client.models.list() to retrieve the list
    available_models = list(client.models.list())
    
    # Check if the list is empty
    if not available_models:
        print("CRITICAL: The API key is successfully authenticated, but the API returned an empty list of models.")
        print("This strongly indicates a ZERO QUOTA or a severe restriction on your API key/project.")
    else:
        print(f"SUCCESS: Found {len(available_models)} available models.")
        print("--- TOP 5 Models ---")
        for i, model in enumerate(available_models[:53]):
            print(f"  {i+1}. {model.name}")

except APIError as e:
    print("\n!!! --- API ERROR DURING MODEL LISTING --- !!!")
    print(f"Error: {e}")
    print("This confirms the error is happening even on a basic API status call.")
    
except Exception as e:
    print(f"An unexpected error occurred: {e}")

print("\n------------------------------------------------")