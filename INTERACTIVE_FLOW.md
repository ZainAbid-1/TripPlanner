# Interactive Information Gathering Flow

## Overview
The agent now asks for missing critical information before generating the itinerary, ensuring better results.

## API Flow

### Step 1: Initial Request (with missing info)

**Request:**
```json
POST /api/plan-trip
{
  "query": "weekend trip to Paris",
  "ask_if_missing": true
}
```

**Response (needs more info):**
```json
{
  "status": "needs_more_info",
  "missing_info": {
    "origin": {
      "question": "Where are you traveling from? (City name - needed for flight search)",
      "type": "text",
      "required": true,
      "priority": 2
    },
    "budget_usd": {
      "question": "What is your total budget for this trip in USD?",
      "type": "number",
      "required": true,
      "priority": 3
    },
    "start_date": {
      "question": "When do you want to start your trip? (e.g., 'next weekend', '2025-12-20', 'in 2 weeks')",
      "type": "text",
      "required": false,
      "default": "next weekend",
      "priority": 4
    },
    "travelers": {
      "question": "How many people are traveling?",
      "type": "number",
      "required": false,
      "default": 1,
      "priority": 5
    }
  },
  "original_query": "weekend trip to Paris",
  "parsed_so_far": {
    "destination": "Paris",
    "origin": null,
    "start_date": null,
    "end_date": null,
    "travelers": null,
    "budget_usd": 0
  },
  "suggested_query": "Trip to Paris"
}
```

### Step 2: Follow-up Request (with answers)

**Request:**
```json
POST /api/plan-trip
{
  "query": "weekend trip to Paris",
  "ask_if_missing": true,
  "additional_answers": {
    "origin": "London",
    "budget_usd": 2000,
    "start_date": "next weekend"
  }
}
```

**Response (complete itinerary):**
```json
{
  "trip_title": "Weekend Trip to Paris",
  "destination": "Paris",
  "chosen_flight": {
    "airline": "British Airways",
    "price_usd": 250,
    "booking_url": "https://www.google.com/travel/flights?q=Flights+to+PAR+from+LON..."
  },
  "chosen_hotel": {
    "name": "Hotel Paris Center",
    "price_per_night_usd": 150,
    "booking_url": "https://www.booking.com/hotel/fr/paris-center.html..."
  },
  "all_flights": [...],
  "all_hotels": [...],
  "daily_plans": [...]
}
```

### Step 3: Skip Interactive Mode (auto-fill)

If you want to skip the interactive questions and use defaults:

**Request:**
```json
POST /api/plan-trip
{
  "query": "I want to travel for 5 days",
  "ask_if_missing": false
}
```

The system will auto-fill missing information with defaults.

## Frontend Integration Example

```typescript
async function planTrip(query: string) {
  // First request
  const response1 = await fetch('/api/plan-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query,
      ask_if_missing: true 
    })
  });
  
  const result1 = await response1.json();
  
  // Check if we need more info
  if (result1.status === 'needs_more_info') {
    // Display questions to user
    const answers = await askUserQuestions(result1.missing_info);
    
    // Send follow-up request with answers
    const response2 = await fetch('/api/plan-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: result1.original_query,
        ask_if_missing: true,
        additional_answers: answers
      })
    });
    
    return await response2.json();
  }
  
  // Already have complete itinerary
  return result1;
}

function askUserQuestions(missingInfo: any): Promise<any> {
  // Display form/modal to collect answers
  return new Promise((resolve) => {
    const answers: any = {};
    // ... collect user input for each question in missingInfo
    resolve(answers);
  });
}
```

## Missing Info Detection

The system checks for:

1. **Destination** (REQUIRED) - Cannot proceed without it
2. **Origin** (REQUIRED) - Needed for flight searches
3. **Budget** (REQUIRED) - Should not be assumed
4. **Start Date** (optional) - Defaults to "next weekend"
5. **Travelers** (optional) - Defaults to 1

### Priority Order

Questions are displayed in priority order:
1. Destination (most critical)
2. Origin (needed for flights)
3. Budget (important for recommendations)
4. Start date (can be defaulted)
5. Travelers (can be defaulted)

## Benefits

1. **Better Results**: More accurate itineraries with complete information
2. **User Engagement**: Interactive experience improves satisfaction
3. **Flexibility**: Can still auto-fill for quick results
4. **Smart Defaults**: Sensible defaults when user skips questions

## User Flow Examples

**Example 1: Incomplete Query (Missing Origin & Budget)**
```
User: "weekend trip to Paris"
↓
Agent: Shows form asking:
  - Where are you traveling from? (required - for flight search)
  - What is your total budget? (required - for better recommendations)
  - When do you want to start? (optional, default: next weekend)
  - How many people? (optional, default: 1)
↓
User fills: London, $2000
(Skips optional fields - system uses defaults)
↓
Agent: Generates complete itinerary with flights from London to Paris
```

**Example 2: Complete Query (No Questions)**
```
User: "Trip to Paris from London, Dec 20-25, budget $3000"
↓
Agent: Proceeds directly (all required info provided)
↓
Agent: Generates complete itinerary immediately
```

**Example 3: Very Incomplete Query**
```
User: "I want to travel"
↓
Agent: Shows form asking:
  - Where would you like to travel to? (required)
  - Where are you traveling from? (required)
  - What is your total budget? (required)
  - When do you want to start? (optional, default: next weekend)
  - How many people? (optional, default: 1)
↓
User fills all required fields
↓
Agent: Generates complete itinerary
```
