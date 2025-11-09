const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId, isAdmin = false) => {
  return jwt.sign(
    { id: userId, isAdmin }, 
    process.env.JWT_SECRET,
    { expiresIn: isAdmin ? process.env.JWT_ADMIN_EXPIRES_IN : process.env.JWT_EXPIRES_IN }
  );
};

// @desc    Register a new player
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password, email } = req.body;
    const trimmedUsername = typeof username === 'string' ? username.trim() : '';

    if (!trimmedUsername) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid username'
      });
    }

    if (/\s/.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username cannot contain spaces'
      });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'این نام کاربری قبلاً گرفته شده است. لطفاً یک نام کاربری دیگر انتخاب کنید.'
      });
    }

    let normalizedEmail = null;
    if (typeof email !== 'undefined') {
      const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (trimmedEmail) {
        const existingEmailUser = await User.findOne({ email: trimmedEmail });

        if (existingEmailUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }

        normalizedEmail = trimmedEmail;
      }
    }

    // Create new user with initial coins
    const user = new User({
      username: trimmedUsername,
      password,
      email: normalizedEmail,
      coins: parseInt(process.env.INITIAL_COINS) || 100,
      isAdmin: false
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, false);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          coins: user.coins,
          levelsCleared: user.levelsCleared,
          totalScore: user.totalScore,
          wordsFound: user.wordsFound,
          bestStreak: user.bestStreak,
          currentStreak: user.currentStreak,
          currentLevel: user.currentLevel,
          completedLevels: user.completedLevels,
          completedWords: user.completedWords,
          lastActive: user.lastActive,
          createdAt: user.createdAt,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last active
    await user.updateLastActive();

    // Generate token
    const token = generateToken(user._id, user.isAdmin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          coins: user.coins,
          levelsCleared: user.levelsCleared,
          totalScore: user.totalScore,
          wordsFound: user.wordsFound,
          bestStreak: user.bestStreak,
          currentStreak: user.currentStreak,
          currentLevel: user.currentLevel,
          completedLevels: user.completedLevels,
          completedWords: user.completedWords,
          lastActive: user.lastActive,
          createdAt: user.createdAt,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('completedWords', 'text length')
      .populate('completedLevels', 'order letters');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email } = req.body;
    const userId = req.user.id;

    const updateFields = {};

    if (typeof username !== 'undefined') {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length > 0) {
        // Check if username already exists for other users (case-insensitive)
        const existingUser = await User.findOne({
          _id: { $ne: userId },
          username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'این نام کاربری قبلاً گرفته شده است. لطفاً یک نام کاربری دیگر انتخاب کنید.'
          });
        }

        updateFields.username = trimmedUsername;
      }
    }

    if (typeof email !== 'undefined') {
      const normalizedEmail = email ? email.trim().toLowerCase() : null;

      if (normalizedEmail) {
        // Check if email already exists for other users
        const existingEmailUser = await User.findOne({
          _id: { $ne: userId },
          email: normalizedEmail
        });

        if (existingEmailUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }

        updateFields.email = normalizedEmail;
      } else {
        updateFields.email = null;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      const currentUser = await User.findById(userId).select('-password');
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: currentUser
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Check if a username is available
// @route   GET /api/auth/check-username
// @access  Public
const checkUsernameAvailability = async (req, res) => {
  try {
    const rawUsername = typeof req.query.username === 'string' ? req.query.username : '';
    const trimmedUsername = rawUsername.trim();

    if (!trimmedUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username query parameter is required'
      });
    }

    if (/\s/.test(trimmedUsername)) {
      return res.json({
        success: true,
        available: false,
        message: 'Username cannot contain spaces'
      });
    }

    // Check if username exists (case-insensitive)
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
    });

    return res.json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? 'این نام کاربری قبلاً گرفته شده است.'
        : 'این نام کاربری در دسترس است!'
    });
  } catch (error) {
    console.error('Username availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking username availability'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  checkUsernameAvailability
};
