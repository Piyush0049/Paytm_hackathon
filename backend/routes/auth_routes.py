"""
Paytm AI VoiceGuard - Auth Routes
Handles OTP delivery, signup with ₹1000 bonus, and login
"""
from fastapi import APIRouter, HTTPException, Request
from database import cols
from auth_utils import get_password_hash, verify_password, create_access_token
from services.email_service import send_email_otp
from datetime import datetime
import random, uuid, time

router = APIRouter()

# ─────────────────────── SEND OTP ───────────────────────
@router.post("/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    identifier = body.get("email") or body.get("phone") or ""
    if not identifier:
        raise HTTPException(400, "Email is required")

    otp_code = str(random.randint(1000, 9999))
    await cols.otps.update_one(
        {"email": identifier},
        {"$set": {"otp": otp_code, "email": identifier, "created_at": datetime.utcnow()}},
        upsert=True
    )

    if "@" in identifier:
        sent = send_email_otp(identifier, otp_code)
        if sent:
            return {"status": "success", "message": "OTP sent to your email"}
    else:
        print(f"🔑 DEBUG OTP for {identifier}: {otp_code}")

    return {"status": "success", "message": "OTP generated (check backend terminal)", "debug_otp": otp_code}

# ─────────────────────── SIGNUP ───────────────────────
@router.post("/signup")
async def signup(request: Request):
    body = await request.json()
    identifier = body.get("email") or body.get("phone") or ""
    name = body.get("name", "User")
    password = body.get("password", "")
    otp = body.get("otp", "")

    if not identifier or not password or not otp:
        raise HTTPException(400, "All fields are required")

    if await cols.users.find_one({"email": identifier}):
        raise HTTPException(400, "Already registered")

    otp_rec = await cols.otps.find_one({"email": identifier})
    if not otp_rec or otp_rec.get("otp") != otp:
        raise HTTPException(400, "Invalid or expired OTP")

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    upi_prefix = identifier.split("@")[0] if "@" in identifier else identifier

    await cols.users.insert_one({
        "user_id": user_id,
        "name": name,
        "email": identifier,
        "password": get_password_hash(password),
        "upi_id": f"{upi_prefix}@paytm",
        "balance": 1000.0,
        "voice_enrolled": False,
        "trusted_recipients": [],
        "credit_score": 750,
        "gold_coins": 0,
        "kyc_status": "pending",
        "member_since": str(datetime.now().year),
        "preferred_language": "en",
        "created_at": datetime.utcnow()
    })

    # Welcome notification
    await cols.notifications.insert_one({
        "user_id": user_id,
        "title": "Welcome to Paytm!",
        "body": "₹1,000 signup bonus credited to your wallet.",
        "time": "Just now", "read": False, "type": "welcome",
        "created_at": datetime.utcnow()
    })

    # Bonus transaction record
    await cols.transactions.insert_one({
        "id": f"UPI{int(time.time()*1000)}",
        "type": "received", "amount": 1000.0,
        "recipient": "Paytm Cashback", "memo": "Signup Bonus",
        "category": "Cashback", "timestamp": datetime.utcnow(),
        "status": "completed", "user_id": user_id,
        "verification_method": "system", "biometric_score": 1.0, "risk_level": "low"
    })

    await cols.otps.delete_one({"email": identifier})
    token = create_access_token({"sub": user_id})
    return {"status": "success", "token": token, "user_id": user_id, "name": name, "message": "Signup successful with ₹1000 bonus!"}

# ─────────────────────── LOGIN ───────────────────────
@router.post("/login")
async def login(request: Request):
    body = await request.json()
    identifier = body.get("email") or body.get("phone") or ""
    password = body.get("password", "")
    otp = body.get("otp", "")

    if not identifier or not password or not otp:
        raise HTTPException(400, "All fields are required")

    user = await cols.users.find_one({"email": identifier})
    if not user or not verify_password(password, user.get("password", "")):
        raise HTTPException(401, "Invalid credentials")

    otp_rec = await cols.otps.find_one({"email": identifier})
    if not otp_rec or otp_rec.get("otp") != otp:
        raise HTTPException(400, "Invalid or expired OTP")

    await cols.otps.delete_one({"email": identifier})
    token = create_access_token({"sub": user["user_id"]})
    return {"status": "success", "token": token, "user_id": user["user_id"], "name": user["name"]}
