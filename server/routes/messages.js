const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Send a message to another user
// @access  Private
router.post('/', auth, messageController.sendMessage);

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', auth, messageController.getConversations);

// @route   GET /api/messages/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get('/:userId', auth, messageController.getConversation);

// @route   PUT /api/messages/:userId/read
// @desc    Mark messages as read
// @access  Private
router.put('/:userId/read', auth, messageController.markAsRead);

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private (only sender)
router.delete('/:messageId', auth, messageController.deleteMessage);

// @route   POST /api/messages/activity
// @desc    Send a message to an activity group chat via REST API
// @access  Private
router.post('/activity', auth, messageController.sendActivityMessage);

// @route   GET /api/messages/activity/:activityId
// @desc    Get messages for an activity group chat via REST API
// @access  Private
router.get('/activity/:activityId', auth, messageController.getActivityMessages);

module.exports = router;