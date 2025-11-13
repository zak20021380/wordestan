const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const User = require('./src/models/User');
require('dotenv').config();

// Initialize Telegram bot
require('./bot');

// Import routes
const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/game');
const leaderboardRoutes = require('./src/routes/leaderboard');
const adminRoutes = require('./src/routes/admin');
const storeRoutes = require('./src/routes/store');
const paymentRoutes = require('./src/routes/payment');
const leitnerRoutes = require('./src/routes/leitner');

// Initialize Express app
const app = express();

// CORS configuration (must be registered before other middleware and routes)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📨 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`🔗 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🔑 Authorization: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  console.log(`📦 Body: ${JSON.stringify(req.body)}`);
  console.log(`${'='.repeat(80)}\n`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/leitner', leitnerRoutes);

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
    message: 'HarfLand Game API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      game: '/api/game',
      leaderboard: '/api/leaderboard',
      admin: '/api/admin',
      payment: '/api/payment',
      store: '/api/store',
      leitner: '/api/leitner',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.error('❌ 404 Error - Endpoint not found');
  console.error('📍 Requested path:', req.path);
  console.error('📍 Original URL:', req.originalUrl);
  console.error('🔧 Method:', req.method);
  console.error('🔧 Available routes:');
  console.error('   - /api/auth/*');
  console.error('   - /api/game/*');
  console.error('   - /api/leaderboard/*');
  console.error('   - /api/admin/*');
  console.error('   - /api/store/*');
  console.error('   - /api/payment/*');
  console.error('   - /api/leitner/*');

  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedPath: req.path,
    method: req.method,
    availableRoutes: [
      'POST /api/leitner/add',
      'POST /api/leitner/batch-add',
      'GET /api/leitner/words',
      'GET /api/leitner/review',
      'POST /api/leitner/review/:id',
      'GET /api/leitner/stats',
      'GET /api/leitner/box/:boxNumber',
      'PUT /api/leitner/:id/notes',
      'POST /api/leitner/:id/archive',
      'POST /api/leitner/:id/unarchive',
      'POST /api/leitner/:id/reset',
      'DELETE /api/leitner/:id'
    ]
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