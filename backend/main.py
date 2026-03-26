"""
╔══════════════════════════════════════════════════════════════╗
║         Paytm AI VoiceGuard - Backend Server v2.0           ║
║    Secure Voice UPI Payments with Deep Soundbox Integration  ║
║                      Team DREAMTECH                          ║
╚══════════════════════════════════════════════════════════════╝
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging

# Silence annoying passlib warning about bcrypt version
logging.getLogger("passlib").setLevel(logging.ERROR)

from database import connect_db, close_db
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.payment_routes import router as payment_router
from routes.merchant_routes import router as merchant_router

# ─── Lifespan (replaces deprecated on_event) ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print("🚀 Paytm AI VoiceGuard v2.0 is LIVE")
    yield
    await close_db()

# ─── App Factory ───
app = FastAPI(
    title="Paytm AI VoiceGuard",
    description="Secure, AI-Powered Voice UPI Payments with Deep Soundbox Integration",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount Routers ───
app.include_router(auth_router,     prefix="/auth",     tags=["🔐 Authentication"])
app.include_router(user_router,     prefix="/user",     tags=["👤 User"])
app.include_router(payment_router,                      tags=["💳 Payments & Voice"])
app.include_router(merchant_router, prefix="/merchant", tags=["🏪 Merchant & Soundbox"])

# ─── Health Check ───
@app.get("/", tags=["System"])
async def health():
    return {
        "status": "active",
        "service": "Paytm AI VoiceGuard",
        "version": "2.0.0",
        "team": "DREAMTECH",
        "features": [
            "Triple-Layer Voice Verification",
            "AI Risk Scoring",
            "Soundbox Integration",
            "Email OTP Authentication",
        ]
    }

# ─── Run ───
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
