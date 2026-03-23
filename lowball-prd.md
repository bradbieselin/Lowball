# Lowball — Product Requirements Document (PRD)
# Version 1.0 | March 2026

---

## 1. Product Overview

**App Name:** Lowball
**Tagline:** "Point. Snap. Save."
**One-liner:** Snap a photo of anything. Lowball finds it cheaper.

**Platform:** iOS (primary), Android (future)
**Stack:** React Native (Expo), Supabase, RevenueCat, AI Vision API
**Bundle ID:** com.bradbieselin.lowball (suggested)

### What It Does
Lowball is a dead-simple shopping app. You take a photo of any product — a lamp, a pair of shoes, a blender, a couch, literally anything — and Lowball uses AI to identify it, then searches the internet for the best deals across major retailers. You get a sorted list of prices with direct links to buy. That's it.

### Why It Wins
- **Simpler than Shop AI** — no clutter, no feature bloat, just scan and save
- **Broader than Dupe.com** — not limited to fashion/furniture dupes, works on anything
- **More focused than Google Lens** — purpose-built for deal-finding, not general search
- **Viral by design** — every scan is a shareable moment ("I saved $153 on this couch")

### Target Audience
- **Primary:** Gen Z women and men (18–30) who shop online frequently
- **Secondary:** Budget-conscious millennials, deal hunters, thrift culture enthusiasts
- **Psychographic:** People who screenshot products on TikTok/Instagram and want to find them cheaper

---

## 2. Design Language

### Color Palette
Use Apple's built-in semantic/system colors for everything **except** the green accent. This ensures the app looks native in both light and dark mode automatically.

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `systemBackground` | App background |
| `surface` | `secondarySystemBackground` | Cards, sheets, elevated surfaces |
| `surfaceLight` | `tertiarySystemBackground` | Secondary surfaces, input fields |
| `accent` | `#00E676` | Primary CTA, price highlights, savings badge (green = money saved) |
| `accentDim` | `#00C853` | Pressed state for accent |
| `textPrimary` | `label` | Headings, primary text |
| `textSecondary` | `secondaryLabel` | Labels, captions, timestamps |
| `textMuted` | `tertiaryLabel` | Disabled text, placeholders |
| `danger` | `systemRed` | Original/high price, errors |
| `border` | `separator` | Dividers, card borders |
| `scanRing` | `#00E676` | Scan button glow ring |

All non-accent colors adapt automatically to the user's system appearance (light or dark).

### Typography
Use the Apple system font (SF Pro) via the system default rather than a custom font. This keeps the app feeling native and avoids bundling font assets.

| Style | Font | Size | Weight |
|-------|------|------|--------|
| H1 (screen title) | System (SF Pro) | 28px | Bold (700) |
| H2 (section title) | System (SF Pro) | 22px | SemiBold (600) |
| H3 (card title) | System (SF Pro) | 18px | SemiBold (600) |
| Body | System (SF Pro) | 16px | Regular (400) |
| Caption | System (SF Pro) | 13px | Regular (400) |
| Price (deal) | System (SF Pro) | 24px | Bold (700) |
| Price (original/crossed out) | System (SF Pro) | 16px | Regular (400) |
| Savings badge | System (SF Pro) | 14px | Bold (700) |

### Design Principles
1. **System theme by default** — respects the user's iPhone light/dark mode setting automatically
2. **Maximum whitespace** — the app breathes; nothing feels cramped
3. **One action per screen** — every screen has one obvious thing to do
4. **Green = money saved** — the accent color always means "you're saving"
5. **No visual noise** — no gradients, no shadows, no decorative elements
6. **Haptic feedback** — subtle taps on scan, results load, and saves

---

## 3. App Architecture

