# HarfLand Codebase Overview - Comprehensive Guide

## 1. PROJECT STRUCTURE

```
wordestan/
├── backend/                    # Express.js API Server
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── gameController.js
│   │   │   ├── leaderboardController.js
│   │   │   ├── leitnerController.js
│   │   │   ├── storeController.js
│   │   │   ├── paymentController.js
│   │   │   └── adminController.js
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js
│   │   │   ├── game.js
│   │   │   ├── leaderboard.js
│   │   │   ├── leitner.js
│   │   │   ├── store.js
│   │   │   ├── payment.js
│   │   │   └── admin.js
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Level.js
│   │   │   ├── Word.js
│   │   │   ├── GameSetting.js
│   │   │   ├── CoinPack.js
│   │   │   ├── Purchase.js
│   │   │   ├── LeitnerBox.js
│   │   │   └── BotUser.js
│   │   ├── middleware/        # Auth & validation
│   │   │   └── auth.js
│   │   └── utils/             # Utilities
│   │       └── seed.js
│   ├── server.js              # Express app setup
│   ├── bot.js                 # Telegram bot integration
│   ├── package.json
│   ├── .env                   # Environment config
│   └── ecosystem.config.js    # PM2 configuration
│
├── frontend/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── GameCanvas.jsx (SVG-based game)
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── UserProfileMenu.jsx
│   │   │   └── admin/         # Admin components
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── LevelManagement.jsx
│   │   │       ├── UserManagement.jsx
│   │   │       ├── CoinPackManagement.jsx
│   │   │       └── RewardSettings.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Game.jsx (Main game page)
│   │   │   ├── LevelMap.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── LeitnerBox.jsx
│   │   │   ├── Store.jsx
│   │   │   ├── PaymentVerify.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── NotFound.jsx
│   │   ├── contexts/          # Global state
│   │   │   ├── AuthContext.jsx
│   │   │   └── GameContext.jsx
│   │   ├── services/          # API clients
│   │   │   ├── authService.js
│   │   │   ├── gameService.js
│   │   │   ├── leaderboardService.js
│   │   │   ├── leitnerService.js
│   │   │   ├── storeService.js
│   │   │   ├── adminService.js
│   │   ├── utils/
│   │   │   └── currency.js
│   │   ├── App.jsx            # Main app router
│   │   └── main.jsx           # React entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

---

## 2. MODELS & DATABASE SCHEMA

### User Model (`backend/src/models/User.js`)
```javascript
{
  // Auth
  username: String (unique, 3-20 chars),
  email: String (optional),
  password: String (hashed with bcrypt),
  telegramId: String (unique, optional),
  
  // Game Progress
  coins: Number (default: 100),
  levelsCleared: Number,
  totalScore: Number,
  currentLevel: Number,
  wordsFound: Number,
  bestStreak: Number,
  currentStreak: Number,
  
  // Levels
  levelProgress: [{
    levelId: ObjectId,
    completedWords: [ObjectId],
    isComplete: Boolean,
    usedShuffle: Boolean,
    usedAutoSolve: Boolean,
    stars: Number (0-3)
  }],
  completedLevels: [{
    levelId: ObjectId,
    stars: Number,
    completedAt: Date
  }],
  unlockedLevels: [ObjectId],
  
  // Meta
  isAdmin: Boolean,
  lastActive: Date,
  timestamps: true
}
```

**Key Methods:**
- `comparePassword(password)` - Validate password
- `updateLastActive()` - Update last activity
- `addCoins(amount)` - Add coins
- `spendCoins(amount)` - Deduct coins
- `completeLevel(levelId, options)` - Mark level complete
- `completeWord(levelId, wordId, options)` - Mark word found
- `getLevelProgress(levelId)` - Get level progress
- `hasCompletedWordInLevel(levelId, wordId)` - Check word completion
- `resetStreak()` - Reset streak

### Level Model (`backend/src/models/Level.js`)
```javascript
{
  order: Number (unique, required),
  letters: String (uppercase),
  words: [ObjectId] (references Word),
  isPublished: Boolean (default: true),
  timestamps: true
}
```

**Virtuals:**
- `wordCount` - Number of words in level

**Indexes:**
- `{ order: 1 }`
- `{ isPublished: 1, order: 1 }`

### Word Model (`backend/src/models/Word.js`)
```javascript
{
  text: String (unique, uppercase, 3-12 chars),
  length: Number (auto-calculated),
  difficulty: String (enum: easy, medium, hard),
  points: Number (default: 20, 10-100),
  category: String (default: general),
  description: String (max 200),
  meaning: String (max 200),
  isActive: Boolean,
  timesCompleted: Number,
  timestamps: true
}
```

**Indexes:**
- `{ text: 1 }`
- `{ length: 1 }`
- `{ difficulty: 1 }`

### Other Models
- **GameSetting**: Store/reward configuration
- **CoinPack**: In-app purchase options
- **Purchase**: Transaction history
- **LeitnerBox**: Spaced repetition words
- **BotUser**: Telegram bot users

---

## 3. AUTHENTICATION SYSTEM

### JWT Implementation
**File:** `backend/src/middleware/auth.js` & `backend/src/controllers/authController.js`

**Token Generation:**
```javascript
// Regular users: 365 days (recently extended)
// Admin users: 12 hours (if JWT_ADMIN_EXPIRES_IN set)
const token = jwt.sign(
  { id: userId, isAdmin },
  process.env.JWT_SECRET,
  { expiresIn: expiresIn }
);
```

**Token Verification:**
- Extracted from `Authorization: Bearer <token>` header
- Verified with JWT_SECRET
- User fetched from database on each request

**Auth Middleware:**
```javascript
// auth - Requires valid JWT
// adminAuth - Requires valid JWT + isAdmin = true
// optionalAuth - JWT optional, doesn't fail if missing
```

**Environment Variables:**
```env
JWT_SECRET=zakaria_wordconnect_super_secret_key_123456789
JWT_EXPIRES_IN=365d          # Regular users (extended from 7d)
JWT_ADMIN_EXPIRES_IN=12h     # Admin users (optional)
```

### Frontend Integration
**File:** `frontend/src/contexts/AuthContext.jsx`

**Features:**
- Auto-login on mount if token in localStorage
- Token stored in localStorage
- User data cached in React Context
- Axios interceptor adds token to all requests
- 401 responses trigger logout

**Auth Context Methods:**
- `login(username, password)` - User login
- `register(userData)` - User registration
- `logout()` - Clear auth state
- `updateUser(userData)` - Update user data

---

## 4. API ROUTES STRUCTURE

### Authentication Routes
**Base:** `/api/auth`

```javascript
POST   /register          - Create new user
POST   /login             - Login user
GET    /me                - Get current user profile (auth required)
PUT    /update            - Update profile (auth required)
GET    /check-username    - Check username availability
```

### Game Routes
**Base:** `/api/game`

```javascript
GET    /level/1           - Get first level (public)
GET    /levels            - Get all levels with progress (auth)
GET    /next-level        - Get next level for user (auth)
GET    /stats             - Get game statistics (auth)
POST   /complete-word     - Submit word (auth)
POST   /hint              - Get word hint (auth)
POST   /shuffle           - Purchase shuffle (auth)
POST   /auto-solve        - Auto solve word (auth)
POST   /unlock-level      - Unlock specific level (auth)
```

### Leaderboard Routes
**Base:** `/api/leaderboard`

```javascript
GET    /            - Get leaderboard (optionalAuth)
GET    /stats       - Get leaderboard stats (public)
GET    /me          - Get user's rank (auth)
```

### Leitner Routes
**Base:** `/api/leitner`

```javascript
POST   /add                - Add word to Leitner
POST   /batch-add          - Add multiple words
GET    /words              - Get all Leitner words
GET    /review             - Get words for review
POST   /review/:id         - Mark word as reviewed
GET    /stats              - Get Leitner statistics
GET    /box/:boxNumber     - Get words in specific box
PUT    /:id/notes          - Update word notes
POST   /:id/archive        - Archive word
POST   /:id/unarchive      - Unarchive word
POST   /:id/reset          - Reset word progress
DELETE /:id                - Delete word
```

### Store Routes
**Base:** `/api/store`

```javascript
GET    /coin-packs         - Get available coin packs
GET    /transactions       - Get user transactions (auth)
```

### Payment Routes
**Base:** `/api/payment`

```javascript
POST   /verify             - Verify payment
POST   /request            - Request payment
```

### Admin Routes
**Base:** `/api/admin`

```javascript
GET    /users              - Get all users
PUT    /users/:id          - Update user
DELETE /users/:id          - Delete user
GET    /levels             - Get all levels
POST   /levels             - Create level
PUT    /levels/:id         - Update level
DELETE /levels/:id         - Delete level
GET    /words              - Get all words
POST   /words              - Create word
PUT    /words/:id          - Update word
DELETE /words/:id          - Delete word
POST   /rewards-settings   - Update reward settings
GET    /rewards-settings   - Get reward settings
```

---

## 5. FRONTEND COMPONENT ORGANIZATION

### Key Page Components

**Game.jsx** - Main game page
- Manages game state via GameContext
- Handles word submission and level completion
- Displays auto-solve/shuffle modals
- Shows level completion animations
- Integrates GameCanvas component

**GameCanvas.jsx** - SVG-based game rendering
- Renders letters in circular layout
- Handles pointer events (mouse/touch)
- Draws SVG paths during drag
- Manages letter selection

**LevelMap.jsx** - Level selection page
- Shows all levels with progress
- Displays stars earned per level
- Allows level unlocking (costs coins)
- Filters completed/available levels

**Leaderboard.jsx** - Leaderboard page
- Displays top players
- Shows user's rank
- Filters by timeframe
- Optional auth for additional stats

**LeitnerBox.jsx** - Spaced repetition system
- Manages word review boxes
- Tracks review progress
- Allows word archiving

**Store.jsx** - Coin purchase page
- Displays coin packs
- Handles in-app purchases
- Shows purchase history

**Admin.jsx** - Admin dashboard
- Routes to admin subpages
- Displays analytics

### Component Architecture

**Layout.jsx** - Wrapper component
- Navigation header
- User profile menu
- Responsive sidebar

**ProtectedRoute.jsx** - Auth guard
- Redirects to login if not authenticated
- Shows loading while checking auth

**AdminRoute.jsx** - Admin guard
- Redirects if not admin
- Shows loading while checking

**UserProfileMenu.jsx** - User menu dropdown
- Shows user info
- Logout button
- Profile settings

---

## 6. STATE MANAGEMENT APPROACH

### Context API Usage

**AuthContext** (`frontend/src/contexts/AuthContext.jsx`)
```javascript
{
  user: User | null,
  loading: Boolean,
  error: String | null,
  isAuthenticated: Boolean,
  isAdmin: Boolean,
  
  // Methods
  login(username, password),
  register(userData),
  logout(),
  updateUser(userData)
}
```

**GameContext** (`frontend/src/contexts/GameContext.jsx`)
```javascript
{
  // Level state
  currentLevel: Level | null,
  levelMeta: Object,
  levelLoading: Boolean,
  
  // Game state
  gameState: {
    selectedNodes: Array,      // Selected letters
    selectionPreview: String,  // Preview of selected word
    currentWord: String,       // Full word being formed
    completedWords: Array,     // Words found in level
    isConnecting: Boolean      // Is user drawing path
  },
  
  // Power-ups
  powerUpUsage: {
    shuffle: Boolean,
    autoSolve: Boolean
  },
  
  // Mutations
  isCompletingWord: Boolean,
  isAutoSolving: Boolean,
  
  // Transitions
  levelTransition: Object,     // Level change animations
  autoSolveResult: Object,     // Auto-solve feedback
  levelCompletionStatus: Object,
  
  // Methods
  selectLetter(node),
  deselectLetter(),
  clearSelection(),
  setCurrentWord(word),
  finalizeWordSelection(word),
  submitWord(word),
  autoSolve(),
  loadLevelById(levelId, options),
  loadNextLevel(),
  clearLevelTransition(),
  clearAutoSolveResult(),
  markPowerUpUsed(type),
  resetPowerUpUsage()
}
```

### React Query Integration

**Query Keys:**
- `['nextLevel', userId]` - User's next level
- `['guestLevel']` - Guest mode first level
- `['leaderboard']` - Leaderboard data
- `['gameLevels']` - All levels

**Cache Strategy:**
- `staleTime: 5 * 60 * 1000` (5 minutes)
- `refetchOnWindowFocus: false`
- Manual invalidation after mutations

---

## 7. SOCKET.IO SETUP

### Current Status
**Socket.io is NOT currently implemented in the codebase.**

The project uses:
- **REST API** for all server communication
- **HTTP polling** (indirectly via React Query)
- **No WebSocket setup** in server.js
- **No Socket.io client** in frontend

### Implications for 1v1 Battles
To implement real-time 1v1 battles, you'll need to:

1. **Add Socket.io to backend:**
   ```bash
   npm install socket.io cors@^2.8.5
   ```

2. **Integrate with Express:**
   - Create HTTP server for Socket.io
   - Handle CORS for socket connections
   - Manage battle rooms/namespaces

3. **Add Socket.io client to frontend:**
   ```bash
   npm install socket.io-client
   ```

4. **Create battle context/hook:**
   - Manage socket connection
   - Handle real-time updates
   - Track opponent state

---

## 8. DATABASE CONNECTION SETUP

### MongoDB Connection
**File:** `backend/server.js`

```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await removeLegacyEmailIndex();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
```

### Environment Configuration
```env
MONGODB_URI=mongodb://localhost:27017/wordconnect
```

### Connection Features
- Mongoose ODM for schema validation
- Automatic index creation
- Connection pooling
- Error handling with process exit on failure

### Database Indexes
Automatically created for:
- User: `username` (unique), `email` (sparse, unique)
- Level: `order`, `isPublished + order`
- Word: `text`, `length`, `difficulty`
- Purchase: `userId + createdAt`, `status`, `transactionId`, `gatewayAuthority`

---

## 9. API SERVICE LAYER

### Frontend Services Pattern
**Location:** `frontend/src/services/`

Each service module exports methods that:
1. Make API calls using axios
2. Include Bearer token in headers (via interceptor)
3. Handle errors and throw meaningful messages
4. Return response.data

**Example - gameService.js:**
```javascript
export const gameService = {
  async getNextLevel(levelId),
  async completeWord(word, levelId, powerUpsUsed),
  async autoSolve(levelId, powerUpsUsed),
  async getHint(levelId),
  async purchaseShuffle(levelId),
  async unlockLevel(levelId),
  async getGameStats(),
  async getLevels()
};
```

### Axios Configuration
```javascript
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor adds auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 10. KEY ARCHITECTURAL PATTERNS

