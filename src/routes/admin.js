const express = require('express');
const router = express.Router();
const data = require('../dataStore');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { getRank } = require('../utils/rank');

// Mount both middlewares for all routes in this file
router.use(authMiddleware, adminOnly);

// GET /api/admin/users - Get all users with their post counts, scores, and ranks
router.get('/users', (req, res) => {
    try {
        const usersWithDetails = data.users.map(user => {
            const postCount = data.posts.filter(post => post.authorId === user.id).length;
            // Admins are always Master rank, others are based on score
            const rank = user.role === 'admin' ? 'Master' : getRank(user.score);

            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                postCount,
                rank, // Add rank to the response
            };
        });
        res.json(usersWithDetails);
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

// POST /api/admin/users/:userId/adjust-score - Manually adjust a user's score
router.post('/users/:userId/adjust-score', (req, res) => {
    try {
        const userIdToAdjust = parseInt(req.params.userId, 10);
        const { score } = req.body;

        if (isNaN(userIdToAdjust)) {
            return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
        }

        if (score === undefined || typeof score !== 'number' || !Number.isInteger(score)) {
            return res.status(400).json({ message: '점수는 정수여야 합니다.' });
        }

        const user = data.users.find(u => u.id === userIdToAdjust);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: '관리자의 점수는 수정할 수 없습니다.' });
        }

        user.score = score;

        res.json({
            message: `사용자 ${user.userId}의 점수가 ${score}(으)로 성공적으로 업데이트되었습니다.`,
            user: {
                id: user.id,
                userId: user.userId,
                score: user.score,
                rank: getRank(user.score)
            }
        });

    } catch (error) {
        console.error('Error adjusting user score:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
