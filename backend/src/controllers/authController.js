const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const TELEGRAM_LOGIN_MAX_AGE_MS = parseInt(process.env.TELEGRAM_LOGIN_MAX_AGE_MS, 10) || 24 * 60 * 60 * 1000;

const mapUserResponse = (user) => ({
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
  levelProgress: user.levelProgress,
  lastActive: user.lastActive,
  createdAt: user.createdAt,
  isAdmin: user.isAdmin,
  telegramId: user.telegramId || null
});

const sanitizeTelegramUsername = (value) => {
  if (!value) {
    return null;
  }

  const normalized = value.toString().trim().toLowerCase().replace(/\s+/g, '_');
  const sanitized = normalized.replace(/[^a-z0-9_]/g, '');
  const trimmed = sanitized.replace(/^_+|_+$/g, '');

  if (trimmed.length < 3) {
    return null;
  }

  return trimmed.slice(0, 20);
};

const ensureUniqueUsername = async (base) => {
  if (!base) {
    return null;
  }

  const truncatedBase = base.slice(0, 20);
  let candidate = truncatedBase;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${candidate}$`, 'i') }
    }).select('_id');

    if (!existingUser) {
      return candidate;
    }

    const suffix = (attempt + 1).toString();
    const prefix = truncatedBase.slice(0, Math.max(3, 20 - suffix.length));
    candidate = `${prefix}${suffix}`;
  }

  return null;
};

const generateUsernameForTelegramUser = async (telegramUser) => {
  const candidates = [];

  if (telegramUser?.username) {
    candidates.push(telegramUser.username);
  }

  if (telegramUser?.first_name || telegramUser?.last_name) {
    candidates.push(`${telegramUser.first_name || ''}_${telegramUser.last_name || ''}`);
  }

  if (telegramUser?.id) {
    candidates.push(`tg_${telegramUser.id}`);
    candidates.push(`player_${telegramUser.id}`);
  }

  for (const value of candidates) {
    const sanitized = sanitizeTelegramUsername(value);
    if (!sanitized) {
      continue;
    }

    const unique = await ensureUniqueUsername(sanitized);
    if (unique) {
      return unique;
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const randomCandidate = `tg_${telegramUser?.id || ''}_${crypto.randomBytes(2).toString('hex')}`;
    const sanitized = sanitizeTelegramUsername(randomCandidate);
    const unique = await ensureUniqueUsername(sanitized);
    if (unique) {
      return unique;
    }
  }

  const fallback = sanitizeTelegramUsername(`tg_${crypto.randomBytes(4).toString('hex')}`);
  return (await ensureUniqueUsername(fallback)) || fallback || `tg${Date.now()}`.slice(0, 20);
};

const verifyTelegramInitData = (initData, botToken) => {
  if (typeof initData !== 'string' || !initData.trim()) {
    return { isValid: false, reason: 'Invalid init data format' };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    return { isValid: false, reason: 'Missing hash parameter' };
  }

  const dataCheckArray = [];
  params.forEach((value, key) => {
    if (key === 'hash') {
      return;
    }
    dataCheckArray.push(`${key}=${value}`);
  });

  dataCheckArray.sort();
  const dataCheckString = dataCheckArray.join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return {
    isValid: computedHash === hash,
    params,
    reason: computedHash === hash ? null : 'Hash mismatch'
  };
};

// Generate JWT token
const generateToken = (userId, isAdmin = false) => {
  const rawExpiresIn = isAdmin ? process.env.JWT_ADMIN_EXPIRES_IN : process.env.JWT_EXPIRES_IN;
  const expiresIn = typeof rawExpiresIn === 'string' && rawExpiresIn.trim() !== ''
    ? rawExpiresIn.trim()
    : isAdmin
      ? '12h'
      : '7d';

  return jwt.sign(
    { id: userId, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn }
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
        user: mapUserResponse(user)
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
    const updatedUser = await user.updateLastActive();

    // Generate token
    const token = generateToken(updatedUser._id, updatedUser.isAdmin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: mapUserResponse(updatedUser)
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

// @desc    Authenticate via Telegram Web App
// @route   POST /api/auth/telegram
// @access  Public
const telegramAuth = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Telegram bot token is not configured');
      return res.status(500).json({
        success: false,
        message: 'Telegram integration is not configured'
      });
    }

    const { initData } = req.body;
    const verification = verifyTelegramInitData(initData, botToken);

    if (!verification.isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Telegram login data'
      });
    }

    const rawUser = verification.params?.get('user');
    if (!rawUser) {
      return res.status(400).json({
        success: false,
        message: 'Telegram user payload is missing'
      });
    }

    let telegramUser;
    try {
      telegramUser = JSON.parse(rawUser);
    } catch (parseError) {
      console.error('Failed to parse Telegram user payload:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid Telegram user payload'
      });
    }

    const telegramId = telegramUser?.id ? String(telegramUser.id) : null;
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram user identifier is missing'
      });
    }

    const authDate = Number(verification.params.get('auth_date'));
    if (Number.isFinite(authDate) && TELEGRAM_LOGIN_MAX_AGE_MS > 0) {
      const loginAge = Date.now() - authDate * 1000;
      if (loginAge > TELEGRAM_LOGIN_MAX_AGE_MS) {
        return res.status(401).json({
          success: false,
          message: 'Telegram login request has expired'
        });
      }
    }

    let user = await User.findOne({ telegramId });
    let isNewUser = false;

    if (!user) {
      const username = await generateUsernameForTelegramUser(telegramUser);
      const password = crypto.randomBytes(32).toString('hex');

      user = new User({
        username,
        password,
        telegramId,
        email: null,
        coins: parseInt(process.env.INITIAL_COINS, 10) || 100,
        isAdmin: false
      });

      await user.save();
      isNewUser = true;
    }

    const activeUser = await user.updateLastActive();
    const token = generateToken(activeUser._id, activeUser.isAdmin);

    return res.json({
      success: true,
      message: isNewUser ? 'Telegram account created and logged in successfully' : 'Telegram login successful',
      data: {
        token,
        user: mapUserResponse(activeUser),
        isNewUser
      }
    });
  } catch (error) {
    console.error('Telegram login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Telegram authentication'
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
      .populate('levelProgress.levelId', 'order letters')
      .populate('levelProgress.completedWords', 'text length')
      .populate('completedLevels.levelId', 'order letters');

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
  checkUsernameAvailability,
  telegramAuth
};