### Screen Map
```
Launch → Auth (Sign Up / Sign In)
              ↓
         Onboarding (3 slides — how it works)
              ↓
         Home Screen
         ├── Scan Button (center, primary CTA)
         ├── Recent Scans (scrollable list below)
         └── Profile Button (top right)
              ↓
         Camera View → Scanning/Loading (ad plays here)
              ↓
         Results Screen
         ├── Product identified (image + name)
         ├── Deal list (sorted by price, low to high)
         ├── Share button
         └── Save/Bookmark button
              ↓
         External browser (affiliate link tap)

Profile Screen
├── Savings Stats (total saved, scans completed)
├── Saved Deals (bookmarked items)
├── Account Settings
│   ├── Update Email
│   ├── Change Password
│   └── Reset Password
├── Remove Ads (IAP upsell)
├── Rate App
├── Privacy Policy
├── Terms of Service
└── Sign Out / Delete Account
```

### Tab Structure
**No tabs.** The app is a single-flow experience. Home → Scan → Results. Profile is accessed via a button. Saved deals are in the profile. This keeps the UI as clean as possible.

---

## 4. Screen-by-Screen Specification

### 4.1 — Splash Screen
- App icon centered on `systemBackground` (adapts to light/dark mode)
- Brief fade-in animation (0.3s)
- Auto-navigates to Auth or Home based on auth state

### 4.2 — Auth Screen
**Two states: Sign Up and Sign In (toggle between them)**

**Sign Up:**
- Email input field
- Password input field (min 8 characters)
- "Sign Up" button (`accent` green)
- "Already have an account? Sign In" link below
- Divider with "or"
- "Continue with Google" button (outlined, white)
- "Continue with Apple" button (outlined, white)
- Terms/Privacy links at bottom (small text)

**Sign In:**
- Email input field
- Password input field
- "Sign In" button (`accent` green)
- "Forgot Password?" link below password field
- "Don't have an account? Sign Up" link below
- Divider with "or"
- Google and Apple sign-in buttons

**Forgot Password (modal or new screen):**
- Email input
- "Send Reset Link" button
- Success state: "Check your email for a reset link"

**Auth Notes:**
- Apple Sign-In is REQUIRED by Apple since Google login is offered
- Supabase Auth handles email/password, Google OAuth, and Apple Sign-In
- No username or profile photo at signup — keep it minimal
- Store `user_id`, `email`, `created_at`, `subscription_status` in Supabase

### 4.3 — Onboarding (First Launch Only)
**3 simple slides. No skip button on slides 1-2. "Get Started" on slide 3.**

**Slide 1: "Snap It"**
- Large camera icon or illustration (centered)
- "Take a photo of any product you see"
- Subtitle: "In a store, online, at a friend's house — anywhere"

**Slide 2: "Find It Cheaper"**
- Price tag or search icon
- "Lowball searches the internet for the best deals"
- Subtitle: "We check Amazon, Walmart, Target, eBay & more"

**Slide 3: "Save Big"**
- Money/savings icon
- "Get direct links to the lowest prices"
- Subtitle: "Track how much you save over time"
- [Get Started] button (`accent` green, full width)

**Onboarding Notes:**
- Horizontal swipe between slides
- Dot indicators at bottom
- Only shown on first app launch (store flag in AsyncStorage)
- Clean, minimal illustrations — not photos

### 4.4 — Home Screen
**The core of the app. Intentionally minimal.**

**Layout (top to bottom):**

**Header Bar:**
- Left: "Lowball" wordmark (Inter Bold, 22px, white)
- Right: Profile avatar/icon button (circle, 36px, `surfaceLight` background with user initial or default icon)

**Scan Button (center hero element):**
- Large circular button (120px diameter)
- `accent` green background
- Camera icon (white, centered)
- Subtle glow/pulse animation on the ring (green, 2px, slow pulse)
- Label below: "Scan a Product" (caption, `textSecondary`)
- Tapping opens Camera View

**Recent Scans Section:**
- Section header: "Recent Scans" (H3, left-aligned)
- If no scans yet: empty state illustration + "Your scans will appear here" (centered, `textMuted`)
- If scans exist: vertical scrollable list of ScanCard components

