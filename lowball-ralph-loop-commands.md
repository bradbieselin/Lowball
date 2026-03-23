# Lowball — Ralph Loop Build Commands
# Run these in order, one at a time, in Claude Code.
# Make sure CLAUDE.md is in the project root before starting.
# Cancel anytime with /cancel-ralph

# ═══════════════════════════════════════════════════════════
# PHASE 1: PROJECT FOUNDATION
# ═══════════════════════════════════════════════════════════

# Command 1 — Scaffold Expo project with TypeScript and navigation

/ralph-loop:ralph-loop "Initialize a new Expo project with TypeScript in the current directory. Install these dependencies: @react-navigation/native, @react-navigation/native-stack, react-native-screens, react-native-safe-area-context, expo-haptics, expo-linking, expo-status-bar, and @tanstack/react-query. Create the folder structure: src/screens/, src/components/, src/navigation/, src/hooks/, src/services/, src/utils/, src/constants/, and src/types/. Create a colors.ts file in src/constants/ with all the design tokens from CLAUDE.md (background, surface, surfaceLight, accent, accentDim, textPrimary, textSecondary, textMuted, danger, border, scanRing). Create a typography.ts file in src/constants/ with the font size and weight definitions from CLAUDE.md. Set up the root navigation in src/navigation/RootNavigator.tsx with a native-stack navigator containing placeholder screens for: SignIn, SignUp, ForgotPassword, Onboarding, Home, Camera, Scanning, Results, and Profile. Wrap the app in QueryClientProvider and NavigationContainer in App.tsx. Set the StatusBar to light-content. Confirm the app builds and runs with no errors. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# Command 2 — Auth screens (Sign In, Sign Up, Forgot Password)

/ralph-loop:ralph-loop "Build the three auth screens in src/screens/auth/. All screens use dark background #0D0D0D, Inter font, and the design tokens from src/constants/colors.ts. SignInScreen: email input, password input, green Sign In button full width with #00E676 background and black text, Forgot Password link below password in #A0A0A0, a divider line with the word or in the center, Continue with Google button outlined white, Continue with Apple button outlined white, and a link at bottom that says Do not have an account? Sign Up that navigates to SignUp. SignUpScreen: email input, password input with min 8 chars validation, green Sign Up button, divider with or, Google and Apple buttons, and a link Already have an account? Sign In that navigates to SignIn. ForgotPasswordScreen: back arrow top left, email input, green Send Reset Link button, and a success state that shows Check your email for a reset link. All input fields should have #2A2A2A background, #FFFFFF text, #666666 placeholder text, and 12px border radius. Add an AuthStack navigator in src/navigation/ that groups these three screens. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# Command 3 — Onboarding screens (3 slides)

/ralph-loop:ralph-loop "Build the OnboardingScreen in src/screens/OnboardingScreen.tsx. It is a horizontal swipe carousel with 3 slides and dot indicators at the bottom. Dark background #0D0D0D throughout. Slide 1 title is Snap It with subtitle Take a photo of any product you see and smaller text In a store, online, at a friends house — anywhere. Use a camera icon from expo vector icons as the illustration, large and centered, white color. Slide 2 title is Find It Cheaper with subtitle Lowball searches the internet for the best deals and smaller text We check Amazon, Walmart, Target, eBay and more. Use a search or price tag icon. Slide 3 title is Save Big with subtitle Get direct links to the lowest prices and smaller text Track how much you save over time. Use a dollar or piggy bank icon. Slide 3 has a full-width Get Started button at the bottom with #00E676 background and black bold text. No skip button on slides 1 and 2. Store a flag in AsyncStorage when Get Started is tapped so onboarding only shows once. Titles should be 28px bold white, subtitles 18px semibold white, smaller text 14px #A0A0A0. Dot indicators: active dot is #00E676, inactive is #333333. Say DONE when complete." --max-iterations 12 --completion-promise "DONE"


# ═══════════════════════════════════════════════════════════
# PHASE 2: CORE SCREENS
# ═══════════════════════════════════════════════════════════

# Command 4 — Home screen

