const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile');

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'html', 'index.html'));
});


app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
