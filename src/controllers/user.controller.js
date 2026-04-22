const User = require('../models/user.model');
const { ok, notFound, forbidden, badRequest } = require('../utils/apiResponse');

/**
 * GET /api/v1/users  (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    return ok(res, {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    // Users can only view their own profile (admins can view any)
    const targetId = req.params.id === 'me' ? req.user._id : req.params.id;

    if (req.user.role !== 'admin' && targetId.toString() !== req.user._id.toString()) {
      return forbidden(res, 'You can only view your own profile');
    }

    const user = await User.findById(targetId).lean();
    if (!user) return notFound(res, 'User not found');

    return ok(res, { user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/users/me  - Update own profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Check email uniqueness
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) return badRequest(res, 'Email already in use');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, email } },
      { new: true, runValidators: true }
    );

    return ok(res, { user: user.toSafeObject() }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/users/me/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return badRequest(res, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    return ok(res, null, 'Password changed successfully. Please log in again.');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/users/:id/toggle-status  (admin only)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return forbidden(res, 'Cannot deactivate your own account');
    }

    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found');

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return ok(res, { user: user.toSafeObject() },
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUser, updateProfile, changePassword, toggleUserStatus };