### 1. Request/Response Pattern
- **Input Validation:** express-validator on routes
- **Response Format:**
  ```javascript
  {
    success: Boolean,
    message: String,
    data: Object,
    errors: Array (if validation fails)
  }
  ```

### 2. Error Handling
- **Middleware:** Express error handler at bottom of server.js
- **Specific Errors:**
  - `ValidationError` - 400
  - `Duplicate Key (11000)` - 400
  - `JsonWebTokenError` - 401
  - Generic - 500

### 3. Middleware Chain
```
Request
  ↓
CORS / Body Parser
  ↓
Logging (console output)
  ↓
Helmet (security headers)
  ↓
Route-specific middleware (auth, validation)
  ↓
Controller
  ↓
Error Handler
  ↓
Response
```

### 4. Level Progression Logic
- User starts at `currentLevel: 1`
- Completing all words in a level advances user
- Users can unlock higher levels for coins
- `levelProgress` tracks detail per level
- `completedLevels` tracks best stars earned

### 5. Coin Economy
- Users start with `INITIAL_COINS` (default: 100)
- Earn coins from completing words
- Spend coins on hints, auto-solve, level unlock
- Paid purchases add coins

---

## 11. DEVELOPMENT ENVIRONMENT

### Package Dependencies

**Backend:**
```json
{
  "express": "4.18.2",
  "mongoose": "7.5.0",
  "jsonwebtoken": "9.0.2",
  "bcryptjs": "2.4.3",
  "cors": "2.8.5",
  "helmet": "7.0.0",
  "express-validator": "7.0.1",
  "dotenv": "16.3.1",
  "axios": "1.13.2",
  "node-telegram-bot-api": "0.66.0"
}
```

