const router = require('express').Router();
const {
  getAllUsers, getUser, updateProfile, changePassword, toggleUserStatus,
} = require('../../controllers/user.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { validate, schemas } = require('../../middlewares/validate.middleware');

router.use(protect);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin only
 */
router.get('/', restrictTo('admin'), getAllUsers);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/me', validate(schemas.updateProfile), updateProfile);

/**
 * @swagger
 * /api/v1/users/me/password:
 *   patch:
 *     summary: Change own password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password incorrect
 */
router.patch('/me/password', validate(schemas.changePassword), changePassword);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       403:
 *         description: Can only view own profile
 *       404:
 *         description: User not found
 */
router.get('/:id', getUser);

/**
 * @swagger
 * /api/v1/users/{id}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status toggled
 *       403:
 *         description: Cannot deactivate own account
 */
router.patch('/:id/toggle-status', restrictTo('admin'), toggleUserStatus);

module.exports = router;