/ralph-loop:ralph-loop "Build the HomeScreen in src/screens/HomeScreen.tsx. Dark background #0D0D0D. Header bar at top with Lowball text on the left in Inter Bold 22px white, and a circular profile button on the right that is 36px diameter with #2A2A2A background showing a default user icon in #A0A0A0. Tapping the profile button navigates to Profile screen. Center of the screen has a large circular scan button: 120px diameter, #00E676 background, white camera icon centered inside. Add a subtle pulsing glow animation on the button ring using green color with React Native Animated or Reanimated. Below the button add the label Scan a Product in 13px #A0A0A0 text. Below that is a Recent Scans section with a header in 18px semibold white left-aligned. If there are no scans, show an empty state with text Your scans will appear here in #666666 centered. If scans exist, render a vertical FlatList of ScanCard components. Build the ScanCard component in src/components/ScanCard.tsx: full width horizontal card, #1A1A1A background, 12px border radius, with a 60x60 rounded product thumbnail on the left, product name in 16px white truncated to 1 line in the center, best price in 24px bold #00E676 below the name, original price in 16px #FF5252 with strikethrough next to it, and a savings badge pill on the right with #00E676 background and black bold 14px text showing Save $XX. Add 12px vertical gap between cards and 16px horizontal padding on the screen. Tapping a ScanCard should navigate to the Results screen. Use mock data with 3-4 example scans for now. Trigger a light haptic on scan button press. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# Command 5 — Camera view screen

/ralph-loop:ralph-loop "Build the CameraScreen in src/screens/CameraScreen.tsx. Install expo-camera and expo-image-picker if not already installed. The screen is a full-screen camera preview using the rear-facing camera. Overlay elements on top of the camera: top-left has a white back arrow that navigates back to Home, top-right has a flash toggle icon that cycles through auto, on, and off states. Bottom center has a shutter button: 72px white circle with a slightly smaller inner circle. Bottom-left has a small rounded thumbnail button that opens the photo library via expo-image-picker. Center of the screen has a subtle crosshair guide made of thin white lines at low opacity to help users center products. When the user taps the shutter button, capture the photo, trigger a medium haptic, show a brief white flash animation overlay for 0.3 seconds, then navigate to the Scanning screen passing the photo URI. When the user selects from photo library, navigate to Scanning screen with that image URI. Handle camera permission: if denied, show a friendly message on a dark screen saying Lowball needs camera access to scan products with an Open Settings button that links to device settings. Say DONE when complete." --max-iterations 12 --completion-promise "DONE"


# Command 6 — Scanning/Loading screen

/ralph-loop:ralph-loop "Build the ScanningScreen in src/screens/ScanningScreen.tsx. It receives the photo URI as a navigation param. Dark background #0D0D0D. Display the captured product image at the top center, 200x200 pixels, rounded 12px. Below the image, create a scanning animation: a green (#00E676) horizontal line that sweeps up and down across the product image continuously, like a barcode scanner effect. Use React Native Animated for this. Below the animation, show rotating status messages that fade in and out every 2 seconds. The messages cycle through: Identifying product, Searching for deals, Checking Amazon, Checking Walmart, Checking eBay, and Finding you the best price. Text is 16px #A0A0A0 centered. Add a subtle pulsing opacity animation on the status text. For now, simulate a 4-second loading delay using setTimeout, then navigate to the Results screen with mock data. The screen should enforce a minimum 3-second display time. Add a back button top-left that cancels and returns to Home. Say DONE when complete." --max-iterations 12 --completion-promise "DONE"


# Command 7 — Results screen

/ralph-loop:ralph-loop "Build the ResultsScreen in src/screens/ResultsScreen.tsx. Dark background #0D0D0D. Header bar: back arrow on the left that returns to Home (not back to Scanning), title Results in 18px semibold white centered, share icon on the right. Below the header is a Product Card section: the user photo on the left (80x80, rounded 8px), product name in 18px semibold white next to it, and a category pill badge below the name with #2A2A2A background and #A0A0A0 text. Below that is a Deal List section with header Deals Found and a count in parentheses in #A0A0A0. Build the DealCard component in src/components/DealCard.tsx: full width, #1A1A1A background, 12px radius. Left side has a 24x24 retailer icon placeholder. Center has retailer name in 16px white, product title on that retailer in 13px #A0A0A0 truncated 1 line, and condition text like New or Used in 13px #666666. Right side has the price in 24px bold #00E676 and a small savings percent badge below it with #00E676 background and black text. Tapping a DealCard triggers a light haptic. Render DealCards in a FlatList sorted by price ascending. At the bottom is a sticky action bar with #1A1A1A background: left side has a bookmark icon button with the label Save, right side has a Share Deals pill button with #00E676 background and black bold text. Trigger a success haptic when the screen first loads. Use mock data with 5-6 deals from different retailers. Build an empty state for no results with a Scan Again button. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# Command 8 — Profile screen

