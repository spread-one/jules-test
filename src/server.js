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


// Serve static files from the 'src' directory
// This allows <link href="css/style.css"> in index.html to work correctly
app.use(express.static(path.join(__dirname, '..', 'src')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'src', 'index.html'));
});


app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