**ScanCard Component:**
- Horizontal card (full width, `surface` background, 12px border radius)
- Left: Product thumbnail (60x60, rounded 8px)
- Center:
  - Product name (Body, white, 1 line, truncated)
  - Best price found: "$XX.XX" (`accent` green, Price style)
  - Original/retail price: "~~$XX.XX~~" (`danger` red, strikethrough, smaller)
- Right: Savings badge pill ("Save $XX" or "Save XX%", `accent` bg, black text, small)
- Tapping a ScanCard reopens that scan's Results Screen
- 12px gap between cards

### 4.5 — Camera View
**Full-screen camera with minimal overlay.**

**Layout:**
- Full-screen camera preview (rear camera default)
- Top left: Back arrow (white, tapping returns to Home)
- Top right: Flash toggle icon (auto/on/off)
- Bottom center: Shutter button (white circle, 72px, with inner circle)
- Bottom left: Photo library button (small thumbnail of last photo, rounded)
- Center: Subtle crosshair or frame guide (thin white lines, low opacity) — helps users center the product
- No text overlays, no instructions — the camera speaks for itself

**Behavior:**
- Camera opens immediately with rear-facing camera
- Tap shutter to capture
- Tap photo library icon to select from camera roll
- After capture, brief preview (0.5s) then auto-navigate to Scanning screen
- No crop/edit step — keep it instant

**Permissions:**
- Camera permission prompt on first use (system dialog)
- Photo library permission if they tap the library button
- If camera denied: show friendly message with "Open Settings" button

### 4.6 — Scanning / Loading Screen
**This is where ads play. The user is waiting, so they're a captive audience.**

**Layout:**
- Product image (the photo they just took) displayed at top (rounded, 200x200, centered)
- Below image: animated scanning indicator
  - Option A: A green line sweeping across the product image (like a barcode scan effect)
  - Option B: Pulsing green ring around the image
- Below animation: rotating status messages (fade in/out every 2s):
  - "Identifying product..."
  - "Searching for deals..."
  - "Checking Amazon..."
  - "Checking Walmart..."
  - "Checking eBay..."
  - "Finding you the best price..."
- Below status: Ad unit (banner or interstitial)

**Ad Logic:**
- Free users: Show an interstitial ad during every scan (the scan takes 3-8 seconds, perfect for a short ad)
- Alternative: Show interstitial every 2-3 scans instead (test both)
- Pro users (removed ads): No ad shown, just the scanning animation
- Ad format: AdMob interstitial or rewarded interstitial
- If ad fails to load, just show the scanning animation — never block the user

