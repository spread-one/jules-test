const express = require('express');
const router = express.Router();
const path = require('path');

// Note: The authMiddleware has been removed from these page-serving routes.
// The data loaded by the scripts on these pages is still protected by the
// middleware in `chatApi.js`.

/**
 * @route   GET /chat
 * @desc    Serves the main chat list page
 * @access  Public (data loaded within is private)
 */
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'chat.html'));
});

/**
 * @route   GET /chat/:id
 * @desc    Serves the specific chat room page
 * @access  Public (data loaded within is private)
 */
router.get('/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'chatroom.html'));
});

module.exports = router;
