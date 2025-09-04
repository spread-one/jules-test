const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { chatRooms, users } = require('../dataStore');
let { nextChatRoomId } = require('../dataStore');

/**
 * @route   POST /api/chat/start
 * @desc    Start a new chat or get an existing one
 * @access  Private
 */
router.post('/start', authMiddleware, (req, res) => {
    const { userId: otherUserId } = req.body;
    const currentUserId = req.user.id;

    if (!otherUserId) {
        return res.status(400).json({ message: '상대방의 ID가 필요합니다.' });
    }

    if (parseInt(otherUserId, 10) === currentUserId) {
        return res.status(400).json({ message: '자기 자신과는 채팅할 수 없습니다.' });
    }

    // Find if a chat room already exists between the two users
    let existingRoom = chatRooms.find(room => {
        const participantIds = room.participants.map(p => p.userId);
        return participantIds.includes(currentUserId) && participantIds.includes(parseInt(otherUserId, 10));
    });

    if (existingRoom) {
        return res.json({ chatRoomId: existingRoom.id });
    }

    // Create a new chat room if one doesn't exist
    const creationTime = new Date();
    const newRoom = {
        id: nextChatRoomId++,
        participants: [
            { userId: currentUserId, lastRead: creationTime },
            { userId: parseInt(otherUserId, 10), lastRead: creationTime }
        ],
        messages: [],
        createdAt: creationTime,
    };
    chatRooms.push(newRoom);

    res.status(201).json({ chatRoomId: newRoom.id });
});

/**
 * @route   GET /api/chat/unread-count
 * @desc    Get the total number of unread messages for the current user
 * @access  Private
 */
router.get('/unread-count', authMiddleware, (req, res) => {
    const currentUserId = req.user.id;
    let totalUnreadCount = 0;

    const userChatRooms = chatRooms.filter(room =>
        room.participants.some(p => p.userId === currentUserId)
    );

    userChatRooms.forEach(room => {
        const participant = room.participants.find(p => p.userId === currentUserId);
        if (!participant) return;

        const lastReadTime = new Date(participant.lastRead);
        const unreadMessages = room.messages.filter(msg => {
            return new Date(msg.timestamp) > lastReadTime && msg.user.id !== currentUserId;
        });
        totalUnreadCount += unreadMessages.length;
    });

    res.json({ unreadCount: totalUnreadCount });
});

/**
 * @route   GET /api/chat/rooms
 * @desc    Get all chat rooms for the current user
 * @access  Private
 */
router.get('/rooms', authMiddleware, (req, res) => {
    const currentUserId = req.user.id;

    const userChatRooms = chatRooms.filter(room =>
        room.participants.some(p => p.userId === currentUserId)
    );

    const roomsWithDetails = userChatRooms.map(room => {
        const otherParticipant = room.participants.find(p => p.userId !== currentUserId);
        const otherUser = users.find(u => u.id === otherParticipant.userId);
        const lastMessage = room.messages[room.messages.length - 1];

        return {
            id: room.id,
            otherUser: {
                id: otherUser.id,
                name: otherUser.name,
            },
            lastMessage: lastMessage || null
        };
    });

    res.json(roomsWithDetails);
});


module.exports = router;