**Timing:**
- AI identification: ~1-3 seconds
- Deal search: ~2-5 seconds
- Total: 3-8 seconds typical
- Minimum display time: 3 seconds (even if results come back faster, don't feel rushed)
- Maximum: 15 seconds, then show whatever results are available with a "Still searching..." option

### 4.7 — Results Screen
**The payoff. A clean list of deals sorted by price.**

**Layout (top to bottom):**

**Header Bar:**
- Left: Back arrow (returns to Home)
- Center: "Results" (H3)
- Right: Share button (share icon)

**Product Card (top section):**
- Product image (the user's photo, rounded, 80x80, left-aligned)
- Product name (H3, white): AI-identified name (e.g., "Nike Air Max 90 — White/Red")
- Product category tag (pill badge, `surfaceLight`): "Shoes" / "Electronics" / "Furniture" etc.
- If AI confidence is low: "We think this is..." prefix (italic, `textSecondary`)

**Deal List (main section):**
- Section header: "Deals Found" with count: "(8 results)"
- Sorted by price, lowest first
- Each deal is a DealCard:

**DealCard Component:**
- Full width, `surface` background, 12px radius, 12px gap between cards
- Left: Retailer favicon/logo (24x24) — Amazon, Walmart, Target, eBay icons
- Center:
  - Retailer name (Body, white): "Amazon", "Walmart", etc.
  - Product title on that retailer (Caption, `textSecondary`, 1 line truncated)
  - Condition if relevant: "New" / "Used — Like New" / "Refurbished" (Caption, `textMuted`)
- Right:
  - Price (Price style, `accent` green): "$47.99"
  - If savings calculable: small badge below price "Save 52%" (`accent` bg, black text)
- Tapping anywhere on the card → opens affiliate link in external browser (Safari/Chrome)
- Haptic tap on press

**Bottom Action Bar (sticky):**
- Left: Bookmark/Save button (heart or bookmark icon, toggles filled/outlined)
  - Label: "Save" / "Saved"
- Right: "Share Deals" button (`accent` bg, black text, rounded pill)
  - Opens system share sheet with formatted text:
    - "I found [Product Name] for $XX.XX on Lowball! 🔥"
    - Deep link or App Store link

**Empty/Error States:**
- No results found: "We couldn't find deals for this item. Try a different angle or a clearer photo." + "Scan Again" button
- Partial results: Show what we have + "We're still looking — check back in a few minutes"
- Network error: "No internet connection. Please check your connection and try again." + "Retry" button

### 4.8 — Profile Screen
**Accessed via the profile icon on Home. Simple, functional, no fluff.**

**Layout (top to bottom):**

**Header:**
- Left: Back arrow
- Center: "Profile" (H2)

**Savings Stats Card (hero section):**
- Full width, `surface` background, 16px radius, larger padding
- "Total Saved" (Caption, `textSecondary`)
- Dollar amount (H1, `accent` green, large): "$1,247.50"
- Below: two smaller stats side by side:
  - "Scans" — number of total scans (e.g., "142")
  - "Deals Found" — number of deals tapped (e.g., "38")
- Note: Savings calculated as (average retail price - lowest price found) per scan

**Saved Deals Section:**
- Section header: "Saved Deals" (H3) with count
- List of saved DealCards (same component as Results screen)
- Tapping opens the original Results Screen for that scan
- Swipe left to remove from saved
- If no saved deals: "No saved deals yet. Start scanning!" (`textMuted`, centered)

**Account Section:**
- Section header: "Account" (H3)
- Menu list items (full width, `surface` bg, chevron right):
  - "Update Email" → modal with current email shown + new email input + save button
  - "Change Password" → modal with current password + new password + confirm + save button
  - "Remove Ads — $29.99" → RevenueCat purchase flow (only shown to free users)
  - "Restore Purchases" → RevenueCat restore

**About Section:**
- "Rate Lowball" → opens App Store rating prompt
- "Privacy Policy" → opens URL in browser
- "Terms of Service" → opens URL in browser
- "Contact Us" → opens mailto: link

**Danger Zone (bottom):**
- "Sign Out" (red text, no background)
- "Delete Account" (red text, no background) → confirmation dialog → Supabase account deletion

---

## 5. AI & Data Pipeline

### 5.1 — Product Identification
**Input:** User's photo (JPEG/PNG from camera or photo library)
**Output:** Product name, brand, model, category, key attributes (color, size, material)

**Approach:**
1. Send image to AI Vision API (Claude Sonnet 4 Vision or GPT-4o)
2. Prompt the model to identify:
   - Product name and brand (if visible)
   - Model number (if visible)
   - Category (shoes, furniture, electronics, clothing, kitchen, beauty, etc.)
   - Key attributes (color, material, size, condition)
   - Estimated retail price range
3. Return structured JSON

**Example Vision Prompt:**
```
You are a product identification expert. Analyze this photo and identify the product.

Return ONLY a JSON object with these fields:
{
  "product_name": "Full product name with brand if identifiable",
  "brand": "Brand name or null",
  "model": "Model name/number or null",
  "category": "One of: shoes, clothing, furniture, electronics, kitchen, beauty, toys, sports, home_decor, automotive, books, other",
  "attributes": {
    "color": "Primary color(s)",
    "material": "If identifiable",
    "size": "If identifiable",
    "condition": "new, used, or unknown"
  },
  "search_queries": ["array", "of", "3-5", "search", "queries", "to find this product"],
  "estimated_retail_price": "Estimated price range as string, e.g., '$80-$120'",
  "confidence": "high, medium, or low"
}

Be specific. If you can identify the exact brand and model, do so. If you can only identify the general product type, that's fine too. The search_queries should be optimized for finding this product on shopping sites.
```

### 5.2 — Deal Search Pipeline
**After identification, run searches in parallel:**

**Source 1: Amazon Product Advertising API**
- Use the search_queries from AI identification
- Brad's existing affiliate tag: `skinai-20` (or create new: `lowball-20`)
- Returns: product listings with prices, images, ratings, affiliate links
- Rate limit: 1 request per second, up to 8,640/day (scales with revenue)

**Source 2: Walmart Affiliate API (Impact Radius)**
- Search by product name/keywords
- Returns: product listings with prices, availability, affiliate links
- Free to join, commission varies by category

**Source 3: Target Partners API (Impact Radius)**
- Similar to Walmart integration
- Returns: product listings with prices, affiliate links

**Source 4: eBay Browse API**
- Search by keywords + category
- Filter: Buy It Now only (skip auctions)
- Returns: listings with prices, condition, shipping costs, affiliate links
- eBay Partner Network for affiliate tracking

**Source 5: AI Web Search (SerpAPI or Perplexity API)**
- Run the AI's search_queries through a shopping-focused web search
- Catches smaller retailers, niche sites, and deals the big APIs miss
- Parse results for product URLs and prices
- Fallback source if main APIs return few results

**Pipeline Flow:**
```
Photo → AI Identification → Generate search queries
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              Amazon API      Walmart API       eBay API
                    ↓               ↓               ↓
                    └───────────────┼───────────────┘
                                    ↓
                          AI Web Search (parallel)
                                    ↓
                         Merge & Deduplicate
                                    ↓
                        Sort by Price (low → high)
                                    ↓
                        Attach Affiliate Links
                                    ↓
                          Return to Client
```

### 5.3 — Affiliate Link Strategy
| Retailer | Program | Commission Rate (approx) |
|----------|---------|--------------------------|
| Amazon | Amazon Associates | 1-10% depending on category |
| Walmart | Walmart Affiliates (Impact) | 1-4% |
| Target | Target Partners (Impact) | 1-8% |
| eBay | eBay Partner Network | 1-4% |
| Others | Via web search results | Varies |

**Every external link in the app must be an affiliate link.** This is the primary revenue stream.

---

## 6. Backend Architecture

### 6.1 — Server
**Express.js / TypeScript on Railway** (same pattern as SkinAI)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Accepts image, runs AI identification + deal search |
| GET | `/api/scan/:id` | Retrieve a previous scan's results |
| GET | `/api/scans` | Get user's scan history (paginated) |
| POST | `/api/scan/:id/save` | Bookmark a scan |
| DELETE | `/api/scan/:id/save` | Remove bookmark |
| GET | `/api/user/profile` | Get user profile + stats |
| PUT | `/api/user/profile` | Update email |
| POST | `/api/user/sync-subscription` | Sync RevenueCat subscription status |
| GET | `/api/user/stats` | Get savings stats (total saved, scan count, deals tapped) |
| POST | `/api/track/click` | Track affiliate link click (for stats) |

### 6.2 — Supabase Database Schema

**Table: users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  subscription_status TEXT DEFAULT 'free', -- 'free' or 'pro'
  total_scans INTEGER DEFAULT 0,
  total_savings DECIMAL(10,2) DEFAULT 0.00,
  total_clicks INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: scans**
```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT, -- stored in Supabase Storage
  product_name TEXT,
  brand TEXT,
  model TEXT,
  category TEXT,
  attributes JSONB, -- color, material, size, condition
  estimated_retail_price TEXT,
  ai_confidence TEXT, -- high, medium, low
  search_queries TEXT[], -- array of queries used
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
```

**Table: deals**
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  retailer TEXT NOT NULL, -- amazon, walmart, target, ebay, other
  retailer_logo_url TEXT,
  product_title TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2), -- if available
  currency TEXT DEFAULT 'USD',
  condition TEXT, -- new, used, refurbished
  product_url TEXT NOT NULL, -- affiliate link
  image_url TEXT,
  savings_amount DECIMAL(10,2),
  savings_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deals_scan_id ON deals(scan_id);
```

**Table: saved_scans**
```sql
CREATE TABLE saved_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, scan_id)
);

