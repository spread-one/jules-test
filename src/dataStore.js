// In-memory data store
let posts = [
    {
        id: 1,
        authorId: 0, // Placeholder for system-generated post
        authorName: 'System',
        title: '첫 번째 게시물',
        content: '이것은 1번째 게시물입니다.',
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [
            {
                id: 1,
                postId: 1,
                authorId: 0,
                authorName: 'System',
                content: '첫 번째 댓글입니다.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]
    },
    {
        id: 2,
        authorId: 0,
        authorName: 'System',
        title: '두 번째 게시물',
        content: '이것은 2번째 게시물입니다.',
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: []
    }
];
let users = [];
let nextId = 3;
let nextCommentId = 2;
let nextUserId = 1;

module.exports = {
    posts,
    users,
    nextId,
    nextCommentId,
    nextUserId
};
