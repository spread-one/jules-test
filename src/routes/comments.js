const express = require('express');
const router = express.Router({ mergeParams: true });
const data = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

// Note: All routes in this file are implicitly protected because the
// parent router in posts.js can have middleware. However, for clarity
// and security, we apply it here to each route individually.

// POST a new comment to a post (protected)
router.post('/', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;
    const post = data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    if (!content) {
        return res.status(400).json({ message: '댓글 내용은 필수입니다.' });
    }

    const now = new Date();
    const newComment = {
        id: data.nextCommentId++,
        postId: postId,
        authorId: req.user.id,
        authorName: req.user.name,
        content,
        createdAt: now,
        updatedAt: now,
        likes: 0,
        dislikes: 0,
        votes: {}
    };
    post.comments.push(newComment);
    post.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.status(201).json(newComment);
});

// PUT (update) a comment (protected)
router.put('/:commentId', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { content } = req.body;
    const post = data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    const comment = post.comments.find(c => c.id === commentId);

    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    // Authorization check: must be the author or an admin
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: '수정할 권한이 없습니다.' });
    }

    if (!content) {
        return res.status(400).json({ message: '댓글 내용은 필수입니다.' });
    }

    comment.content = content;
    comment.updatedAt = new Date();
    res.json(comment);
});

// DELETE a comment from a post (protected)
router.delete('/:commentId', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const post = data.posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    const commentIndex = post.comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    const comment = post.comments[commentIndex];

    // Authorization check: must be the author or an admin
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: '삭제할 권한이 없습니다.' });
    }

    post.comments.splice(commentIndex, 1);
    res.status(204).send(); // No Content
});

// POST a vote on a comment (protected)
router.post('/:commentId/vote', authMiddleware, (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { voteType } = req.body; // 'like' or 'dislike'
    const userId = req.user.id;

    const post = data.posts.find(p => p.id === postId);
    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (voteType !== 'like' && voteType !== 'dislike') {
        return res.status(400).json({ message: '잘못된 투표 유형입니다.' });
    }

    const existingVote = comment.votes[userId];

    if (existingVote === voteType) {
        // User is revoking their vote
        delete comment.votes[userId];
    } else {
        // New vote or changing vote
        comment.votes[userId] = voteType;
    }

    // Recalculate likes and dislikes
    comment.likes = Object.values(comment.votes).filter(v => v === 'like').length;
    comment.dislikes = Object.values(comment.votes).filter(v => v === 'dislike').length;

    res.json(comment);
});


module.exports = router;