CREATE INDEX idx_saved_scans_user_id ON saved_scans(user_id);
```

**Table: click_tracking**
```sql
CREATE TABLE click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  retailer TEXT,
  price DECIMAL(10,2),
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clicks_user_id ON click_tracking(user_id);
```

### 6.3 — Supabase Storage
**Bucket: scan-images**
- Stores user-uploaded product photos
- Path: `{user_id}/{scan_id}.jpg`
- Public read (for displaying in results)
- Max file size: 10MB
- Auto-delete after 90 days (save storage costs)

---

## 7. Monetization

### 7.1 — Revenue Streams

**Stream 1: Affiliate Commissions**
- Every deal link is an affiliate link
- Revenue generated per purchase made through the app
- No user-facing cost — this is invisible to users
- Track clicks via `click_tracking` table for analytics

**Stream 2: Advertising**
- AdMob interstitial ads during scan loading
- Free users see an ad on every scan (or every 2-3 scans — A/B test both)
- Ad displays during the natural 3-8 second wait while AI processes
- Fallback: if interstitial fails to load, show a banner ad on results screen

**Stream 3: Remove Ads (IAP)**
- One-time purchase: $29.99 (suggested, A/B test $19.99-$39.99)
- RevenueCat manages the purchase
- Entitlement: "Lowball Pro" or "Ad-Free"
- Removes all interstitial and banner ads
- Does NOT gate any features — every feature is available free

### 7.2 — RevenueCat Configuration
- **Product ID:** `lowball_remove_ads`
- **Entitlement:** `ad_free`
- **Package:** `$rc_lifetime` (one-time purchase)
- Restore purchases button in Profile

---

## 8. Ad Integration

### 8.1 — Ad Placement Strategy
| Placement | Type | Trigger | Users |
|-----------|------|---------|-------|
| Scan loading | Interstitial | Every scan (or every 2-3) | Free only |
| Results screen | Banner (bottom) | Fallback if interstitial didn't load | Free only |

### 8.2 — Ad SDK
- **AdMob (Google)** — primary ad network
- React Native package: `react-native-google-mobile-ads`
- Test ad unit IDs during development
- Production ad unit IDs via environment variables
- GDPR/ATT compliance: show App Tracking Transparency prompt on first scan

### 8.3 — Ad Rules
1. Never show ads to Pro users (check RevenueCat entitlement)
2. Never block results behind an ad
3. If ad fails to load, skip it silently
4. Minimum 30 seconds between interstitials (AdMob policy)
5. Track ad impressions for analytics

---

## 9. Technical Implementation Notes

### 9.1 — Expo Configuration
```json
{
  "expo": {
    "name": "Lowball",
    "slug": "lowball",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "backgroundColor": "#FFFFFF",
      "dark": {
        "backgroundColor": "#000000"
      }
    },
    "ios": {
      "bundleIdentifier": "com.bradbieselin.lowball",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "Lowball uses your camera to scan products and find deals.",
        "NSPhotoLibraryUsageDescription": "Lowball accesses your photos so you can scan products from your photo library.",
        "NSUserTrackingUsageDescription": "This allows Lowball to show you relevant ads. You can still use the app if you decline."
      }
    },
    "plugins": [
      "expo-camera",
      "expo-image-picker",
      "react-native-google-mobile-ads"
    ]
  }
}
```

### 9.2 — Key Dependencies
```json
{
  "dependencies": {
    "expo": "latest",
    "expo-camera": "latest",
    "expo-image-picker": "latest",
    "expo-haptics": "latest",
    "expo-linking": "latest",
    "expo-sharing": "latest",
    "@supabase/supabase-js": "latest",
    "react-native-purchases": "latest",
    "react-native-google-mobile-ads": "latest",
    "@react-navigation/native": "latest",
    "@react-navigation/native-stack": "latest",
    "react-native-reanimated": "latest"
  }
}
```

### 9.3 — Navigation Structure
```
Stack Navigator (root)
├── AuthStack
│   ├── SignIn
│   ├── SignUp
│   └── ForgotPassword
├── Onboarding (shown once)
├── Home
├── Camera
├── Scanning (loading state)
├── Results
└── Profile
    ├── SavedDeals
    ├── UpdateEmail
    └── ChangePassword
