# HarfLand Codebase - Quick Start Guide

This directory contains comprehensive documentation about the HarfLand codebase structure to help you implement the 1v1 battle system.

## Documentation Files

### 1. **CODEBASE_OVERVIEW.md** (21 KB)
   - Complete project structure breakdown
   - All models with database schemas
   - JWT authentication system explanation
   - Complete API routes reference
   - Frontend component organization
   - State management patterns (Context API + React Query)
   - Socket.IO status (NOT currently implemented)
   - Database connection setup details
   - Key architectural patterns

**Use this when you need:**
- Understanding how any part of the system works
- Finding specific models, routes, or components
- Learning the current API structure
- Understanding authentication flow

---

### 2. **ARCHITECTURE_VISUAL.txt** (22 KB)
   - ASCII diagrams showing system architecture
   - Frontend data flow from React context to API
   - Backend request processing pipeline
   - Word completion example walkthrough
   - Authentication flow diagrams
   - State management breakdown (Context, React Query, localStorage)
   - List of what's missing for 1v1 battles
   - Technology stack with versions
   - Critical file relationships
   - System integration points

**Use this when you need:**
- Quick visual reference
- Understanding data flow
- Identifying which files communicate with which
- Understanding the request/response cycle

---

### 3. **IMPLEMENTATION_PATTERNS.md** (20 KB)
   - Code examples for BattleContext (following AuthContext pattern)
   - Battle controller code template (following gameController pattern)
   - Battle model schema (following User model pattern)
   - Battle service code (following gameService pattern)
   - Battle routes code (following game routes pattern)
   - Sample BattleRoom component
   - Socket.IO event handler structure
   - Response format standards
   - Middleware chain visualization
   - Environment variables needed
   - 10 key patterns to follow

**Use this when you:**
- Are writing new code
- Need template/boilerplate
- Want to understand existing patterns
- Are implementing new features

---

## Key Information At a Glance

### Project Stack
- **Backend:** Node.js 16+, Express 4.18, MongoDB 7.5, Mongoose, JWT
- **Frontend:** React 18, Vite, React Router 6, Tailwind CSS, React Query, Framer Motion
- **Missing:** Socket.io (needed for 1v1 battles)

### Current Git Branch
```
claude/harfland-1v1-battles-01Rb5DYwUoCgFHtwivbT39dp
```

### Key URLs in Development
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Base Path: /api

### Database
- Name: wordconnect
- Type: MongoDB
- Connection: Via Mongoose ODM
- Collections: users, levels, words, gamesettings, coinpacks, purchases, leitnerboxes, botusers

---

## How to Use These Docs

### Scenario 1: "I need to understand how X works"
→ Go to **CODEBASE_OVERVIEW.md** and search for that component/model/route

### Scenario 2: "I need to see how data flows from frontend to backend"
→ Go to **ARCHITECTURE_VISUAL.txt** and look at the data flow diagrams

### Scenario 3: "I need to implement a new feature following existing patterns"
→ Go to **IMPLEMENTATION_PATTERNS.md** and find the relevant pattern example

### Scenario 4: "I need a specific code example for BattleContext"
→ See **IMPLEMENTATION_PATTERNS.md** Section 1

### Scenario 5: "I need to understand authentication"
→ See **CODEBASE_OVERVIEW.md** Section 3 for details, **ARCHITECTURE_VISUAL.txt** Section 4 for flow

### Scenario 6: "I need to know what Socket.IO events I should create"
→ See **IMPLEMENTATION_PATTERNS.md** Section 7

---

## Files You'll Be Modifying/Creating

### Backend
```
backend/src/
├── models/
│   ├── Battle.js              [CREATE] - Track battle records
│   └── User.js                [EXTEND] - Add battle stats
├── controllers/
│   └── battleController.js    [CREATE] - Battle logic
├── routes/
│   ├── battles.js             [CREATE] - Battle endpoints
│   └── server.js              [MODIFY] - Register Socket.io
├── middleware/
│   └── auth.js                [REFERENCE] - Use existing pattern
└── socketEvents.js            [CREATE] - WebSocket handlers
```

### Frontend
```
frontend/src/
├── contexts/
│   └── BattleContext.jsx      [CREATE] - Battle state management
├── services/
│   └── battleService.js       [CREATE] - API client
├── pages/
│   ├── BattleQueue.jsx        [CREATE] - Queue/waiting page
│   └── BattleRoom.jsx         [CREATE] - Active battle page
├── App.jsx                    [MODIFY] - Add battle routes
└── main.jsx                   [MODIFY] - Add BattleProvider
```

---

## Implementation Checklist

### Phase 1: Database & Backend Setup
- [ ] Create Battle model (see IMPLEMENTATION_PATTERNS.md Section 3)
- [ ] Extend User model with battle stats
- [ ] Create battleController.js (see IMPLEMENTATION_PATTERNS.md Section 2)
- [ ] Create routes/battles.js (see IMPLEMENTATION_PATTERNS.md Section 5)
- [ ] Install socket.io: `npm install socket.io`
- [ ] Create socketEvents.js (see IMPLEMENTATION_PATTERNS.md Section 7)
- [ ] Modify server.js to setup Socket.io
- [ ] Add battle routes to server.js

