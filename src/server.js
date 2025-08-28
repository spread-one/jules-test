require('dotenv').config(); // Load environment variables from .env file

// --- Environment Variable Check ---
// Ensure that the JWT_SECRET is defined, otherwise the app will not work correctly.
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in the .env file.');
    process.exit(1); // Exit the process with an error code
}

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);


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
