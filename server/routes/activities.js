const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Private
router.post('/', auth, activityController.createActivity);

// @route   GET /api/activities
// @desc    Get all activities with optional filtering
// @access  Private
router.get('/', auth, activityController.getActivities);

// @route   GET /api/activities/user/created
// @desc    Get activities created by current user
// @access  Private
router.get('/user/created', auth, activityController.getMyCreatedActivities);

// @route   GET /api/activities/user/joined
// @desc    Get activities joined by current user
// @access  Private
router.get('/user/joined', auth, activityController.getMyJoinedActivities);

// @route   GET /api/activities/:activityId
// @desc    Get activity by ID
// @access  Private
router.get('/:activityId', auth, activityController.getActivityById);

// @route   POST /api/activities/:activityId/join
// @desc    Join an activity
// @access  Private
router.post('/:activityId/join', auth, activityController.joinActivity);

// @route   DELETE /api/activities/:activityId/leave
// @desc    Leave an activity
// @access  Private
router.delete('/:activityId/leave', auth, activityController.leaveActivity);

// @route   PUT /api/activities/:activityId
// @desc    Update activity
// @access  Private (only creator)
router.put('/:activityId', auth, activityController.updateActivity);

// @route   DELETE /api/activities/:activityId
// @desc    Delete activity
// @access  Private (only creator)
router.delete('/:activityId', auth, activityController.deleteActivity);

module.exports = router;
