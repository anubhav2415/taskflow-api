const User = require('../models/user.model');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { ok, created, badRequest, unauthorized, conflict } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return conflict(res, 'An account with this email already exists');
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate tokens
    const tokens = generateTokens({ id: user._id, role: user.role });

    // Store refresh token
    user.refreshTokens.push({ token: tokens.refreshToken });
    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${email} (${user._id})`);

    return created(res, {
      user: user.toSafeObject(),
      tokens,
    }, 'Account created successfully');

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user WITH password (select: false by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return unauthorized(res, 'Invalid email or password');
    }

    if (!user.isActive) {
      return unauthorized(res, 'Your account has been deactivated');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return unauthorized(res, 'Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens({ id: user._id, role: user.role });

    // Update last login + store refresh token
    user.lastLogin = new Date();
    user.refreshTokens.push({ token: tokens.refreshToken });
    // Keep only last 5 refresh tokens (multi-device support)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);

    return ok(res, {
      user: user.toSafeObject(),
      tokens,
    }, 'Login successful');

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return badRequest(res, 'Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return unauthorized(res, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return unauthorized(res, 'User not found or deactivated');
    }

    // Verify refresh token exists in DB (rotation check)
    const tokenExists = user.refreshTokens.some((rt) => rt.token === token);
    if (!tokenExists) {
      // Possible token reuse attack — invalidate all tokens
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      return unauthorized(res, 'Refresh token reuse detected. Please log in again.');
    }

    // Rotate: remove old, add new
    const newTokens = generateTokens({ id: user._id, role: user.role });
    user.refreshTokens = user.refreshTokens
      .filter((rt) => rt.token !== token)
      .concat({ token: newTokens.refreshToken });

    await user.save({ validateBeforeSave: false });

    return ok(res, { tokens: newTokens }, 'Token refreshed');

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token && req.user) {
      req.user.refreshTokens = req.user.refreshTokens.filter((rt) => rt.token !== token);
      await req.user.save({ validateBeforeSave: false });
    }

    return ok(res, null, 'Logged out successfully');

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return ok(res, { user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
