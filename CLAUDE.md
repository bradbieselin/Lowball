# Lowball — CLAUDE.md

## IMPORTANT: Before making any changes, read LESSONS.md first.
LESSONS.md contains a master list of bugs, fixes, and patterns learned during development. Every fix there was learned the hard way. Do not repeat past mistakes.

## Project Overview
Lowball is a mobile app where users snap a photo of any product and AI finds the cheapest deals across the internet. Point. Snap. Save.

## Tech Stack
- **Frontend:** React Native (Expo SDK 54), TypeScript
- **Backend:** Express.js 5 / TypeScript (runs locally, will deploy to Railway)
- **Database:** PostgreSQL via Supabase (Prisma ORM v6)
- **Auth:** Supabase Auth (email/password, Google OAuth + Apple Sign-In planned)
- **AI Vision:** OpenAI GPT-4o Vision API (product identification + deal estimation)
- **Image Storage:** Supabase Storage (`scan-images` bucket)
- **Navigation:** @react-navigation/native + native-stack
- **State:** React Query (TanStack Query) for server state, useState for UI
- **Haptics:** expo-haptics
- **Camera:** expo-camera + expo-image-picker + expo-image-manipulator
- **UI:** expo-linear-gradient, expo-blur

## Project Structure
```
/                       — Expo frontend (React Native)
  src/
    screens/            — All app screens
    screens/auth/       — SignIn, SignUp, ForgotPassword
    components/         — ScanCard, DealCard (React.memo wrapped)
    navigation/         — RootNavigator, AuthStack
    hooks/              — useAuth, useScans, useUser
    services/           — api.ts (fetch wrapper with 401 interceptor)
    contexts/           — AuthContext
    constants/          — colors.ts, typography.ts
    types/              — api.ts (typed API responses)
    utils/              — formatters.ts, share.ts
    lib/                — supabase.ts client
  .env                  — EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL

/server                 — Express.js backend
  src/
    routes/             — scan.ts, user.ts
    middleware/          — auth.ts (Supabase JWT verification + auto user creation)
    services/           — ai.ts (GPT-4o vision), deals.ts (GPT-4o deal estimation)
    lib/                — prisma.ts
  prisma/
    schema.prisma       — 5 models: User, Scan, Deal, SavedScan, ClickTracking
  .env                  — DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
```

## Design System
- **Dark mode only** at launch
- Background: #0D0D0D
- Surface: #1A1A1A
- Surface light: #2A2A2A
- Accent (green, means money saved): #00E676
- Accent dim (pressed): #00C853
- Text primary: #FFFFFF
- Text secondary: #A0A0A0
- Text muted: #666666
- Danger (original price, errors): #FF5252
- Border: #333333
- Font: Inter (Bold 700, SemiBold 600, Regular 400)
- Border radius: 12px on cards, 8px on thumbnails
- Haptic feedback on scan, results load, and saves

## App Structure
No tabs. Single-flow: Home -> Scan -> Results. Profile via button.

### Navigation Stack
- AuthStack (SignIn, SignUp, ForgotPassword)
- Onboarding (3 slides, first launch only)
- Home (recent scans list top, scan button bottom)
- Camera (full screen camera)
- Scanning (loading screen with animations)
- Results (product info + deal list)
- Profile (stats, saved deals, settings)

## Database Tables (Prisma model names → SQL table names)
- User → app_users (NOT "users" — Supabase reserves that)
- Scan → scans
- Deal → deals
- SavedScan → saved_scans (unique on userId+scanId)
- ClickTracking → click_tracking

## API Endpoints
- POST /api/scan — accepts image (base64 in JSON body), runs GPT-4o vision + deal search
- GET /api/scan/:id — retrieve scan with deals (filtered by userId)
- GET /api/scans — user scan history (paginated, max 50 per page)
- POST /api/scan/:id/save — bookmark a scan (verifies ownership)
- DELETE /api/scan/:id/save — remove bookmark
- GET /api/user/profile — get profile + stats
- PUT /api/user/profile — update email (validated)
- GET /api/user/stats — savings stats
- POST /api/track/click — track deal click (fire-and-forget from frontend)

## Running Locally
```bash
# Terminal 1: Server
cd server && npx ts-node src/index.ts

# Terminal 2: Expo
npx expo start
```
Phone must be on same Wi-Fi. API URL in .env points to local IP.

## Rules
- Green (#00E676) always means money saved
- Never block the user if an ad fails to load
- Minimum 3 second display on scanning screen even if results come back faster
- Image compression to max 1MB JPEG quality 0.7 before upload
- All prices sorted low to high by default
- Haptic feedback on: scan tap, photo capture, results loaded, deal saved
- Deal prices are AI estimates — always show disclaimer and link to real retailer search pages
- All API routes must verify userId ownership before returning/modifying data
- The auth middleware auto-creates app_users records on first API call (upsert)
