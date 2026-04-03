/**
 * Centralized App Configuration
 * 
 * Reads from environment variables (EXPO_PUBLIC_*) so you can switch
 * between dev and production by changing the .env file:
 * 
 *   DEV  → .env                (localtunnel / LAN URL)
 *   PROD → .env.production     (deployed server URL)
 * 
 * For production builds (EAS Build / expo build), Expo automatically
 * picks up .env.production. For local dev, it uses .env.
 */

// ── Backend URL ─────────────────────────────────────────────────────
// Priority: EXPO_PUBLIC_BACKEND_URL env var  →  fallback to tunnel URL
const DEV_FALLBACK = 'https://paytm-voice-api-98342.loca.lt';

export const BACKEND_URL: string =
  process.env.EXPO_PUBLIC_BACKEND_URL || DEV_FALLBACK;

// Keep the local URL available in case you need LAN-only dev
export const BACKEND_LOCAL: string =
  process.env.EXPO_PUBLIC_BACKEND_LOCAL || 'http://192.168.1.6:8000';

// ── Feature Flags / Meta ────────────────────────────────────────────
export const IS_PRODUCTION: boolean =
  BACKEND_URL !== DEV_FALLBACK && !BACKEND_URL.includes('loca.lt');

// Paytm success sound (CDN-hosted, same for all envs)
export const PAYTM_SUCCESS_SOUND =
  'https://res.cloudinary.com/da2imhgtf/video/upload/v1774766529/New_Project_5_w3uzoe.mp3';
