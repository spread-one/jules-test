const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // Should be the same as in auth.js

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '인증이 필요합니다. Bearer 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user payload to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '토큰이 만료되었습니다.' });
        }
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = authMiddleware;
