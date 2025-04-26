const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

// @route   POST /api/friends/request
// @desc    Send a friend request
// @access  Private
router.post('/request', auth, friendController.sendFriendRequest);

// @route   POST /api/friends/request-by-id
// @desc    Send a friend request by user ID
// @access  Private
router.post('/request-by-id', auth, friendController.sendFriendRequestById);

// @route   GET /api/friends/requests
// @desc    Get all friend requests for current user
// @access  Private
router.get('/requests', auth, friendController.getFriendRequests);

// @route   PUT /api/friends/accept/:requestId
// @desc    Accept a friend request
// @access  Private
router.put('/accept/:requestId', auth, friendController.acceptFriendRequest);

// @route   PUT /api/friends/decline/:requestId
// @desc    Decline a friend request
// @access  Private
router.put('/decline/:requestId', auth, friendController.declineFriendRequest);

// @route   GET /api/friends
// @desc    Get all friends of current user
// @access  Private
router.get('/', auth, friendController.getFriends);

// @route   DELETE /api/friends/:friendshipId
// @desc    Remove a friend
// @access  Private
router.delete('/:friendshipId', auth, friendController.removeFriend);

module.exports = router;