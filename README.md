# 🛡️ Paytm AI VoiceGuard

### Secure, AI-Powered Voice UPI Payments with Deep Soundbox Integration

**Team DREAMTECH** | Paytm Project AI – Build for India 2026

---

## 🚀 What is VoiceGuard?

**Paytm AI VoiceGuard** is an AI-first, voice-activated payment assistant deeply integrated into the Paytm mobile app and the AI Soundbox ecosystem. It enables **natural, hands-free UPI transactions** using only voice — no typing, no screen interaction required.

> 💡 Addresses 300M+ low-literacy, rural, disabled, and driving users in India

---

## 🔒 Triple Hands-Free Verification (Zero Touch)

| Layer | Technology | Purpose |
|---|---|---|
| 🎙️ **Voice Biometrics** | Speaker embedding (ECAPA-TDNN) | Matches against enrolled voiceprint |
| 🧠 **Liveness Detection** | Dynamic challenge phrase + temporal analysis | Blocks replay attacks & deepfakes |
| 🔢 **Spoken OTP** | Time-bound numeric code | Prevents shoulder-surfing |
| ⚡ **AI Risk Scoring** | Behavioral anomaly detection | Flags unusual transactions |

### Transaction Limits
- **≤ ₹1,000** → Fully voice end-to-end
- **> ₹1,000** → Graceful escalation to UPI PIN / biometric

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  FastAPI Backend  │────▶│    MongoDB      │
│   (Expo/RN)     │     │  (AI Pipeline)   │     │  (7 Collections)│
│                 │     │                  │     │                 │
│ • Paytm UI      │     │ • Voice ASR      │     │ • users         │
│ • Voice Capture  │     │ • NLP Parsing    │     │ • transactions  │
│ • Triple Verify  │     │ • Biometrics     │     │ • notifications │
│ • 10 Languages   │     │ • Risk Engine    │     │ • offers        │
└────────┬────────┘     │ • Soundbox API   │     │ • merchants     │
         │              └────────┬─────────┘     │ • voice_enroll  │
         │                       │               │ • soundbox_evts │
         │              ┌────────▼─────────┐     └─────────────────┘
         └─────────────▶│ Merchant Dashboard│
                        │ (Next.js)        │
                        │                  │
                        │ • AI Soundbox 4.0│
                        │ • Live Ledger    │
                        │ • Fraud Alerts   │
                        │ • AI Insights    │
                        └──────────────────┘
```

---

## 🌐 Supported Languages

Hindi, English, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati, Malayalam, Punjabi (10 languages with regional accent handling)

---

## 📱 Tech Stack

| Layer | Technology |
|---|---|
| **Mobile** | Expo SDK 54, React Native 0.81, TypeScript |
| **Backend** | Python, FastAPI, Motor (async MongoDB) |
| **Database** | MongoDB (7 collections, indexed) |
| **AI/ML** | faster-whisper, SpeechBrain, spaCy, scikit-learn |
| **Frontend** | Next.js 16, React 19, Tailwind CSS |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, Python 3.10+, MongoDB running locally
- Expo Go app on your phone

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Server runs on http://localhost:8000
```

### 2. Merchant Dashboard
```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:3000
```

### 3. Mobile App
```bash
cd mobile
npm install
npx expo start --lan --clear
# Scan QR with Expo Go (same Wi-Fi)
```

### Environment Variables

**backend/.env**
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=paytm_voiceguard
PORT=8000
```

**frontend/.env.local**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 📊 API Endpoints (20+)

### Core AI Voice
| Method | Endpoint | Description |
|---|---|---|
| GET | `/voice/challenge` | Issue dynamic challenge phrase |
| POST | `/voice/process` | Full AI verification pipeline |
| POST | `/voice/enroll` | Enroll voice biometric |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payment/execute` | Execute UPI payment |
| GET | `/user/balance` | Get wallet balance |
| GET | `/user/transactions` | Transaction history |

### Services
| Method | Endpoint | Description |
|---|---|---|
| GET | `/recharge/plans` | Mobile recharge plans |
| POST | `/recharge/execute` | Execute recharge |
| POST | `/bills/pay` | Pay utility bills |

### Merchant Soundbox
| Method | Endpoint | Description |
|---|---|---|
| GET | `/merchant/dashboard` | Full merchant data |
| POST | `/merchant/soundbox/announce` | Trigger announcement |
| GET | `/merchant/ai-insights` | AI-generated insights |

---

## 🎯 Demo Flow

1. **Open Mobile App** → Tap **"Voice Pay"** button
2. **Speak**: *"Hey Paytm, pay 150 to Ramesh for groceries"*
3. **AI Pipeline**: ASR → NLP → Biometric Match → Challenge Phrase → Spoken OTP → Risk Score
4. **Success**: Payment confirmed, balance updated in MongoDB
5. **Merchant Soundbox**: *"₹150 received from Raju for groceries"* (auto-announced)
6. **Dashboard**: Real-time transaction appears with triple verification badge

---

## 🔮 Market Opportunity

- NPCI Hello UPI only offers basic conversational voice
- **No competitor** has integrated in-app + Soundbox voice flow with triple verification
- Can drive **25-30% higher merchant transaction volume**
- Target: **5M new merchants**, higher Soundbox retention, UPI share gains

---

**Built with ❤️ by Team DREAMTECH**
