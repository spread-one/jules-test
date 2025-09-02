// In-memory data store
let posts = [];
let users = [
    { id: 1, userId: '1', password: '1', name: '관리자', rank: 'Gold' }
];
let boards = [
    { id: 1, name: '레스터 시티 게시판', createdBy: 1, description: '레스터 시티 팬들을 위한 공간' },
    { id: 2, name: '수원 삼성 게시판', createdBy: 1, description: '수원 삼성 팬들을 위한 공간' },
    { id: 3, name: '윌리엄스 레이싱 게시판', createdBy: 1, description: '윌리엄스 F1 팀 팬들을 위한 공간' }
];
let nextId = 1;
let nextCommentId = 1;
let nextUserId = 2; // 관리자 계정이 있으므로 2부터 시작
let nextBoardId = 4; // 기본 게시판 3개가 있으므로 4부터 시작

module.exports = {
    posts,
    users,
    boards,
    nextId,
    nextCommentId,
    nextUserId,
    nextBoardId
};
