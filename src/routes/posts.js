const express = require('express');
const router = express.Router();
const data = require('../dataStore');
const { getRank } = require('../utils/rank');
const { authMiddleware } = require('../middleware/authMiddleware');
const commentRoutes = require('./comments');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});
const upload = multer({ storage: storage });


// Mount comment routes - This needs to be defined before routes with similar path patterns
// All comment routes will also need to be protected, which we'll handle in comments.js
router.use('/:postId/comments', commentRoutes);

// GET all posts (publicly accessible)
router.get('/', (req, res) => {
    const postsWithRanks = data.posts.map(post => {
        const author = data.users.find(u => u.id === post.authorId);
        const authorRank = author ? (author.role === 'admin' ? 'Master' : getRank(author.score)) : 'N/A';

        const commentsWithRanks = post.comments.map(comment => {
            const commentAuthor = data.users.find(u => u.id === comment.authorId);
            const commentAuthorRank = commentAuthor ? (commentAuthor.role === 'admin' ? 'Master' : getRank(commentAuthor.score)) : 'N/A';
            return { ...comment, authorRank: commentAuthorRank };
        });

        return { ...post, authorRank: authorRank, comments: commentsWithRanks };
    });

    const sortedPosts = postsWithRanks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedPosts);
});

// POST a new post (protected)
router.post('/', authMiddleware, upload.single('attachment'), (req, res) => {
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
        attachment: req.file ? `/uploads/${req.file.filename}` : null,
        comments: [],
        createdAt: now,
        updatedAt: now,
        likes: 0,
        dislikes: 0,
        votes: {}
    };
    data.posts.push(newPost);

    // Add points for creating a post
    const author = data.users.find(u => u.id === req.user.id);
    if (author) {
        author.score += 10;
        console.log(`User ${author.userId} score increased to ${author.score} for creating a post.`);
    }

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

    // Authorization check: must be the author or an admin
    if (data.posts[postIndex].authorId !== req.user.id && req.user.role !== 'admin') {
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

    // Authorization check: must be the author or an admin
    if (data.posts[postIndex].authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: '삭제할 권한이 없습니다.' });
    }

    data.posts.splice(postIndex, 1);
    res.status(204).send(); // No Content
});

// POST a vote on a post (protected)
router.post('/:id/vote', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { voteType } = req.body; // 'like' or 'dislike'
    const userId = req.user.id;

    const post = data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    // Prevent user from voting on their own post
    if (post.authorId === userId) {
        return res.status(403).json({ message: '자신의 게시물에는 투표할 수 없습니다.' });
    }

    if (voteType !== 'like' && voteType !== 'dislike') {
        return res.status(400).json({ message: '잘못된 투표 유형입니다.' });
    }

    const author = data.users.find(u => u.id === post.authorId);
    if (!author) {
        // This should not happen in a real app with foreign key constraints
        return res.status(500).json({ message: '게시물 작성자를 찾을 수 없습니다.' });
    }

    const existingVote = post.votes[userId];
    let scoreChange = 0;

    if (existingVote === voteType) {
        // Revoking a vote
        delete post.votes[userId];
        if (voteType === 'like') scoreChange = -5;
        if (voteType === 'dislike') scoreChange = 3;
    } else if (existingVote) {
        // Changing a vote
        post.votes[userId] = voteType;
        if (voteType === 'like') scoreChange = 5 + 3; // +5 for new like, +3 for removing dislike
        if (voteType === 'dislike') scoreChange = -3 - 5; // -3 for new dislike, -5 for removing like
    } else {
        // New vote
        post.votes[userId] = voteType;
        if (voteType === 'like') scoreChange = 5;
        if (voteType === 'dislike') scoreChange = -3;
    }

    // Apply score change to the author
    if (author) {
        author.score += scoreChange;
        console.log(`User ${author.userId} score changed by ${scoreChange} to ${author.score} for a vote.`);
    }

    // Recalculate likes and dislikes
    post.likes = Object.values(post.votes).filter(v => v === 'like').length;
    post.dislikes = Object.values(post.votes).filter(v => v === 'dislike').length;

    res.json(post);
});

module.exports = router;
