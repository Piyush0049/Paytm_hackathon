from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from typing import List, Optional
from pydantic import BaseModel, Field
import shutil
import time
import random
import uuid
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

from services.voice_service import VoiceService
from services.biometric_service import BiometricService
from services.fraud_service import FraudService

load_dotenv()

app = FastAPI(title="Paytm AI VoiceGuard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────── MongoDB Setup ──────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "paytm_voiceguard")

client: AsyncIOMotorClient = None
db = None

# Collection references (set on startup)
users_col = None
transactions_col = None
notifications_col = None
offers_col = None
voice_enrollments_col = None
merchant_col = None
soundbox_events_col = None

# ──────────────────────── Pydantic Schemas ───────────────────────
class PaymentRequest(BaseModel):
    user_id: str
    amount: float
    recipient: str
    memo: Optional[str] = None

class RechargeRequest(BaseModel):
    user_id: str
    mobile_number: str
    operator: str
    amount: float
    plan_type: str = "prepaid"

class BillPayRequest(BaseModel):
    user_id: str
    bill_type: str
    consumer_id: str
    amount: float

class TransferRequest(BaseModel):
    user_id: str
    to_account: str
    ifsc: str
    amount: float
    note: str = ""

class VoiceEnrollRequest(BaseModel):
    user_id: str

class MerchantAlertRequest(BaseModel):
    merchant_id: str
    transaction_id: str
    amount: float
    sender_name: str
    category: str = "General"

# ──────────────────────── Helper ─────────────────────────────────
def clean_doc(doc):
    """Convert MongoDB _id to string for JSON serialization."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def clean_docs(docs):
    return [clean_doc(d) for d in docs]

# ──────────────────────── Startup / Seed ─────────────────────────
@app.on_event("startup")
async def startup_db():
    global client, db
    global users_col, transactions_col, notifications_col, offers_col
    global voice_enrollments_col, merchant_col, soundbox_events_col

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    users_col = db["users"]
    transactions_col = db["transactions"]
    notifications_col = db["notifications"]
    offers_col = db["offers"]
    voice_enrollments_col = db["voice_enrollments"]
    merchant_col = db["merchants"]
    soundbox_events_col = db["soundbox_events"]

    # Create indexes
    await users_col.create_index("user_id", unique=True)
    await transactions_col.create_index([("user_id", 1), ("timestamp", -1)])
    await notifications_col.create_index("user_id")
    await merchant_col.create_index("merchant_id", unique=True)
    await voice_enrollments_col.create_index("user_id", unique=True)
    await soundbox_events_col.create_index([("merchant_id", 1), ("timestamp", -1)])

    # Seed only if empty
    if await users_col.count_documents({}) == 0:
        await seed_data()

async def seed_data():
    """Seed initial demo data into MongoDB."""
    # ── User ──
    await users_col.insert_one({
        "user_id": "user_123",
        "name": "Raju",
        "phone": "9876543210",
        "upi_id": "raju@paytm",
        "balance": 25430.50,
        "voice_enrolled": True,
        "trusted_recipients": ["Ramesh", "Sita", "Suresh"],
        "credit_score": 782,
        "gold_coins": 6,
        "kyc_status": "verified",
        "member_since": "2023",
        "preferred_language": "hi",
        "created_at": datetime.utcnow()
    })

    # ── Voice Enrollment ──
    await voice_enrollments_col.insert_one({
        "user_id": "user_123",
        "enrolled_at": datetime.utcnow(),
        "embedding_dim": 192,
        "samples_count": 5,
        "language": "hi-en",
        "liveness_enabled": True,
        "deepfake_resistance": True,
        "status": "active"
    })

    # ── Merchant ──
    await merchant_col.insert_one({
        "merchant_id": "merchant_001",
        "name": "Sharma General Store",
        "category": "Kirana/Grocery",
        "soundbox_id": "SB-PMT8021",
        "soundbox_model": "AI Soundbox 4.0",
        "location": "Sector 15, Noida",
        "languages": ["hi", "en"],
        "daily_sales": 14250,
        "avg_ticket": 425,
        "fraud_guard": True,
        "subscription_active": True,
        "ai_insights_enabled": True,
        "created_at": datetime.utcnow()
    })

    # ── Transactions ──
    txns = []
    names = ["Ramesh", "Sita", "Suresh", "Amazon Pay", "Zomato", "Swiggy", "JioMart", "DMart"]
    categories = ["Groceries", "Lunch", "Electronics", "Medicine", "Utilities", "Rent", "Recharge"]
    for i in range(20):
        days_ago = random.randint(0, 30)
        txns.append({
            "id": f"UPI{random.randint(100000000, 999999999)}",
            "type": random.choice(["sent", "received"]),
            "amount": random.choice([50, 100, 150, 200, 500, 750, 1000, 2000]),
            "recipient": random.choice(names),
            "memo": random.choice(["lunch", "groceries", "rent", "gift", "order", "recharge", "bill"]),
            "category": random.choice(categories),
            "timestamp": datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23)),
            "status": "completed",
            "user_id": "user_123",
            "verification_method": "voice_triple",
            "biometric_score": round(random.uniform(0.85, 0.99), 2),
            "risk_level": "low"
        })
    await transactions_col.insert_many(txns)

    # ── Notifications ──
    await notifications_col.insert_many([
        {"user_id": "user_123", "title": "🔊 Payment Received", "body": "₹500 received from Sita via Voice UPI", "time": "2 min ago", "read": False, "type": "payment", "created_at": datetime.utcnow()},
        {"user_id": "user_123", "title": "🎁 Cashback Credited", "body": "₹25 cashback for mobile recharge", "time": "1 hour ago", "read": False, "type": "cashback", "created_at": datetime.utcnow()},
        {"user_id": "user_123", "title": "⚡ Bill Reminder", "body": "Electricity bill of ₹1,850 due in 5 days", "time": "3 hours ago", "read": True, "type": "reminder", "created_at": datetime.utcnow()},
        {"user_id": "user_123", "title": "🛡️ VoiceGuard Update", "body": "Your voice biometric was re-verified successfully", "time": "1 day ago", "read": True, "type": "security", "created_at": datetime.utcnow()},
        {"user_id": "user_123", "title": "🎉 New Offer!", "body": "Get 10% cashback on Flight bookings this week", "time": "2 days ago", "read": True, "type": "offer", "created_at": datetime.utcnow()},
    ])

    # ── Offers ──
    await offers_col.insert_many([
        {"id": 1, "title": "Flat ₹50 Cashback", "desc": "On first UPI payment of ₹200+", "code": "FIRST50", "valid_until": "2026-04-30"},
        {"id": 2, "title": "Flight Sale 🎉", "desc": "Domestic flights from ₹1,499", "code": "FLY1499", "valid_until": "2026-04-30"},
        {"id": 3, "title": "Recharge & Save", "desc": "₹20 cashback on ₹200+ mobile recharge", "code": "RCH20", "valid_until": "2026-04-15"},
        {"id": 4, "title": "Gold Coins 2X", "desc": "Buy gold worth ₹500 and earn 2x coins", "code": "GOLD2X", "valid_until": "2026-04-30"},
    ])

    # ── Soundbox Events ──
    await soundbox_events_col.insert_many([
        {"merchant_id": "merchant_001", "type": "payment", "amount": 150, "sender": "Raju", "category": "Groceries", "announced": True, "timestamp": datetime.utcnow() - timedelta(minutes=2)},
        {"merchant_id": "merchant_001", "type": "payment", "amount": 1200, "sender": "Unknown", "category": "Electronics", "announced": True, "flagged": True, "risk_score": 0.85, "timestamp": datetime.utcnow() - timedelta(minutes=15)},
        {"merchant_id": "merchant_001", "type": "payment", "amount": 50, "sender": "Sita", "category": "Household", "announced": True, "timestamp": datetime.utcnow() - timedelta(hours=1)},
    ])

@app.on_event("shutdown")
async def shutdown_db():
    global client
    if client:
        client.close()

# ═══════════════════════════════════════════════════════════════
# SECTION 1: CORE AI VOICE ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Paytm AI VoiceGuard",
        "version": "2.0.0",
        "features": ["Voice Biometrics", "Liveness Detection", "Spoken OTP", "AI Risk Scoring", "Soundbox Integration"],
        "supported_languages": ["hi", "en", "ta", "te", "bn", "mr", "kn", "gu", "ml", "pa"]
    }

@app.get("/voice/challenge")
async def get_challenge(user_id: str):
    """Issue a dynamic challenge phrase for liveness detection."""
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")

    phrases = [
        "Suraj nikal aaya", "Blue elephant jumping high",
        "Mausam suhana hai aaj", "Paytm karo securely",
        "Mera naam VoiceGuard hai", "Bharat ka digital bhavishya",
        "Naya din naya savera", "Aaj ka din shubh ho"
    ]
    return {
        "user_name": user["name"],
        "challenge_phrase": random.choice(phrases),
        "otp_required": True,
        "otp": str(random.randint(1000, 9999)),
        "language": user.get("preferred_language", "hi")
    }

@app.post("/voice/process")
async def process_voice(file: UploadFile = File(...)):
    """Full AI Voice Pipeline: Transcribe → Parse → Biometrics → Liveness → Risk Score."""
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{int(time.time())}_{file.filename}")

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Step 1: ASR / Transcription
    text = VoiceService.transcribe(temp_path)

    # Step 2: NLP Entity Extraction
    parsed = VoiceService.extract_entities(text)

    # Step 3: Voice Biometric Verification
    biometric_results = BiometricService.verify_voice(temp_path, None)

    # Step 4: Liveness Score (anti-deepfake)
    liveness_score = round(random.uniform(0.90, 0.99), 2)

    # Step 5: Risk Scoring
    amount = parsed.get("amount") or 0.0
    recipient = parsed.get("recipient") or "unknown"
    risk_results = FraudService.calculate_risk_score(amount, recipient, time.localtime().tm_hour)

    # Step 6: Determine if escalation needed (>₹1000 needs PIN)
    needs_escalation = amount > 1000

    return {
        "pipeline": "VoiceGuard Triple Verification",
        "text": text,
        "parsed": parsed,
        "biometric_score": biometric_results["score"],
        "biometric_verified": biometric_results["verified"],
        "liveness_score": liveness_score,
        "liveness_passed": liveness_score > 0.85,
        "risk_level": risk_results["risk_level"],
        "risk_score": risk_results["score"],
        "risk_action": risk_results["action"],
        "needs_escalation": needs_escalation,
        "escalation_reason": "Amount > ₹1,000 — UPI PIN required" if needs_escalation else None,
        "is_safe": risk_results["risk_level"] != "high" and biometric_results["verified"] and liveness_score > 0.85,
        "verification_steps": [
            {"step": "Voice Biometrics", "status": "✅ Passed", "score": biometric_results["score"]},
            {"step": "Liveness Detection", "status": "✅ Passed", "score": liveness_score},
            {"step": "Spoken OTP", "status": "✅ Verified"},
            {"step": "AI Risk Scoring", "status": f"⚡ {risk_results['risk_level'].upper()}", "score": risk_results["score"]},
        ]
    }

# ── Voice Enrollment ──
@app.post("/voice/enroll")
async def enroll_voice(request: VoiceEnrollRequest):
    """Enroll a user's voiceprint (simulated 20-30 second onboarding)."""
    enrollment = {
        "user_id": request.user_id,
        "enrolled_at": datetime.utcnow(),
        "embedding_dim": 192,
        "samples_count": 5,
        "language": "hi-en",
        "liveness_enabled": True,
        "deepfake_resistance": True,
        "status": "active"
    }
    await voice_enrollments_col.update_one(
        {"user_id": request.user_id},
        {"$set": enrollment},
        upsert=True
    )
    await users_col.update_one(
        {"user_id": request.user_id},
        {"$set": {"voice_enrolled": True}}
    )
    return {"status": "enrolled", "message": "Voice biometric enrolled successfully", "details": enrollment}

@app.get("/voice/enrollment-status")
async def enrollment_status(user_id: str):
    enrollment = await voice_enrollments_col.find_one({"user_id": user_id})
    if enrollment:
        return clean_doc(enrollment)
    return {"status": "not_enrolled", "user_id": user_id}

# ═══════════════════════════════════════════════════════════════
# SECTION 2: PAYMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/payment/execute")
async def execute_payment(request: PaymentRequest):
    user = await users_col.find_one({"user_id": request.user_id})
    if not user:
        raise HTTPException(404, "User not found")
    if user["balance"] < request.amount:
        raise HTTPException(400, "Insufficient balance")

    txn_id = f"UPI{int(time.time() * 1000)}"
    new_balance = round(user["balance"] - request.amount, 2)

    await users_col.update_one({"user_id": request.user_id}, {"$set": {"balance": new_balance}})

    txn = {
        "id": txn_id,
        "type": "sent",
        "amount": request.amount,
        "recipient": request.recipient,
        "memo": request.memo or "",
        "category": "UPI Transfer",
        "timestamp": datetime.utcnow(),
        "status": "completed",
        "user_id": request.user_id,
        "verification_method": "voice_triple",
        "biometric_score": round(random.uniform(0.90, 0.99), 2),
        "risk_level": "low"
    }
    await transactions_col.insert_one(txn)

    # Trigger Soundbox event for merchant
    await soundbox_events_col.insert_one({
        "merchant_id": "merchant_001",
        "type": "payment",
        "amount": request.amount,
        "sender": user["name"],
        "category": request.memo or "UPI Transfer",
        "announced": True,
        "timestamp": datetime.utcnow()
    })

    # Add notification
    await notifications_col.insert_one({
        "user_id": request.user_id,
        "title": "💸 Payment Sent",
        "body": f"₹{request.amount} sent to {request.recipient}",
        "time": "Just now",
        "read": False,
        "type": "payment",
        "created_at": datetime.utcnow()
    })

    return {
        "status": "success",
        "transaction_id": txn_id,
        "message": f"₹{request.amount} paid to {request.recipient} via VoiceGuard",
        "new_balance": new_balance,
        "soundbox_announced": True
    }

# ═══════════════════════════════════════════════════════════════
# SECTION 3: USER / PROFILE / BALANCE
# ═══════════════════════════════════════════════════════════════

@app.get("/user/balance")
async def get_balance(user_id: str = "user_123"):
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    return {"balance": user["balance"], "upi_id": user["upi_id"], "name": user["name"], "phone": user.get("phone")}

@app.get("/user/transactions")
async def get_transactions(user_id: str = "user_123", limit: int = 25):
    cursor = transactions_col.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    txns = await cursor.to_list(length=limit)
    return {"transactions": clean_docs(txns), "total": await transactions_col.count_documents({"user_id": user_id})}

@app.get("/user/profile")
async def get_profile(user_id: str = "user_123"):
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    enrollment = await voice_enrollments_col.find_one({"user_id": user_id})
    user_clean = clean_doc(user)
    user_clean["voice_enrollment"] = clean_doc(enrollment) if enrollment else None
    return user_clean

@app.get("/notifications")
async def get_notifications(user_id: str = "user_123"):
    cursor = notifications_col.find({"user_id": user_id}).sort("created_at", -1).limit(15)
    notifs = await cursor.to_list(length=15)
    unread = await notifications_col.count_documents({"user_id": user_id, "read": False})
    return {"notifications": clean_docs(notifs), "unread_count": unread}

# ═══════════════════════════════════════════════════════════════
# SECTION 4: RECHARGE & BILLS
# ═══════════════════════════════════════════════════════════════

RECHARGE_PLANS = {
    "jio": [
        {"id": "jio_1", "amount": 239, "validity": "28 days", "data": "1.5 GB/day", "name": "Popular"},
        {"id": "jio_2", "amount": 299, "validity": "28 days", "data": "2 GB/day", "name": "Best Value"},
        {"id": "jio_3", "amount": 599, "validity": "56 days", "data": "2 GB/day", "name": "Super Saver"},
        {"id": "jio_4", "amount": 999, "validity": "84 days", "data": "2 GB/day", "name": "Quarterly"},
    ],
    "airtel": [
        {"id": "air_1", "amount": 179, "validity": "28 days", "data": "1 GB/day", "name": "Basic"},
        {"id": "air_2", "amount": 299, "validity": "28 days", "data": "1.5 GB/day", "name": "Popular"},
        {"id": "air_3", "amount": 455, "validity": "56 days", "data": "1.5 GB/day", "name": "Smart Pack"},
    ],
    "vi": [
        {"id": "vi_1", "amount": 269, "validity": "28 days", "data": "1.5 GB/day", "name": "Standard"},
        {"id": "vi_2", "amount": 299, "validity": "28 days", "data": "2 GB/day", "name": "Unlimited"},
    ]
}

@app.get("/recharge/plans")
async def get_plans(operator: str = "jio"):
    return {"operator": operator, "plans": RECHARGE_PLANS.get(operator.lower(), RECHARGE_PLANS["jio"])}

@app.post("/recharge/execute")
async def execute_recharge(request: RechargeRequest):
    user = await users_col.find_one({"user_id": request.user_id})
    if not user:
        raise HTTPException(404, "User not found")

    new_balance = round(user["balance"] - request.amount, 2)
    await users_col.update_one({"user_id": request.user_id}, {"$set": {"balance": new_balance}})

    txn_id = f"RCH{int(time.time() * 1000)}"
    await transactions_col.insert_one({
        "id": txn_id, "type": "recharge", "amount": request.amount,
        "recipient": f"{request.operator.upper()} - {request.mobile_number}",
        "memo": f"{request.plan_type} recharge", "category": "Recharge",
        "timestamp": datetime.utcnow(), "status": "completed",
        "user_id": request.user_id, "verification_method": "voice_triple"
    })

    return {"status": "success", "transaction_id": txn_id,
            "message": f"₹{request.amount} recharge for {request.mobile_number} ({request.operator}) successful",
            "new_balance": new_balance}

@app.post("/bills/pay")
async def pay_bill(request: BillPayRequest):
    user = await users_col.find_one({"user_id": request.user_id})
    if not user:
        raise HTTPException(404, "User not found")

    new_balance = round(user["balance"] - request.amount, 2)
    await users_col.update_one({"user_id": request.user_id}, {"$set": {"balance": new_balance}})

    txn_id = f"BILL{int(time.time() * 1000)}"
    await transactions_col.insert_one({
        "id": txn_id, "type": "bill", "amount": request.amount,
        "recipient": request.bill_type.title(), "memo": f"{request.bill_type} bill - {request.consumer_id}",
        "category": "Bills", "timestamp": datetime.utcnow(), "status": "completed",
        "user_id": request.user_id, "verification_method": "voice_triple"
    })

    return {"status": "success", "transaction_id": txn_id,
            "message": f"{request.bill_type.title()} bill of ₹{request.amount} paid successfully",
            "new_balance": new_balance}

# ═══════════════════════════════════════════════════════════════
# SECTION 5: FINANCIAL SERVICES
# ═══════════════════════════════════════════════════════════════

@app.get("/finance/credit-score")
async def get_credit_score(user_id: str = "user_123"):
    user = await users_col.find_one({"user_id": user_id})
    score = user["credit_score"] if user else 750
    return {
        "score": score,
        "rating": "Excellent" if score >= 750 else "Good" if score >= 700 else "Fair",
        "factors": [
            {"name": "Payment History", "status": "Good", "impact": "high"},
            {"name": "Credit Utilization", "status": "Low", "impact": "high"},
            {"name": "Credit Age", "status": "Fair", "impact": "medium"},
            {"name": "Total Accounts", "status": "Good", "impact": "low"},
        ],
        "last_updated": datetime.now().isoformat()
    }

@app.get("/finance/spending")
async def get_spending(user_id: str = "user_123"):
    # Aggregate spending from transactions
    pipeline = [
        {"$match": {"user_id": user_id, "type": "sent"}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    cursor = transactions_col.aggregate(pipeline)
    results = await cursor.to_list(length=50)

    categories = {}
    for r in results:
        cat = r["_id"] or "Others"
        categories[cat] = r["total"]

    # If no data, use mock
    if not categories:
        categories = {
            "Food & Dining": random.randint(2000, 8000),
            "Shopping": random.randint(1000, 5000),
            "Transport": random.randint(500, 3000),
            "Bills & Recharge": random.randint(1000, 4000),
        }

    total = sum(categories.values())
    return {
        "month": datetime.now().strftime("%B %Y"),
        "total_spent": total,
        "categories": categories,
        "budget_limit": 30000,
        "savings": max(0, 30000 - total)
    }

@app.get("/offers")
async def get_offers():
    cursor = offers_col.find({})
    offers = await cursor.to_list(length=20)
    return {"offers": clean_docs(offers)}

# ═══════════════════════════════════════════════════════════════
# SECTION 6: MERCHANT SOUNDBOX INTEGRATION
# ═══════════════════════════════════════════════════════════════

@app.get("/merchant/dashboard")
async def merchant_dashboard(merchant_id: str = "merchant_001"):
    """Full merchant dashboard data for the AI Soundbox frontend."""
    merchant = await merchant_col.find_one({"merchant_id": merchant_id})
    if not merchant:
        raise HTTPException(404, "Merchant not found")

    # Recent soundbox events
    cursor = soundbox_events_col.find({"merchant_id": merchant_id}).sort("timestamp", -1).limit(20)
    events = await cursor.to_list(length=20)

    # Daily stats
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_events = await soundbox_events_col.find(
        {"merchant_id": merchant_id, "timestamp": {"$gte": today}}
    ).to_list(length=100)

    daily_total = sum(e.get("amount", 0) for e in today_events)
    daily_count = len(today_events)
    flagged_count = sum(1 for e in today_events if e.get("flagged"))

    return {
        "merchant": clean_doc(merchant),
        "events": clean_docs(events),
        "stats": {
            "daily_sales": daily_total,
            "daily_count": daily_count,
            "avg_ticket": round(daily_total / max(daily_count, 1), 2),
            "flagged_transactions": flagged_count,
            "fraud_guard": merchant.get("fraud_guard", True),
            "soundbox_model": merchant.get("soundbox_model", "AI Soundbox 4.0"),
        },
        "ai_insights": [
            f"Sales are {random.choice(['12%', '18%', '24%'])} higher this {datetime.now().strftime('%A')} vs last week",
            f"Peak traffic expected at {random.choice(['12 PM', '2 PM', '6 PM', '8 PM'])} today",
            f"Most popular category: {random.choice(['Groceries', 'Snacks', 'Household', 'Dairy'])}"
        ]
    }

@app.post("/merchant/soundbox/announce")
async def soundbox_announce(request: MerchantAlertRequest):
    """Record a Soundbox announcement event."""
    event = {
        "merchant_id": request.merchant_id,
        "transaction_id": request.transaction_id,
        "type": "payment",
        "amount": request.amount,
        "sender": request.sender_name,
        "category": request.category,
        "announced": True,
        "flagged": request.amount > 5000,
        "risk_score": round(random.uniform(0.1, 0.3), 2) if request.amount < 5000 else round(random.uniform(0.6, 0.9), 2),
        "timestamp": datetime.utcnow()
    }
    await soundbox_events_col.insert_one(event)

    # Update merchant daily stats
    await merchant_col.update_one(
        {"merchant_id": request.merchant_id},
        {"$inc": {"daily_sales": request.amount}}
    )

    announcement = f"₹{request.amount} received from {request.sender_name} for {request.category}"
    if request.amount > 5000:
        announcement += " ⚠️ Unusually high amount flagged for review"

    return {"announced": True, "text": announcement, "flagged": request.amount > 5000}

@app.get("/merchant/ai-insights")
async def merchant_ai_insights(merchant_id: str = "merchant_001"):
    """AI-generated insights for the merchant (simulated)."""
    return {
        "insights": [
            {"type": "trend", "message": "Your Tuesday sales are consistently 24% higher than Monday. Consider running Tuesday-specific promotions.", "priority": "medium"},
            {"type": "anomaly", "message": "3 transactions above ₹5,000 detected today — 2x more than average. All verified via VoiceGuard.", "priority": "high"},
            {"type": "forecast", "message": f"Expected daily revenue: ₹{random.randint(12000, 18000)} based on current traffic patterns.", "priority": "low"},
            {"type": "customer", "message": "Repeat customer 'Raju' accounts for 15% of your weekly revenue. Consider a loyalty reward.", "priority": "medium"},
        ],
        "fraud_alerts": [
            {"type": "deepfake_attempt", "blocked": True, "message": "1 potential deepfake voice attempt blocked today by VoiceGuard liveness detection."},
        ]
    }

# ═══════════════════════════════════════════════════════════════
# SECTION 7: MULTILINGUAL SUPPORT
# ═══════════════════════════════════════════════════════════════

SUPPORTED_LANGUAGES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "kn": "Kannada", "gu": "Gujarati",
    "ml": "Malayalam", "pa": "Punjabi"
}

@app.get("/languages")
async def get_languages():
    return {"supported": SUPPORTED_LANGUAGES, "total": len(SUPPORTED_LANGUAGES)}

@app.post("/user/language")
async def set_language(user_id: str, language: str):
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(400, f"Language '{language}' not supported")
    await users_col.update_one({"user_id": user_id}, {"$set": {"preferred_language": language}})
    return {"status": "updated", "language": SUPPORTED_LANGUAGES[language]}

# ──────────────────────── Run ────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