**Frontend:**
```json
{
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-router-dom": "6.15.0",
  "axios": "1.5.0",
  "react-query": "3.39.3",
  "react-hook-form": "7.45.4",
  "react-hot-toast": "2.4.1",
  "framer-motion": "10.16.1",
  "lucide-react": "0.279.0",
  "tailwindcss": "3.3.3",
  "vite": "4.4.5"
}
```

### Scripts
```bash
# Development
npm run dev              # Both frontend and backend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Build & Deploy
npm run build            # Build frontend
npm run start            # Run backend in production

# Database
npm run seed             # Seed initial data

# Quality
npm run lint             # Lint both
npm test                 # Test both
```

---

## 12. RECOMMENDATIONS FOR 1V1 BATTLE SYSTEM

### Database Changes Needed
1. **Battle Model** - Track active battles
2. **Battle History Model** - Track completed battles
3. **User Extension** - Add battle statistics (wins, losses, rating)
4. **Match Model** - Track individual matches within battles

### Backend Changes Needed
1. Socket.io integration
2. Battle controller & routes
3. Battle matching/queue system
4. Real-time word validation
5. Battle completion & scoring

### Frontend Changes Needed
1. Socket.io context for real-time updates
2. Battle/Multiplayer pages
3. Queue/Waiting UI
4. Split-screen or turn-based UI
5. Battle history page

