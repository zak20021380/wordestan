const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const User = require('./src/models/User');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/game');
const leaderboardRoutes = require('./src/routes/leaderboard');
const adminRoutes = require('./src/routes/admin');
const storeRoutes = require('./src/routes/store');
const paymentRoutes = require('./src/routes/payment');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Word Connect Game API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      game: '/api/game',
      leaderboard: '/api/leaderboard',
      admin: '/api/admin',
      payment: '/api/payment',
      store: '/api/store',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

// Database connection
const removeLegacyEmailIndex = async () => {
  try {
    const collectionName = (User.collection && (User.collection.collectionName || User.collection.name)) || 'users';
    const collection = mongoose.connection.collection(collectionName);
    const indexes = await collection.indexes();
    const emailIndex = indexes.find(index => index.name === 'email_1');

    if (emailIndex) {
      await collection.dropIndex('email_1');
      console.log('Dropped legacy unique index on email');
    }
  } catch (error) {
    if (error.codeName === 'IndexNotFound' || error.code === 27) {
      console.log('Legacy email index already removed');
    } else if (error.codeName === 'NamespaceNotFound' || error.code === 26) {
      console.log('User collection not found yet; no legacy email index to drop');
    } else {
      console.error('Failed to drop legacy email index:', error);
    }
  }
};

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

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Start the server
startServer();