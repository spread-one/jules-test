const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const { chatRooms, users } = require('./dataStore');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin'); // Import admin routes
const boardRoutes = require('./routes/boards');
const chatRoutes = require('./routes/chat');
const chatApiRoutes = require('./routes/chatApi');

// Middleware to parse JSON bodies
app.use(express.json());

// Page/App Routes
app.use('/chat', chatRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes); // Use admin routes
app.use('/api/boards', boardRoutes);
app.use('/api/chat', chatApiRoutes);


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'html', 'index.html'));
});

// Serve create-post.html for the /create-post route
app.get('/create-post', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'html', 'create-post.html'));
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: Token not provided'));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }
        socket.user = user;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('a user connected:', socket.user.name);

    socket.on('joinRoom', ({ chatRoomId }) => {
        const room = chatRooms.find(r => r.id == chatRoomId);
        if (room && room.participants.some(p => p.userId === socket.user.id)) {
            socket.join(chatRoomId);
            console.log(`User ${socket.user.name} joined room: ${chatRoomId}`);

            // Update lastRead timestamp
            const participant = room.participants.find(p => p.userId === socket.user.id);
            participant.lastRead = new Date();
        } else {
            console.log(`User ${socket.user.name} tried to join unauthorized room: ${chatRoomId}`);
        }
    });

    socket.on('chatMessage', ({ chatRoomId, text }) => {
        console.log(`[DEBUG] chatMessage received from user ${socket.user.name} for room ${chatRoomId}`);
        const room = chatRooms.find(r => r.id == chatRoomId);
        if (!room || !room.participants.some(p => p.userId === socket.user.id)) {
            console.log(`[DEBUG] Message from unauthorized user ignored. User: ${socket.user.name}, Room: ${chatRoomId}`);
            return;
        }

        const message = {
            text,
            user: { id: socket.user.id, name: socket.user.name },
            timestamp: new Date(),
        };

        room.messages.push(message);

        // Explicitly broadcast to each socket in the room with the correct `isMine` flag
        io.in(chatRoomId).allSockets().then(sockets => {
            console.log(`[DEBUG] Broadcasting message to sockets in room ${chatRoomId}:`, sockets);
            sockets.forEach(socketId => {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (targetSocket) {
                    const isMine = targetSocket.id === socket.id;
                    targetSocket.emit('message', { ...message, isMine });
                }
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.user.name);
    });
});


server.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
