const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const data = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = 'your_jwt_secret_key'; // In a real app, use an environment variable

// User Registration (Signup)
router.post('/signup', async (req, res) => {
    try {
        const { name, userId, password } = req.body;

        // Basic validation
        if (!name || !userId || !password) {
            return res.status(400).json({ message: '이름, 아이디, 비밀번호는 필수입니다.' });
        }

        // Check if user already exists
        const existingUser = data.users.find(u => u.userId === userId);
        if (existingUser) {
            return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Create new user
        const newUser = {
            id: data.nextUserId++,
            name,
            userId,
            password: hashedPassword,
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

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        // Create JWT
        const tokenPayload = {
            id: user.id,
            userId: user.userId,
            name: user.name
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, userName: user.name, userId: user.id });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// GET current user info (protected)
// This route is used by the frontend to verify a token from localStorage
router.get('/me', authMiddleware, (req, res) => {
    // If the middleware passes, the user is authenticated.
    // The user payload is in req.user.
    res.json(req.user);
});


module.exports = router;