```

### 9.4 — Image Handling
1. Capture photo via `expo-camera` or select via `expo-image-picker`
2. Compress to max 1MB (JPEG, quality 0.7) before upload
3. Upload to Supabase Storage (`scan-images` bucket)
4. Send storage URL (or base64) to backend `/api/scan`
5. Backend forwards to AI Vision API for identification

### 9.5 — State Management
- **Auth state:** Supabase Auth listener
- **Scan state:** React Query (TanStack Query) for server state
- **UI state:** React useState/useReducer (no Redux needed — app is simple)
- **Subscription state:** RevenueCat listener

### 9.6 — Offline Handling
- App requires internet to function (AI + API calls)
- Show friendly "No Connection" screen if offline
- Cache recent scan results locally for viewing (but not for new scans)

---

## 10. Scan Flow — Step by Step

This is the critical path. Every millisecond matters.

### Step 1: User taps Scan button on Home
- Camera view opens instantly (pre-warm camera on Home mount)
- Haptic: light tap

### Step 2: User takes photo or selects from library
- Photo captured/selected
- Brief flash animation on capture
- Haptic: medium tap

### Step 3: Navigate to Scanning screen
- Compress image in background
- Upload to Supabase Storage in background
- Show product image + scanning animation immediately
- Start ad load in parallel (AdMob interstitial)

### Step 4: AI Identification (server-side)
- POST `/api/scan` with image URL
- Server sends to AI Vision API
- Returns: product info + search queries
- Time: 1-3 seconds

### Step 5: Deal Search (server-side, parallel)
- Server fires parallel requests to:
  - Amazon Product Advertising API
  - Walmart Affiliate API
  - Target Partners API
  - eBay Browse API
  - SerpAPI / Perplexity (web search fallback)
- Merge results, deduplicate, sort by price
- Attach affiliate links
- Store scan + deals in database
- Time: 2-5 seconds

### Step 6: Show interstitial ad (client-side)
- If ad loaded and user is free tier: show interstitial
- If ad didn't load: skip (never block user)
- Time: 0-5 seconds (user dismisses ad)

### Step 7: Navigate to Results screen
- Display product identification + deal list
- Haptic: success notification
- Total time from photo to results: 3-10 seconds

---

## 11. Share Feature

### 11.1 — Share Content
When user taps "Share Deals" on Results screen:

**Share Text:**
```
I found [Product Name] for just $[lowest price]! 💰

