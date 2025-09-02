const express = require('express');
const router = express.Router();
let { boards, nextBoardId, users } = require('../dataStore');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET all boards
router.get('/', (req, res) => {
    res.json(boards);
});

// POST a new board
router.post('/', authMiddleware, (req, res) => {
    const { name, description } = req.body;
    const user = users.find(u => u.id === req.user.id);

    if (!name) {
        return res.status(400).json({ message: '게시판 이름을 입력해주세요.' });
    }

    const newBoard = {
        id: nextBoardId++,
        name,
        description: description || '',
        createdBy: user.id
    };

    boards.push(newBoard);
    res.status(201).json(newBoard);
});

// PUT to update board description
router.put('/:id/description', authMiddleware, (req, res) => {
    const boardId = parseInt(req.params.id, 10);
    const { description } = req.body;
    const user = users.find(u => u.id === req.user.id);

    const board = boards.find(b => b.id === boardId);

    if (!board) {
        return res.status(404).json({ message: '게시판을 찾을 수 없습니다.' });
    }

    if (board.createdBy !== user.id) {
        return res.status(403).json({ message: '게시판 설명을 수정할 권한이 없습니다.' });
    }

    board.description = description;
    res.json(board);
});

module.exports = router;
