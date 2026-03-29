import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Using Llama 3.3 70B Versatile which is free and highly capable on Groq
GROQ_MODEL = "llama-3.3-70b-versatile"

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)


async def generate_ai_insights(merchant_name: str, stats: dict) -> dict:
    """
    Generate AI-powered merchant insights using Groq API.
    Falls back to rule-based analysis if Groq is unavailable.
    """
    today = stats.get("today", {})
    yesterday = stats.get("yesterday", {})
    this_week = stats.get("this_week", {})
    last_week = stats.get("last_week", {})
    this_month = stats.get("this_month", {})
    last_month = stats.get("last_month", {})

    prompt = f"""Analyze this merchant's payment data and provide a professional, data-driven JSON analysis.
    
    IMPORTANT: 
    1. DO NOT USE EMOJIS in any text. Use plain text only.
    2. Provide detailed daily, weekly, and monthly breakdowns with percentages where possible.
    3. Generate a numerical forecast for the next 7 days based on current trends.

    Merchant: {merchant_name}

    DAILY:
    - Today: {today.get('revenue', 0):.2f} INR, {today.get('count', 0)} transactions
    - Yesterday: {yesterday.get('revenue', 0):.2f} INR, {yesterday.get('count', 0)} transactions

    WEEKLY:
    - This week: {this_week.get('revenue', 0):.2f} INR, {this_week.get('count', 0)} transactions
    - Last week: {last_week.get('revenue', 0):.2f} INR, {last_week.get('count', 0)} transactions

    MONTHLY:
    - This month: {this_month.get('revenue', 0):.2f} INR, {this_month.get('count', 0)} transactions
    - Last month: {last_month.get('revenue', 0):.2f} INR, {last_month.get('count', 0)} transactions

    Respond with this EXACT JSON schema only, no extra text:
    {{
      "daily_summary": "one punchy sentence for today",
      "highlights": ["2-3 ultra-concise numerical highlights"],
      "trend": "up" or "down" or "stable",
      "health_score": number 0-100,
      "top_recommendation": "strictly 1 actionable sentence",
      "category_distribution": {{"CategoryName": percentage_number}}, 
      "weekly_comparison": {{"current_week": amount, "previous_week": amount}},
      "peak_hours": [list of 4-5 core hour ranges e.g. "Morning", "Afternoon", "Evening", "Night"],
      "peak_hour_values": [comparative activity numbers for the peak_hours],
      "forecast_values": [7 revenue numbers for next 7 days],
      "forecast_labels": ["7 short day names"]
    }}"""

    if not GROQ_API_KEY:
        print("⚠️ No GROQ_API_KEY set. Using fallback.")
        return _fallback_analysis(merchant_name, stats)

    try:
        # Groq chat completions API
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3,
            response_format={"type": "json_object"} # Groq supports forcing JSON
        )

        generated = response.choices[0].message.content

        # Try to extract JSON from the response
        try:
            json_start = generated.find("{")
            json_end = generated.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                ai_result = json.loads(generated[json_start:json_end])
                ai_result["source"] = "groq_ai"
                ai_result["model"] = GROQ_MODEL
                print(f"✅ AI Insights generated for {merchant_name} using {GROQ_MODEL}")
                return ai_result
        except json.JSONDecodeError:
            pass

        print(f"⚠️ Could not parse Groq response. Using fallback.")
        return _fallback_analysis(merchant_name, stats)

    except Exception as e:
        print(f"❌ Groq Error: {e}")
        # Groq is generally very reliable, but if it fails, we fall back to rule-based
        return _fallback_analysis(merchant_name, stats)


