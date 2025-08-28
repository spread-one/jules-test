const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory data store
let posts = [
    {
        id: 1,
        title: '첫 번째 게시물',
        content: '이것은 1번째 게시물입니다.',
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [
            {id: 1, content: '첫 번째 댓글입니다.', createdAt: new Date(), updatedAt: new Date()}
        ]
    },
    {
        id: 2,
        title: '두 번째 게시물',
        content: '이것은 2번째 게시물입니다.',
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: []
    }
];
let nextId = 3;
let nextCommentId = 2;

// --- API Endpoints ---

// GET all posts
app.get('/api/posts', (req, res) => {
    // Sort posts by creation date, newest first
    const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt);
    res.json(sortedPosts);
});

// POST a new post
app.post('/api/posts', (req, res) => {
    console.log('Received POST request to /api/posts');
    console.log('Request body:', req.body);
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    const now = new Date();
    const newPost = {
        id: nextId++,
        title,
        content,
        comments: [],
        createdAt: now,
        updatedAt: now
    };
    posts.push(newPost);
    res.status(201).json(newPost);
});

// PUT (update) a post
app.put('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }

    posts[postIndex] = {
        ...posts[postIndex],
        title,
        content,
        updatedAt: new Date()
    };
    res.json(posts[postIndex]);
});

// DELETE a post
app.delete('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    posts.splice(postIndex, 1);
    res.status(204).send(); // No Content
});

// POST a new comment to a post
app.post('/api/posts/:postId/comments', (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    if (!content) {
        return res.status(400).json({ message: '댓글 내용은 필수입니다.' });
    }

    const now = new Date();
    const newComment = {
        id: nextCommentId++,
        content,
        createdAt: now,
        updatedAt: now
    };
    post.comments.push(newComment);
    // Sort comments by creation date, oldest first
    post.comments.sort((a, b) => a.createdAt - b.createdAt);
    res.status(201).json(newComment);
});

// DELETE a comment from a post
app.delete('/api/posts/:postId/comments/:commentId', (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    const commentIndex = post.comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    post.comments.splice(commentIndex, 1);
    res.status(204).send(); // No Content
});

// PUT (update) a comment
app.put('/api/posts/:postId/comments/:commentId', (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { content } = req.body;
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }

    const comment = post.comments.find(c => c.id === commentId);

    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (!content) {
        return res.status(400).json({ message: '댓글 내용은 필수입니다.' });
    }

    comment.content = content;
    comment.updatedAt = new Date();
    res.json(comment);
});

// Serve static files from the 'src' directory
app.use(express.static('src'));

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
