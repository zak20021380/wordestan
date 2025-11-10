# HarfLand Game - Full Stack Application

A professionally structured Persian word game with admin dashboard, featuring drag-to-connect gameplay with live SVG path rendering, coin economy, and comprehensive admin controls.

## 🎮 Game Features

### Player Experience
- **Drag-to-Connect Gameplay**: Intuitive letter connection with live SVG path rendering
- **Beautiful Wooden Theme**: Warm, elegant design with glassmorphic UI elements
- **Progressive Difficulty**: Multiple levels with increasing complexity
- **Coin Economy**: Earn and spend coins on hints and auto-solve features
- **Leaderboard System**: Compete with players worldwide
- **Responsive Design**: Optimized for mobile and desktop

### Admin Dashboard
- **Comprehensive Content Management**: CRUD operations for words, levels, and coin packs
- **Real-time Analytics**: Player statistics, revenue tracking, and engagement metrics
- **Level Publishing Control**: Publish/unpublish levels to control game progression
- **Store Management**: Create and manage coin pack offerings

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - RESTful API server
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Secure authentication and authorization
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** + **cors** - Security middleware

### Frontend
- **React 18** + **Vite** - Modern React development
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Lucide React** - Beautiful icons

### Game Engine
- **SVG Canvas** - Live path rendering during drag
- **Pointer Events** - Touch and mouse support
- **requestAnimationFrame** - Smooth 60fps animations
- **Circular Letter Layout** - Dynamic positioning

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB 4.4+ (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd harfland-game
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # Backend
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

6. **Seed the database** (optional, for demo data)
   ```bash
   cd backend
   npm run seed
   ```

7. **Start the development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

### Demo Accounts

**Admin Account:**
- Email: `admin@harfland.com`
- Password: `admin123`

**User Accounts:**
- Email: `player1@example.com` through `player5@example.com`
- Password: `user123`

## 📁 Project Structure

```
/mnt/okcomputer/output/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── controllers/    # Route controllers
│   │   └── utils/          # Utility functions
│   ├── server.js           # Main server file
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── shared/                 # Shared types/constants
└── README.md
```

## 🎨 Design System

### Colors
- **Primary Orange**: `#f97316` - Main accent color
- **Secondary Yellow**: `#eab308` - Highlights and warnings
- **Wood Brown**: `#c4965f` - Wooden theme base
- **Glass White**: `rgba(255,255,255,0.1)` - Glassmorphism

### Typography
- **Display Font**: Poppins (headings)
- **Body Font**: Inter (content)

### Components
- **Glass Cards**: Semi-transparent with backdrop blur
- **Gradient Buttons**: Smooth hover animations
- **SVG Icons**: Scalable and consistent

## 🔧 Configuration

### Backend Configuration (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/harfland

# JWT
JWT_SECRET=your_secure_key
JWT_EXPIRES_IN=7d

# Game Settings
INITIAL_COINS=100
HINT_COST=10
AUTO_SOLVE_COST=50
```

### Frontend Configuration (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=HarfLand
VITE_APP_NAME_FA=حرف‌لند
```

## 🎯 Key Features Implementation

### Game Canvas
- **SVG-based rendering** for smooth path drawing
- **Pointer events** for cross-device compatibility
- **Circular letter arrangement** with dynamic positioning
- **Real-time path updates** during drag operations

### Authentication
- **JWT-based** secure authentication
- **Role-based access** (user/admin)
- **Protected routes** in React
- **Token refresh** mechanism

### Database Schema
- **Users**: Authentication and progress tracking
- **Words**: Vocabulary management
- **Levels**: Game progression system
- **Coin Packs**: Store offerings
- **Purchases**: Transaction history

### Admin Dashboard
- **Real-time statistics** with MongoDB aggregation
- **CRUD operations** for all content types
- **Responsive data tables** with search and pagination
- **Analytics charts** for business insights

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Environment Variables for Production
- Update `MONGODB_URI` to your production database
- Change `JWT_SECRET` to a secure, random string
- Set `NODE_ENV=production`
- Configure `FRONTEND_URL` for CORS

## 📱 Mobile Optimization

- **Touch-first design** with 44px minimum touch targets
- **Responsive layouts** using Tailwind CSS
- **Performance optimized** with code splitting
- **Offline support** ready (PWA compatible)

## 🔒 Security Features

- **Input validation** on all endpoints
- **Rate limiting** to prevent abuse
- **CORS configuration** for cross-origin requests
- **Helmet.js** for HTTP security headers
- **bcrypt** for password hashing

## 📊 Performance Optimizations

- **React Query** for intelligent caching
- **Code splitting** with Vite
- **Image optimization** ready
- **Lazy loading** for components
- **Debounced search** inputs

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if implemented)
cd frontend
npm test
```

## 📈 Monitoring & Analytics

- **Error tracking** with comprehensive logging
- **Performance metrics** available
- **User engagement** tracking ready
- **Admin analytics** dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- **React Community** for the amazing ecosystem
- **Tailwind CSS** for the utility-first approach
- **Framer Motion** for smooth animations
- **MongoDB** for the flexible database
- **Express.js** for the robust backend framework

---

**Built with 💜 by the HarfLand Team**