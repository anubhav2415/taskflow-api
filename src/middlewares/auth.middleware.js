const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');
const { unauthorized, forbidden } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * protect - Verifies JWT and attaches user to req.user
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header or cookie
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Optional: also support httpOnly cookies
    // else if (req.cookies?.accessToken) { token = req.cookies.accessToken; }

    if (!token) {
      return unauthorized(res, 'No token provided. Please log in.');
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Token expired. Please log in again.');
      }
      if (err.name === 'JsonWebTokenError') {
        return unauthorized(res, 'Invalid token. Please log in again.');
      }
      throw err;
    }

    // 3. Check if user still exists
    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (!user) {
      return unauthorized(res, 'The user associated with this token no longer exists.');
    }

    // 4. Check if user is active
    if (!user.isActive) {
      return forbidden(res, 'Your account has been deactivated. Contact support.');
    }

    // 5. Check if password was changed after token was issued
    if (user.passwordChangedAfter(decoded.iat)) {
      return unauthorized(res, 'Password recently changed. Please log in again.');
    }

    // 6. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return unauthorized(res, 'Authentication failed.');
  }
};

/**
 * restrictTo - Restricts route to specific roles
 * Usage: restrictTo('admin') or restrictTo('admin', 'moderator')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'You must be logged in.');
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Access denied. Requires role: ${roles.join(' or ')}`);
    }
    next();
  };
};

/**
 * optionalAuth - Attaches user if token is present, but doesn't block if absent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshTokens');
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // Silently ignore - user stays unauthenticated
  }
  next();
};

module.exports = { protect, restrictTo, optionalAuth };