/ralph-loop:ralph-loop "Build the ProfileScreen in src/screens/ProfileScreen.tsx. Dark background #0D0D0D. Header: back arrow left, title Profile in 22px semibold white centered. First section is a Savings Stats Card: full width, #1A1A1A background, 16px border radius, generous padding. Shows Total Saved label in 13px #A0A0A0, then a large dollar amount in 28px bold #00E676 (use mock value like $1,247.50). Below that, two stats side by side: Scans count and Deals Found count, each with the label in 13px #A0A0A0 and the number in 18px semibold white. Second section is Saved Deals with header in 18px semibold white and a count. Render a list of saved ScanCards reusing the ScanCard component. If no saved deals, show No saved deals yet. Start scanning! in #666666. Third section is Account: a menu list of touchable rows on #1A1A1A background with white text and a right chevron icon. Rows: Update Email, Change Password, Remove Ads — $2.99 with #00E676 for the price, and Restore Purchases. Fourth section is About: rows for Rate Lowball, Privacy Policy, Terms of Service, and Contact Us. At the bottom: Sign Out and Delete Account each as separate touchable red text (#FF5252). Delete Account shows a confirmation alert. Use mock data for stats and saved deals. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# ═══════════════════════════════════════════════════════════
# PHASE 3: BACKEND & DATABASE
# ═══════════════════════════════════════════════════════════

# Command 9 — Supabase schema and Express server setup

/ralph-loop:ralph-loop "Create a server/ directory at the project root for the Express.js backend. Initialize it with npm init, install express, typescript, ts-node, @types/express, cors, dotenv, @supabase/supabase-js, and prisma. Initialize Prisma with npx prisma init. Write the Prisma schema in server/prisma/schema.prisma with the following models matching CLAUDE.md: User (id uuid, email unique, createdAt, subscriptionStatus default free, totalScans default 0, totalSavings decimal default 0, totalClicks default 0, updatedAt), Scan (id uuid, userId references User cascade delete, imageUrl, productName, brand nullable, model nullable, category, attributes json, estimatedRetailPrice nullable, aiConfidence, searchQueries string array, createdAt), Deal (id uuid, scanId references Scan cascade delete, retailer, retailerLogoUrl nullable, productTitle, price decimal, originalPrice decimal nullable, currency default USD, condition nullable, productUrl, imageUrl nullable, savingsAmount decimal nullable, savingsPercent integer nullable, createdAt), SavedScan (id uuid, userId references User cascade delete, scanId references Scan cascade delete, createdAt, unique on userId+scanId), ClickTracking (id uuid, userId references User cascade delete, scanId references Scan cascade delete, dealId references Deal cascade delete, retailer, price decimal, clickedAt). Create a .env.example with DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and ANTHROPIC_API_KEY placeholders. Set up the basic Express server in server/src/index.ts with cors enabled and a health check at GET /health. Create src/lib/supabase.ts on the frontend that initializes the Supabase client for React Native with placeholder env vars. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# Command 10 — API routes

/ralph-loop:ralph-loop "In server/src/, create the API route handlers. Create server/src/routes/scan.ts with: POST /api/scan that accepts an image URL in the body, calls a placeholder identifyProduct function, calls a placeholder searchDeals function, stores the scan and deals in the database via Prisma, and returns the scan with deals. GET /api/scan/:id that fetches a scan by ID with deals included. GET /api/scans that fetches paginated scans for the authenticated user sorted by createdAt descending with page and limit query params defaulting to page 1 limit 20. POST /api/scan/:id/save that creates a SavedScan record. DELETE /api/scan/:id/save that removes a SavedScan record. Create server/src/routes/user.ts with: GET /api/user/profile, PUT /api/user/profile for email update, GET /api/user/stats, and POST /api/track/click that creates a ClickTracking record and increments totalClicks. Create server/src/middleware/auth.ts that extracts the Supabase JWT from the Authorization header, verifies it, and attaches userId to the request. Apply auth middleware to all routes. Create server/src/services/ai.ts with a placeholder identifyProduct function returning mock data. Create server/src/services/deals.ts with a placeholder searchDeals function returning mock deals. Register all routes in server/src/index.ts. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# ═══════════════════════════════════════════════════════════
# PHASE 4: WIRING FRONTEND TO BACKEND
# ═══════════════════════════════════════════════════════════

