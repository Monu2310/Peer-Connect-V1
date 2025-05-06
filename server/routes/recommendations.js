const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// @route   GET /api/recommendations
// @desc    Get personalized activity recommendations
// @access  Private
router.get('/', auth, recommendationController.getRecommendations);

// @route   GET /api/recommendations/friends
// @desc    Get friend recommendations based on preferences
// @access  Private
router.get('/friends', auth, recommendationController.getFriendRecommendations);

// @route   GET /api/recommendations/similar/:activityId
// @desc    Get activities similar to a specific one
// @access  Private
router.get('/similar/:activityId', auth, recommendationController.getSimilarActivities);

// @route   GET /api/recommendations/insights
// @desc    Get user activity summary
// @access  Private
router.get('/insights', auth, recommendationController.getUserInsights);

module.exports = router;