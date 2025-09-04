const jwt = require('jsonwebtoken');
const { users } = require('../dataStore');
const JWT_SECRET = 'your_jwt_secret_key'; // Should be the same as in auth.js

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '인증이 필요합니다. Bearer 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the user in the dataStore to ensure they still exist
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(401).json({ message: '인증 실패: 사용자를 찾을 수 없습니다.' });
        }

        req.user = user; // Attach the actual, live user object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '토큰이 만료되었습니다.' });
        }
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

const adminOnly = (req, res, next) => {
    // This middleware should be used AFTER authMiddleware,
    // so req.user will be populated.
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: '접근 권한이 없습니다. 관리자만 접근할 수 있습니다.' });
    }
};

module.exports = {
    authMiddleware,
    adminOnly,
};
