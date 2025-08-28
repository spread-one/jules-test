const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory data store
let posts = [
    { id: 1, title: '첫 번째 게시물', content: '이것은 1번째 게시물입니다.' },
    { id: 2, title: '두 번째 게시물', content: '이것은 2번째 게시물입니다.' }
];
let nextId = 3;

// --- API Endpoints ---

// GET all posts
app.get('/api/posts', (req, res) => {
    res.json(posts);
});

// POST a new post
app.post('/api/posts', (req, res) => {
    console.log('Received POST request to /api/posts');
    console.log('Request body:', req.body);
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    const newPost = { id: nextId++, title, content };
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

    posts[postIndex] = { ...posts[postIndex], title, content };
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

// Serve static files from the 'src' directory
app.use(express.static('src'));

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
