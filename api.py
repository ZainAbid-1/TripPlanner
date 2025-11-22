# src/api.py
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from main import TripPlannerCrew  # Importing your AI Orchestrator

# 1. Initialize FastAPI
app = FastAPI(title="VoyageAI Backend")

# 2. Setup CORS (CRITICAL for React to talk to Python)
# This allows localhost:3000 or localhost:5173 to send requests to port 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Request Schema
class TripRequest(BaseModel):
    query: str

# 4. The Main Endpoint
@app.post("/api/plan-trip")
async def generate_itinerary(request: TripRequest):
    """
    Receives a text query (e.g., "Trip to Paris"), runs the CrewAI agents,
    and returns a structured FinalItinerary JSON.
    """
    print(f"📥 Received request: {request.query}")
    
    try:
        # Initialize the Crew
        crew = TripPlannerCrew()
        
        # Run the Agents
        result = crew.run(request.query)
        
        # Return the Final JSON
        return result

    except ValueError as ve:
        # Catch validation errors (Missing Origin, Budget, etc.)
        # Send 400 Bad Request so frontend shows the red alert
        print(f"❌ Validation Error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
        
    except Exception as e:
        # Catch system crashes
        print(f"🔥 Internal Server Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 5. Health Check Endpoint (Optional but good practice)
@app.get("/health")
def health_check():
    return {"status": "active", "service": "VoyageAI API"}

if __name__ == "__main__":
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)