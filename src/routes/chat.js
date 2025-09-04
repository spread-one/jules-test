const express = require('express');
const router = express.Router();
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route   GET /chat
 * @desc    Serves the main chat list page
 * @access  Private
 */
router.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'chat.html'));
});

/**
 * @route   GET /chat/:id
 * @desc    Serves the specific chat room page
 * @access  Private
 */
router.get('/:id', authMiddleware, (req, res) => {
    // We can add logic here later to verify the user is part of this chat room
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'chatroom.html'));
});

module.exports = router;
