const express = require('express');
const router = express.Router();
const data = require('../dataStore');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

// Mount both middlewares for all routes in this file
router.use(authMiddleware, adminOnly);

// GET /api/admin/users - Get all users with their post counts
router.get('/users', (req, res) => {
    try {
        const usersWithPostCounts = data.users.map(user => {
            const postCount = data.posts.filter(post => post.authorId === user.id).length;
            // Return a copy of the user object without the password
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                postCount
            };
        });
        res.json(usersWithPostCounts);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// POST /api/admin/users/:userId/toggle-suspend - Suspend or unsuspend a user
router.post('/users/:userId/toggle-suspend', (req, res) => {
    try {
        const userIdToToggle = parseInt(req.params.userId, 10);
        if (isNaN(userIdToToggle)) {
            return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
        }

        // Prevent admin from suspending themselves
        if (req.user.id === userIdToToggle) {
            return res.status(400).json({ message: '관리자는 스스로를 정지할 수 없습니다.' });
        }

        const user = data.users.find(u => u.id === userIdToToggle);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // Toggle suspension status
        user.isSuspended = !user.isSuspended;

        res.json({
            message: `사용자 ${user.userId}의 계정이 ${user.isSuspended ? '정지' : '정지 해제'}되었습니다.`,
            user: {
                id: user.id,
                userId: user.userId,
                isSuspended: user.isSuspended
            }
        });

    } catch (error) {
        console.error('Error toggling user suspension:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
