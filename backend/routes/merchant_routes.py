"""
Paytm AI VoiceGuard - Merchant & Soundbox Routes
Dashboard analytics, soundbox events, and AI insights
"""
from fastapi import APIRouter, HTTPException, Request
from database import cols
from datetime import datetime, timedelta
import random

router = APIRouter()

# ─────────────────────── MERCHANT DASHBOARD ───────────────────────
@router.get("/dashboard")
async def merchant_dashboard(merchant_id: str = "merchant_001"):
    merchant = await cols.merchants.find_one({"merchant_id": merchant_id})
    if not merchant:
        raise HTTPException(404, "Merchant not found")

    # Recent soundbox events
    events_cursor = cols.soundbox_events.find({"merchant_id": merchant_id}).sort("timestamp", -1).limit(20)
    events = []
    async for e in events_cursor:
        events.append({
            "type": e.get("type"), "amount": e.get("amount"),
            "sender": e.get("sender"), "method": e.get("method"),
            "timestamp": str(e.get("timestamp", "")),
            "verification": e.get("verification", {})
        })

    # Revenue analytics
    pipeline = [
        {"$match": {"merchant_id": merchant_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    agg = cols.soundbox_events.aggregate(pipeline)
    stats = {"total_revenue": 0, "total_transactions": 0}
    async for doc in agg:
        stats["total_revenue"] = round(doc.get("total", 0), 2)
        stats["total_transactions"] = doc.get("count", 0)

    return {
        "merchant": {
            "id": merchant["merchant_id"],
            "name": merchant["name"],
            "upi_id": merchant.get("upi_id"),
            "category": merchant.get("category"),
            "soundbox_active": merchant.get("soundbox_active", True),
        },
        "stats": stats,
        "recent_events": events,
        "ai_insights": {
            "fraud_alerts": merchant.get("fraud_alerts", 0),
            "peak_hours": "10 AM - 2 PM",
            "avg_transaction": round(stats["total_revenue"] / max(stats["total_transactions"], 1), 2),
            "voice_pay_adoption": f"{random.randint(15, 45)}%",
            "recommendation": "Enable multi-language voice support for wider customer reach"
        }
    }

# ─────────────────────── SOUNDBOX EVENT ───────────────────────
@router.post("/soundbox/event")
async def soundbox_event(request: Request):
    body = await request.json()
    event = {
        "type": body.get("type", "payment_received"),
        "amount": body.get("amount", 0),
        "sender": body.get("sender", "Unknown"),
        "recipient": body.get("recipient", "Merchant"),
        "method": body.get("method", "UPI"),
        "merchant_id": body.get("merchant_id", "merchant_001"),
        "timestamp": datetime.utcnow(),
        "verification": body.get("verification", {}),
        "language": body.get("language", "Hindi"),
    }
    await cols.soundbox_events.insert_one(event)

    # Update merchant stats
    await cols.merchants.update_one(
        {"merchant_id": event["merchant_id"]},
        {"$inc": {"total_revenue": event["amount"], "total_transactions": 1}}
    )

    # Flag suspicious transactions
    if event["amount"] > 50000:
        await cols.merchants.update_one(
            {"merchant_id": event["merchant_id"]},
            {"$inc": {"fraud_alerts": 1}}
        )

    return {
        "status": "success",
        "announcement": f"Payment received: {event['amount']} rupees from {event['sender']}",
        "language": event["language"]
    }