The retail price is $[estimated retail]. That's [X]% off!

Found with Lowball — snap a photo, find it cheaper.
[App Store Link]
```

**Share Options:**
- System share sheet (iOS native)
- Supports: iMessage, Instagram Stories, TikTok, Twitter/X, etc.
- Include the user's product photo as the share image if possible

### 11.2 — Deep Linking (Future)
- When someone taps a shared Lowball link, it opens the app (or App Store if not installed)
- This creates a viral loop: share → download → scan → share

---

## 12. Analytics & Tracking

### Key Metrics to Track
| Metric | Description | Where |
|--------|-------------|-------|
| Scans per user per day | Core engagement metric | Supabase |
| Scan-to-click rate | % of scans where user taps a deal | Supabase |
| Click-to-purchase rate | % of clicks that convert (affiliate dashboards) | Affiliate APIs |
| Revenue per scan | Total revenue / total scans | Calculated |
| Ad impressions | Interstitials shown | AdMob dashboard |
| IAP conversions | Remove Ads purchases | RevenueCat |
| Savings per scan | Average savings amount | Supabase |
| Retention (D1, D7, D30) | How many users come back | Analytics |
| Share rate | % of scans that get shared | Supabase |

### Analytics SDK
- **PostHog** or **Mixpanel** (free tier) for event tracking
- Key events: `scan_started`, `scan_completed`, `deal_clicked`, `deal_saved`, `deal_shared`, `ad_shown`, `ad_dismissed`, `iap_purchased`

---

## 13. Launch Checklist

### Pre-Launch
- [ ] App icon (1024x1024) — design to match dark theme + green accent
- [ ] App Store screenshots (6.7" and 6.5" sizes)
- [ ] App Store description + keywords
- [ ] Privacy Policy URL (host on simple landing page)
- [ ] Terms of Service URL
- [ ] Apple Developer account setup (already have: Team ID FY5N2W429Y)
- [ ] Amazon Associates affiliate account (existing tag or new one)
- [ ] Walmart Affiliate account (Impact Radius)
- [ ] Target Partners account (Impact Radius)
- [ ] eBay Partner Network account
- [ ] AdMob account + ad unit IDs
- [ ] RevenueCat project + product configuration
- [ ] Supabase project setup
- [ ] Railway server deployment
- [ ] Apple Sign-In configuration
- [ ] Google OAuth configuration
- [ ] ATT (App Tracking Transparency) implementation
- [ ] EAS Build configuration
- [ ] TestFlight beta testing

### Post-Launch (First 30 Days)
- [ ] Monitor crash reports (Sentry or EAS)
- [ ] Monitor API rate limits (especially Amazon)
- [ ] A/B test ad frequency (every scan vs. every 2-3 scans)
- [ ] A/B test remove ads price ($1.99 vs $2.99 vs $4.99)
- [ ] Respond to App Store reviews
- [ ] Create TikTok content showing the app in action
- [ ] Track affiliate revenue by source
- [ ] Optimize AI identification prompts based on failure cases

---

## 14. Future Features (Post-Launch)

These are NOT for v1. Build them only after validating the core product.

1. **Price Alerts** — "Notify me if this drops below $X" (push notifications)
2. **Price History** — show price trend over time for identified products
3. **Barcode Scanning** — faster identification for products with visible barcodes
4. **Wishlist** — save products you want but haven't bought yet
5. **Browser Extension** — Lowball for desktop shopping (Chrome extension)
6. **Social Feed** — see what deals other Lowball users are finding (only if it adds value)
7. **Cashback Integration** — layer cashback on top of affiliate links
8. **Widget** — iOS home screen widget showing trending deals or saved deal price drops
9. **Android Launch** — port to Android via Expo (already cross-platform)
10. **Light Mode** — add toggle if users request it

---

## 15. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Amazon API rate limits | High | High | Start with generous limits by driving affiliate revenue; cache popular products |
| AI misidentifies products | Medium | Medium | Allow users to edit/correct product name; improve prompts over time |
| Low affiliate conversion rates | Medium | High | Diversify revenue with ads + IAP; optimize deal presentation |
| Apple rejects app | Low | High | Follow all guidelines; ensure ATT compliance; have privacy policy ready |
| Competitor copies the UX | Medium | Low | Speed to market matters; build brand on TikTok before competitors react |
| Ad revenue too low | Medium | Medium | Test ad placements; consider subscription tier if needed |
| Users scan non-products | Low | Low | AI gracefully handles: "I couldn't identify a product in this photo" |

---

## 16. Success Metrics (First 90 Days)

| Metric | Target |
|--------|--------|
| App Store rating | 4.5+ stars |
| Downloads (first 30 days) | 5,000+ |
| D1 retention | 40%+ |
| D7 retention | 20%+ |
| Scans per active user per week | 5+ |
| Affiliate click-through rate | 30%+ of scans |
| IAP conversion (remove ads) | 5%+ of active users |
| Monthly affiliate revenue (month 3) | $500+ |

---

*PRD authored: March 2026*
*Founder: Brad Bieselin*
*App: Lowball — "Point. Snap. Save."*