### Architecture Pattern to Follow
- Use Context API like GameContext for battle state
- Use React Query for historical data
- Axios for REST calls (pairing/stats)
- Socket.io for real-time gameplay
- Keep separation between REST (history/stats) and WebSocket (live game)

---

## 13. KEY FILES REFERENCE

### Must Read Files
1. `/backend/src/models/User.js` - User schema structure
2. `/backend/src/controllers/gameController.js` - Game logic pattern
3. `/backend/src/middleware/auth.js` - Auth implementation
4. `/frontend/src/contexts/GameContext.jsx` - State management pattern
5. `/frontend/src/contexts/AuthContext.jsx` - Auth context pattern
6. `/backend/server.js` - Server setup & middleware chain

### Configuration Files
1. `/backend/.env` - Server configuration
2. `/backend/package.json` - Dependencies
3. `/frontend/package.json` - Dependencies
4. `/frontend/vite.config.js` - Vite build config
5. `/frontend/tailwind.config.js` - Tailwind theming

---

## 14. QUICK START FOR IMPLEMENTATION

### To add 1v1 Battles, follow this sequence:

1. **Database Layer**
   - Create Battle model
   - Create BattleMatch model
   - Extend User model with battle stats

2. **Backend Setup**
   - Install socket.io
   - Create battleController.js
   - Create battle routes
   - Setup Socket.io namespace

3. **Frontend Setup**
   - Install socket.io-client
   - Create BattleContext.jsx
   - Create BattleQueue page
   - Create BattleRoom page

4. **Real-time Features**
   - Real-time word submission
   - Opponent sync
   - Timer sync
   - Battle completion logic

5. **Integration**
   - Add battle routes to router
   - Link from home/game pages
   - Update leaderboard for battle stats

---

**Last Updated: 2025-11-16**
**Current Git Branch:** claude/harfland-1v1-battles-01Rb5DYwUoCgFHtwivbT39dp