### Phase 2: Frontend Setup
- [ ] Install socket.io-client: `npm install socket.io-client`
- [ ] Create BattleContext.jsx (see IMPLEMENTATION_PATTERNS.md Section 1)
- [ ] Create battleService.js (see IMPLEMENTATION_PATTERNS.md Section 4)
- [ ] Wrap App with BattleProvider
- [ ] Create BattleQueue page
- [ ] Create BattleRoom page (see IMPLEMENTATION_PATTERNS.md Section 6)
- [ ] Add routes to App.jsx

### Phase 3: Integration
- [ ] Link to battles from Home page
- [ ] Test Socket.io connection
- [ ] Test matchmaking system
- [ ] Test word submission in battles
- [ ] Test battle completion and statistics

### Phase 4: Polish
- [ ] Add battle animations
- [ ] Add sound effects
- [ ] Test on mobile
- [ ] Add battle history page
- [ ] Update leaderboard for battle rankings

---

## Important Patterns to Remember

### 1. Response Format
All API endpoints return:
```javascript
{
  success: Boolean,
  message: String,
  data: Object // actual response
}
```

### 2. Authentication
- JWT tokens stored in localStorage
- Axios automatically adds `Authorization: Bearer <token>` header
- All protected routes require auth middleware
- Tokens valid for 365 days (recently extended)

### 3. State Management
- **Global/Shared:** Use Context API (like GameContext, AuthContext)
- **UI State:** useState
- **Server Data:** React Query (caching, refetching)
- **Persistent:** localStorage (tokens)
- **Real-time:** Socket.io events

### 4. Error Handling
- Always wrap controller logic in try/catch
- Use express-validator for input validation
- Return appropriate status codes (400, 401, 403, 404, 500)
- Include meaningful error messages

### 5. Socket.IO Events
- Use namespace prefix: `battle:event-name`
- Example: `battle:join-queue`, `battle:word-submitted`
- Handle connection, disconnect, and error events
- Emit to specific players, not broadcast

---

## Key File References

### Must Read (in order)
1. `/backend/src/models/User.js` - See how models are structured
2. `/backend/src/controllers/gameController.js` - See controller patterns
3. `/backend/src/middleware/auth.js` - Understand authentication
4. `/frontend/src/contexts/GameContext.jsx` - Context pattern
5. `/backend/server.js` - Middleware chain and setup

### Reference for Specific Tasks
- **Need to create a new route?** → See `/backend/src/routes/game.js`
- **Need to create a new service?** → See `/frontend/src/services/gameService.js`
- **Need to create a new page?** → See `/frontend/src/pages/Game.jsx`
- **Need to query database?** → See `/backend/src/controllers/gameController.js`

---

## Environment Setup

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wordconnect
JWT_SECRET=zakaria_wordconnect_super_secret_key_123456789
JWT_EXPIRES_IN=365d
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
BATTLE_TIMEOUT=300
BATTLE_POINTS_MULTIPLIER=2
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Testing Your Implementation

### Manual Testing Checklist
```
Socket.IO Connection:
  [ ] User connects with token auth
  [ ] Connection persists across page changes
  [ ] Reconnection works after disconnect

Battle Matching:
  [ ] Two players can join queue
  [ ] System finds opponent
  [ ] Both players see same opponent info
  [ ] Battle starts with correct level

Gameplay:
  [ ] Player A submits word → Player B sees it
  [ ] Word validation works
  [ ] Timer syncs between players
  [ ] Battle completes when all words found
  [ ] Stats updated correctly

Edge Cases:
  [ ] Player disconnects mid-battle
  [ ] Opponent found but disconnects before battle starts
  [ ] Same word submitted twice
  [ ] Invalid words rejected
  [ ] Time expires during battle
```

---

## Common Gotchas & Solutions

### Problem: "Socket not connecting"
- Check CORS origin in backend .env
- Verify token is in localStorage
- Check browser console for errors
- Ensure socket.io port matches API port

### Problem: "Opponent not seeing my moves"
- Socket.io event not emitted to opponent?
- Opponent socket not in correct room?
- Check socket.io event namespace

### Problem: "Battle not starting"
- Check if both players are authenticated
- Verify level exists in database
- Check auth middleware on battle routes

### Problem: "React Query cache not updating"
- Remember to invalidate queries after mutations
- Check query key consistency
- See GameContext for examples

---

## Next Steps

1. **Read CODEBASE_OVERVIEW.md** - Get familiar with structure
2. **Review ARCHITECTURE_VISUAL.txt** - Understand data flow
3. **Check IMPLEMENTATION_PATTERNS.md** - See code examples
4. **Start with Backend** - Models, then controllers, then routes
5. **Then Frontend** - Context, service, pages
6. **Test incrementally** - Test each feature as you build

---

**Happy coding! The documentation files have everything you need to implement 1v1 battles following HarfLand's existing patterns.**

For questions about specific parts, see the detailed documentation files.