def _fallback_analysis(merchant_name: str, stats: dict) -> dict:
    """Rule-based fallback when Groq is unavailable."""
    today = stats.get("today", {})
    yesterday = stats.get("yesterday", {})
    this_week = stats.get("this_week", {})
    last_week = stats.get("last_week", {})
    this_month = stats.get("this_month", {})
    last_month = stats.get("last_month", {})

    t_rev = today.get("revenue", 0)
    y_rev = yesterday.get("revenue", 0)
    tw_rev = this_week.get("revenue", 0)
    lw_rev = last_week.get("revenue", 0)
    tm_rev = this_month.get("revenue", 0)
    lm_rev = last_month.get("revenue", 0)

    # Daily change
    if y_rev > 0:
        daily_pct = ((t_rev - y_rev) / y_rev) * 100
        daily_dir = "up" if daily_pct > 0 else "down"
        daily_summary = f"Today's revenue is {abs(daily_pct):.1f}% {daily_dir} compared to yesterday (₹{t_rev:.0f} vs ₹{y_rev:.0f})"
    else:
        daily_pct = 0
        daily_summary = f"Today's revenue: ₹{t_rev:.0f} with {today.get('count', 0)} transactions"

    # Weekly change
    if lw_rev > 0:
        weekly_pct = ((tw_rev - lw_rev) / lw_rev) * 100
        weekly_dir = "up" if weekly_pct > 0 else "down"
        weekly_summary = f"This week is {abs(weekly_pct):.1f}% {weekly_dir} from last week (₹{tw_rev:.0f} vs ₹{lw_rev:.0f})"
    else:
        weekly_pct = 0
        weekly_summary = f"This week: ₹{tw_rev:.0f} revenue from {this_week.get('count', 0)} transactions"

    # Monthly change
    if lm_rev > 0:
        monthly_pct = ((tm_rev - lm_rev) / lm_rev) * 100
        monthly_dir = "up" if monthly_pct > 0 else "down"
        monthly_summary = f"This month is {abs(monthly_pct):.1f}% {monthly_dir} from last month (₹{tm_rev:.0f} vs ₹{lm_rev:.0f})"
    else:
        monthly_pct = 0
        monthly_summary = f"This month: ₹{tm_rev:.0f} revenue from {this_month.get('count', 0)} transactions"

    # Overall trend
    trend = "stable"
    if daily_pct > 5 and weekly_pct > 5:
        trend = "up"
    elif daily_pct < -5 and weekly_pct < -5:
        trend = "down"

    # Health score
    score = 50
    if t_rev > 0: score += 10
    if today.get("count", 0) > 5: score += 10
    if daily_pct > 0: score += 10
    if weekly_pct > 0: score += 10
    if monthly_pct > 0: score += 10
    score = min(score, 100)

    # Risk
    risk = "none"
    if daily_pct < -30:
        risk = "Significant daily revenue drop detected. Monitor closely."
    elif today.get("count", 0) == 0 and yesterday.get("count", 0) > 0:
        risk = "No transactions today despite activity yesterday."

    # Recommendation
    if today.get("count", 0) == 0:
        tip = "Enable voice payments to attract more hands-free customers"
    elif daily_pct < 0:
        tip = "Consider running a flash discount to recover daily momentum"
    else:
        tip = "Maintain peak-hour staffing to capitalize on growing transaction volume"

    import datetime
    today_dt = datetime.datetime.now()
    labels = [(today_dt + datetime.timedelta(days=i)).strftime('%a') for i in range(1, 8)]

    return {
        "daily_summary": daily_summary,
        "highlights": [daily_summary, weekly_summary],
        "trend": trend,
        "health_score": score,
        "top_recommendation": tip,
        "category_distribution": {"Food": 45, "Travel": 25, "Bazaar": 20, "Others": 10},
        "weekly_comparison": {"current_week": round(t_rev * 1.12, 2), "previous_week": t_rev},
        "peak_hours": ["Morning", "Afternoon", "Evening", "Night"],
        "peak_hour_values": [12, 45, 80, 20],
        "forecast_values": [round(t_rev * (1.1 ** i), 2) for i in range(1, 8)], # Mock 10% growth
        "forecast_labels": labels,
        "source": "rule_based_fallback",
        "model": "built-in"
    }
