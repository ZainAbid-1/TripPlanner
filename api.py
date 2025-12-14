import uvicorn
import re
from typing import Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from main import OptimizedTripPlannerCrew
from utils.cache_manager import cache

# =====================================================
# FASTAPI APP SETUP
# =====================================================
app = FastAPI(
    title="VoyageAI Backend API",
    description="Optimized multi-agent travel planning system",
    version="2.0.0"
)

# =====================================================
# RATE LIMITING
# =====================================================
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =====================================================
# CORS CONFIGURATION
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# DISABLE CACHING GLOBALLY
# =====================================================
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# =====================================================
# REQUEST/RESPONSE MODELS
# =====================================================
class TripRequest(BaseModel):
    query: str = Field(..., max_length=500, min_length=10)
    conversation_id: Optional[str] = Field(None, max_length=100)
    ask_if_missing: bool = Field(default=True, description="Whether to ask for missing info or auto-fill")
    additional_answers: Optional[dict] = Field(default=None, description="Answers to previously asked questions")
    
    # Updated to Pydantic V2 style validator
    @field_validator('query')
    @classmethod
    def sanitize_query(cls, v):
        """Prevent prompt injection and malicious input"""
        dangerous_patterns = [
            r'```',  # Code blocks
            r'<script>',  # XSS
            r'DROP\s+TABLE',  # SQL injection
            r'IGNORE\s+PREVIOUS',  # Prompt injection
            r'SYSTEM:',  # System prompt override
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Invalid input detected")
        
        return v.strip()

# =====================================================
# GLOBAL CREW INSTANCE
# =====================================================
crew_instance = None

def get_crew():
    """Get or create crew instance"""
    global crew_instance
    if crew_instance is None:
        crew_instance = OptimizedTripPlannerCrew()
    return crew_instance

# =====================================================
# ENDPOINTS
# =====================================================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    cache_stats = cache.get_stats()
    return {
        "status": "active",
        "service": "VoyageAI API v2.0",
        "cache_stats": cache_stats
    }

@app.post("/api/plan-trip")
@limiter.limit("50/minute")
async def generate_itinerary(request: Request, trip_request: TripRequest):
    """
    Main endpoint: Generate travel itinerary
    NOTE: 'request: Request' is required for SlowAPI rate limiting to work.
    """
    import uuid
    from datetime import datetime
    
    query_id = str(uuid.uuid4())[:8]
    request_time = datetime.now().isoformat()
    
    cache.clear()
    cache.cleanup_expired()
    print(f"\n📥 Received request [{query_id}]: {trip_request.query}")
    print(f"⏱️  Request Time: {request_time}")
    
    try:
        # Get crew instance
        crew = get_crew()
        
        # Run the optimized async pipeline with interactive support
        result = await crew.run_async(
            trip_request.query, 
            ask_if_missing=trip_request.ask_if_missing,
            additional_answers=trip_request.additional_answers
        )
        
        # Check if we need more information
        if isinstance(result, dict) and result.get("status") == "needs_more_info":
            print(f"❓ Requesting more information from user [{query_id}]")
            result["_request_id"] = query_id
            result["_request_time"] = request_time
            return result
        
        print(f"✅ Successfully generated itinerary [{query_id}]")
        
        if isinstance(result, dict):
            result["_request_id"] = query_id
            result["_request_time"] = request_time
        
        return result
        
    except ValueError as ve:
        # Handle validation errors
        error_msg = str(ve)
        print(f"❌ Validation Error: {error_msg}")
        
        if error_msg.startswith("VALIDATION:"):
            clean_msg = error_msg.replace("VALIDATION:", "").strip()
            raise HTTPException(
                status_code=400,
                detail=f"VALIDATION:{clean_msg}"
            )
        else:
            raise HTTPException(status_code=400, detail=error_msg)
    
    except Exception as e:
        # Handle system errors
        print(f"🔥 Internal Server Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.websocket("/ws/plan-trip")
async def websocket_itinerary(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        query = data.get("query", "")
        
        if not query:
            await websocket.send_json({"error": "No query provided", "stage": 0})
            await websocket.close()
            return
        
        await websocket.send_json({"stage": 1, "status": "Processing...", "progress": 10})
        
        crew = get_crew()
        result = await crew.run_async(query)
        
        await websocket.send_json({
            "stage": 4, 
            "status": "Complete!", 
            "progress": 100, 
            "result": result
        })
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# =====================================================
# ADMIN CACHE ENDPOINTS
# =====================================================
@app.post("/api/cache/clear")
def clear_cache():
    cache.clear()
    return {"status": "Cache cleared"}

@app.get("/api/cache/stats")
def get_cache_stats():
    return cache.get_stats()

# =====================================================
# ERROR HANDLERS (Must return JSONResponse)
# =====================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint not found",
            "error_type": "not_found"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": "internal_error"
        }
    )

# =====================================================
# RUN SERVER
# =====================================================

if __name__ == "__main__":
    print("Starting VoyageAI API Server...")
    print("Listening on http://0.0.0.0:8000")
    print("Docs available at http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )