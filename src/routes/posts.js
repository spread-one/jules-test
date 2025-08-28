const express = require('express');
const router = express.Router();
const data = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');
const commentRoutes = require('./comments');

// Mount comment routes - This needs to be defined before routes with similar path patterns
// All comment routes will also need to be protected, which we'll handle in comments.js
router.use('/:postId/comments', commentRoutes);

// GET all posts (publicly accessible)
router.get('/', (req, res) => {
    const sortedPosts = data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedPosts);
});

// POST a new post (protected)
router.post('/', authMiddleware, (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    const now = new Date();
    const newPost = {
        id: data.nextId++,
        authorId: req.user.id,
        authorName: req.user.name,
        title,
        content,
        comments: [],
        createdAt: now,
        updatedAt: now
    };
    data.posts.push(newPost);
    res.status(201).json(newPost);
});

// PUT (update) a post (protected)
router.put('/:id', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    const postIndex = data.posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    // Authorization check
    if (data.posts[postIndex].authorId !== req.user.id) {
        return res.status(403).json({ message: '수정할 권한이 없습니다.' });
    }

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    data.posts[postIndex] = {
        ...data.posts[postIndex],
        title,
        content,
        updatedAt: new Date()
    };
    res.json(data.posts[postIndex]);
});

// DELETE a post (protected)
router.delete('/:id', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const postIndex = data.posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    // Authorization check
    if (data.posts[postIndex].authorId !== req.user.id) {
        return res.status(403).json({ message: '삭제할 권한이 없습니다.' });
    }

    data.posts.splice(postIndex, 1);
    res.status(204).send(); // No Content
});

module.exports = router;
