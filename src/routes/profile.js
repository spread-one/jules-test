const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const data = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

// GET current user's profile data (posts and comments)
router.get('/me', authMiddleware, (req, res) => {
    const userId = req.user.id;

    const userPosts = data.posts.filter(p => p.authorId === userId);
    const userComments = [];
    data.posts.forEach(post => {
        post.comments.forEach(comment => {
            if (comment.authorId === userId) {
                userComments.push({
                    ...comment,
                    postTitle: post.title // Add post title to comment for context
                });
            }
        });
    });

    res.json({
        posts: userPosts,
        comments: userComments
    });
});

// PUT (update) user's profile (name and password)
router.put('/me', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newName, newPassword } = req.body;

    // Find the user in the data store
    const user = data.users.find(u => u.id === userId);
    if (!user) {
        // This should not happen if authMiddleware is working correctly
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // Update name if provided
    if (newName) {
        user.name = newName;
    }

    // Update password if provided
    if (newPassword) {
        user.password = await bcrypt.hash(newPassword, 10);
    }

    res.json({ message: '프로필이 성공적으로 업데이트되었습니다.' });
});

module.exports = router;
