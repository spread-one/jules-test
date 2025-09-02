const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const data = require('../dataStore');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getRank } = require('../utils/rank');

const JWT_SECRET = 'your_jwt_secret_key'; // In a real app, use an environment variable

// User Registration (Signup)
router.post('/signup', async (req, res) => {
    try {
        const { name, userId, password, isAdmin, adminPasskey } = req.body;

        // Basic validation
        if (!name || !userId || !password) {
            return res.status(400).json({ message: '이름, 아이디, 비밀번호는 필수입니다.' });
        }

        // Check if user already exists
        const existingUser = data.users.find(u => u.userId === userId);
        if (existingUser) {
            return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
        }

        let role = 'user'; // Default role

        // If creating an admin, validate the passkey
        if (isAdmin) {
            const ADMIN_PASSKEY = '12345678'; // In a real app, use an environment variable
            if (adminPasskey !== ADMIN_PASSKEY) {
                return res.status(401).json({ message: '관리자 패스키가 잘못되었습니다.' });
            }
            role = 'admin';
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Create new user
        const newUser = {
            id: data.nextUserId++,
            name,
            userId,
            password: hashedPassword,
            role: role, // Add role to user object
            score: 0, // Initialize score
            createdAt: new Date(),
            isSuspended: false,
        };

        data.users.push(newUser);

        console.log('New user registered:', newUser);
        console.log('All users:', data.users);


        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
        }

        // Find user by userId
        const user = data.users.find(u => u.userId === userId);
        if (!user) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        // Check if user is suspended
        if (user.isSuspended) {
            return res.status(403).json({ message: '이 계정은 정지되었습니다. 관리자에게 문의하세요.' });
        }

        // Special case for the default admin user (ID 1) whose password is not hashed
        if (user.id === 1 && user.password === '1') {
            if (password !== '1') {
                return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
            }
        } else {
            // For all other users, compare the hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
            }
        }

        // Create JWT
        const tokenPayload = {
            id: user.id,
            userId: user.userId,
            name: user.name,
            role: user.role || 'user', // Include role in JWT payload
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, userName: user.name, userId: user.id, role: user.role || 'user' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// GET current user info (protected)
// This route is used by the frontend to verify a token from localStorage
router.get('/me', authMiddleware, (req, res) => {
    // The user payload from the token is in req.user.
    // We should find the latest user info from our data store.
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) {
        // This could happen if the user was deleted after the token was issued.
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // Don't send the password hash
    const { password, ...userWithoutPassword } = user;

    const rank = user.role === 'admin' ? 'Master' : getRank(user.score);

    res.json({
        ...userWithoutPassword,
        rank: rank,
    });
});


module.exports = router;
