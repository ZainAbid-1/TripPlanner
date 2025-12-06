"""
Budget Analysis Utility
Analyzes trip budget and provides recommendations
"""

from typing import Dict, List
from datetime import datetime


class BudgetAnalyzer:
    """Analyzes budget against estimated costs and provides recommendations"""
    
    # Baseline cost estimates per day (USD)
    BASELINE_COSTS = {
        "budget": {
            "accommodation": 30,
            "food": 25,
            "activities": 20,
            "transport": 15,
            "total_per_day": 90
        },
        "moderate": {
            "accommodation": 80,
            "food": 50,
            "activities": 40,
            "transport": 30,
            "total_per_day": 200
        },
        "luxury": {
            "accommodation": 200,
            "food": 100,
            "activities": 80,
            "transport": 50,
            "total_per_day": 430
        }
    }
    
    @staticmethod
    def analyze_budget(
        user_budget: float,
        trip_duration_days: int,
        flight_cost: float = 0,
        hotel_cost: float = 0,
        activities_cost: float = 0
    ) -> Dict:
        """
        Analyze budget and return detailed breakdown with recommendations
        
        Args:
            user_budget: User's total budget in USD
            trip_duration_days: Number of days for the trip
            flight_cost: Estimated flight cost
            hotel_cost: Total hotel cost
            activities_cost: Total activities cost
            
        Returns:
            Dictionary with budget analysis and recommendations
        """
        
        # Calculate total estimated cost
        total_cost = flight_cost + hotel_cost + activities_cost
        
        # Calculate remaining budget after fixed costs
        remaining_budget = user_budget - total_cost
        daily_remaining = remaining_budget / trip_duration_days if trip_duration_days > 0 else 0
        
        # Determine budget tier
        if daily_remaining >= BudgetAnalyzer.BASELINE_COSTS["luxury"]["total_per_day"]:
            tier = "luxury"
            tier_label = "Luxury"
            message = f"🌟 **Excellent Budget!** You have ${user_budget:,.0f} for this {trip_duration_days}-day trip. This allows for luxury accommodations, fine dining, and premium experiences!"
            recommendations = [
                "✨ Stay at 5-star hotels or luxury resorts",
                "🍽️ Dine at top-rated restaurants",
                "🎭 Book exclusive tours and VIP experiences",
                "🚗 Use private transportation",
                "💎 Don't miss premium activities and shows"
            ]
        elif daily_remaining >= BudgetAnalyzer.BASELINE_COSTS["moderate"]["total_per_day"]:
            tier = "moderate"
            tier_label = "Comfortable"
            message = f"✅ **Great Budget!** Your ${user_budget:,.0f} budget provides a comfortable {trip_duration_days}-day experience with good accommodations and quality activities."
            recommendations = [
                "🏨 Choose 3-4 star hotels with good reviews",
                "🍕 Mix of local restaurants and popular eateries",
                "🎟️ Book popular tours and attractions",
                "🚕 Use taxis and public transport",
                "📸 Enjoy main tourist spots and activities"
            ]
        elif daily_remaining >= BudgetAnalyzer.BASELINE_COSTS["budget"]["total_per_day"]:
            tier = "budget"
            tier_label = "Budget-Friendly"
            message = f"💰 **Workable Budget** - Your ${user_budget:,.0f} covers essentials for {trip_duration_days} days, but you'll need to be mindful of spending."
            recommendations = [
                "🏠 Consider budget hotels or hostels",
                "🍜 Eat at local cafes and street food",
                "🚶 Use public transport and walk when possible",
                "🎫 Focus on free or low-cost attractions",
                "💡 Book activities in advance for discounts"
            ]
        else:
            tier = "tight"
            tier_label = "Tight Budget"
            shortage = BudgetAnalyzer.BASELINE_COSTS["budget"]["total_per_day"] * trip_duration_days - remaining_budget
            message = f"⚠️ **Budget Alert!** Your ${user_budget:,.0f} budget is tight for {trip_duration_days} days. We recommend adding **${shortage:,.0f}** to enjoy the trip comfortably."
            recommendations = [
                f"💵 Consider increasing budget by ${shortage:,.0f}",
                "🏕️ Look for shared accommodations or budget stays",
                "🍞 Self-catering options to save on food",
                "🚌 Use only public transportation",
                "🆓 Focus on free walking tours and attractions",
                "⏱️ Consider shortening trip duration"
            ]
        
        # Calculate budget breakdown
        breakdown = {
            "flights": flight_cost,
            "accommodation": hotel_cost,
            "activities": activities_cost,
            "daily_expenses": remaining_budget,
            "total": total_cost
        }
        
        # Budget utilization percentage
        utilization = (total_cost / user_budget * 100) if user_budget > 0 else 0
        
        return {
            "tier": tier,
            "tier_label": tier_label,
            "message": message,
            "recommendations": recommendations,
            "breakdown": breakdown,
            "remaining_budget": remaining_budget,
            "daily_remaining": daily_remaining,
            "utilization_percent": round(utilization, 1),
            "is_sufficient": remaining_budget >= 0,
            "suggested_budget": max(user_budget, total_cost + (BudgetAnalyzer.BASELINE_COSTS["budget"]["total_per_day"] * trip_duration_days))
        }
    
    @staticmethod
    def get_budget_message_for_itinerary(analysis: Dict) -> str:
        """Generate a user-friendly budget message for the itinerary"""
        tier = analysis["tier"]
        
        if tier == "luxury":
            return f"{analysis['message']}\n\nYou can enjoy premium experiences throughout your trip!"
        elif tier == "moderate":
            return f"{analysis['message']}\n\nYou'll have a great time with quality experiences!"
        elif tier == "budget":
            return f"{analysis['message']}\n\nStick to budget-friendly options and you'll have a wonderful trip!"
        else:  # tight
            return f"{analysis['message']}\n\nWe're making it work, but consider the suggestions below for a more comfortable experience."
