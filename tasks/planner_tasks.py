from datetime import datetime
from crewai import Task
from schemas.itinerary_schemas import DeconstructedQuery

def create_planner_task(agent, user_query: str):
    """
    Creates a task for the Lead Planner agent to deconstruct a user query.
    Injects the CURRENT DATE so the AI can calculate relative dates.
    Enforces STRICT NO-ASSUMPTION rules.
    """
    
    today = datetime.now()
    current_date_str = today.strftime("%Y-%m-%d (%A)") # e.g., "2025-11-22 (Saturday)"
    
    return Task(
        description=f"""
        Analyze this user query: '{user_query}'
        
        **CONTEXT:**
        - Today's Date: {current_date_str}
        
        **CRITICAL RULES (STRICT COMPLIANCE REQUIRED):**
        1. **NO ASSUMPTIONS:** If the user does not explicitly state a piece of information, you MUST set that field to `null` (or 0 for budget).
        2. **Origin:** Do NOT assume the user is where you are. If they don't say "from London", origin is null.
        3. **Travelers:** Do NOT default to "1 person" or "me". If they don't say "2 people" or "family", travelers is null.
        4. **Budget:** Do NOT guess a budget. If no money is mentioned, budget_usd is 0.
        5. **Dates:** 
           - Only infer dates if words like "next week", "January", "Summer 2025" are used. 
           - If no time context is given, start_date and end_date are null.
           - If user mentions a month without a year, assume the NEXT occurrence relative to {current_date_str}.

        **GOAL:** 
        Extract only what is physically present in the text. Return a JSON object matching the DeconstructedQuery schema.
        """,
        expected_output="A single, valid DeconstructedQuery JSON object with null values for missing fields.",
        agent=agent,
        output_pydantic=DeconstructedQuery
    )   