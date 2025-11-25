const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// IMPORTANT: Specific routes MUST come before dynamic routes like /:userId

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, userController.updateProfile);

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', auth, userController.searchUsers);

// @route   GET /api/users/dashboard/stats
// @desc    Get dashboard stats
// @access  Private
router.get('/dashboard/stats', auth, userController.getDashboardStats);

// @route   GET /api/users/find-by-email
// @desc    Find user by email
// @access  Private
router.get('/find-by-email', auth, userController.findUserByEmail);

// @route   GET /api/users/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/notifications', auth, userController.getNotifications);

// @route   POST /api/users/random-avatar
// @desc    Generate a random profile avatar for the current user
// @access  Private
router.post('/random-avatar', auth, userController.generateRandomAvatar);

// @route   DELETE /api/users/account
// @desc    Delete user account permanently
// @access  Private
router.delete('/account', auth, userController.deleteAccount);

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
// MUST BE LAST - catches any path that doesn't match above
router.get('/:userId', auth, userController.getUserById);

module.exports = router;