# Command 11 — API service layer and React Query hooks

/ralph-loop:ralph-loop "Create the frontend API service layer and React Query hooks. In src/services/api.ts, create a fetch wrapper that reads the backend URL from environment config, attaches the Supabase auth token as a Bearer token, and exports: scanProduct(imageUri: string) that uploads the image and calls POST /api/scan, getScan(scanId: string) for GET /api/scan/:id, getScans(page: number) for GET /api/scans, saveScan(scanId: string) for POST /api/scan/:id/save, unsaveScan(scanId: string) for DELETE /api/scan/:id/save, getUserProfile() for GET /api/user/profile, getUserStats() for GET /api/user/stats, and trackClick(scanId: string, dealId: string, retailer: string, price: number) for POST /api/track/click. In src/hooks/useScans.ts create React Query hooks: useScanProduct mutation, useScan query, useRecentScans infinite query with pagination, useSaveScan mutation, useUnsaveScan mutation. In src/hooks/useUser.ts create useUserProfile and useUserStats queries. In src/hooks/useAuth.ts create a hook with Supabase auth state listener providing user, signIn, signUp, signOut, and resetPassword. Create src/contexts/AuthContext.tsx wrapping the app with auth state. Update RootNavigator to show AuthStack when not authenticated and main stack when authenticated, with onboarding based on AsyncStorage flag. Say DONE when complete." --max-iterations 12 --completion-promise "DONE"


# Command 12 — Connect screens to real data flow

/ralph-loop:ralph-loop "Wire all screens to use real hooks and services instead of mock data. HomeScreen: use useRecentScans to fetch scan history for the FlatList, add loading spinner while fetching, add pull-to-refresh. ScanCards navigate to Results with scan ID. CameraScreen: when photo is captured, compress to max 1MB JPEG at 0.7 quality using expo-image-manipulator (install if needed), then navigate to Scanning with compressed URI. ScanningScreen: call useScanProduct mutation with image URI, show scanning animation while pending, on success navigate to Results with new scan ID, on error show error message with Retry and Back to Home buttons, enforce 3-second minimum display. ResultsScreen: receive scanId as param, use useScan to fetch scan with deals, render real product info and deal list, share button opens system share sheet with product name and lowest price, save button calls useSaveScan and toggles to filled state, tapping DealCard calls trackClick then opens product URL via Linking.openURL. ProfileScreen: use useUserStats for savings card, query saved scans for the saved deals list, Sign Out calls signOut from auth context. Wire auth screens to use signIn, signUp, resetPassword with error handling and loading states on buttons. Say DONE when complete." --max-iterations 15 --completion-promise "DONE"


# Command 13 — Share feature and price formatters

/ralph-loop:ralph-loop "Build the share feature and price formatting utilities. In src/utils/share.ts, create a shareDeals function that takes productName, lowestPrice, estimatedRetailPrice, and optional imageUri. It calculates savings percentage, then opens the system share sheet via React Native Share API with this text: I found [product name] for just $[lowest price]! The retail price is $[estimated retail]. Thats [X]% off! Found with Lowball — snap a photo, find it cheaper. Include a placeholder app store link. Wire this into the Results screen share button in the header and the Share Deals button in the bottom bar. Create src/utils/formatters.ts with: formatPrice(amount: number) returning a dollar string like $47.99, formatSavingsPercent(original: number, current: number) returning Save 52%, and formatSavingsAmount(original: number, current: number) returning Save $XX.XX. Update ScanCard, DealCard, and Results screen to use these formatters everywhere prices are displayed. Say DONE when complete." --max-iterations 10 --completion-promise "DONE"


# ═══════════════════════════════════════════════════════════
# AFTER RALPH LOOP — Manual Claude Code Sessions
# ═══════════════════════════════════════════════════════════
# These need hands-on testing and aren't good fits for Ralph Loop:
#
# 1. AI Vision API — Wire up Claude Sonnet 4 Vision for real product identification
# 2. Affiliate APIs — Connect Amazon, Walmart, Target, eBay APIs
# 3. AdMob — Integrate interstitial ads during scan loading
# 4. RevenueCat — Set up remove ads IAP ($2.99 lifetime)
# 5. Apple Sign-In — Required since Google login is offered
# 6. App icon and App Store assets
# 7. Privacy policy and terms of service pages
# 8. Production EAS build and App Store submission
