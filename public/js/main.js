document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let token = null;
    let currentUser = null;
    let currentBoardId = 1; // Default to the first board
    let boardsData = []; // Cache for board data

    // --- API URLs ---
    const postsApiUrl = '/api/posts';
    const authApiUrl = '/api/auth';
    const boardsApiUrl = '/api/boards';

    // --- DOM Elements ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginUserIdInput = document.getElementById('login-userId');
    const loginPasswordInput = document.getElementById('login-password');
    const userInfo = document.getElementById('user-info');
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const adminButton = document.getElementById('admin-button');
    const boardsList = document.getElementById('boards-list');
    const showCreateBoardFormButton = document.getElementById('show-create-board-form-button');
    const createBoardFormContainer = document.getElementById('create-board-form-container');
    const createBoardForm = document.getElementById('create-board-form');
    const createBoardNameInput = document.getElementById('create-board-name');
    const createBoardDescriptionInput = document.getElementById('create-board-description');
    const cancelCreateBoardButton = document.getElementById('cancel-create-board');
    const postsList = document.getElementById('posts-list');
    const createForm = document.getElementById('create-post-form');
    const createTitleInput = document.getElementById('create-title');
    const createContentInput = document.getElementById('create-content');
    const attachmentInput = document.getElementById('create-attachment');
    const imagePreviewContainer = document.getElementById('image-preview');
    const editFormContainer = document.getElementById('edit-form-container');
    const createFormContainer = document.getElementById('create-form-container');
    const editForm = document.getElementById('edit-post-form');
    const editIdInput = document.getElementById('edit-post-id');
    const editTitleInput = document.getElementById('edit-title');
    const editContentInput = document.getElementById('edit-content');
    const cancelEditBtn = document.getElementById('cancel-edit');

    const boardListView = document.getElementById('board-list-view');
    const boardDetailView = document.getElementById('board-detail-view');
    const boardDetailHeader = document.getElementById('board-detail-header');
    const boardTitleHeader = document.getElementById('board-title-header');
    const boardDescriptionDetail = document.getElementById('board-description-detail');
    const editDescBtnContainer = document.getElementById('edit-desc-btn-container');
    const logoDiv = document.querySelector('.logo');

    // --- View Switching ---
    const switchView = (viewName) => {
        if (viewName === 'board-detail') {
            boardDetailView.style.display = 'block';
        } else {
            boardDetailView.style.display = 'none';
        }
    };

    // --- Auth Functions ---
    const handleLogin = async (e) => {
        e.preventDefault();
        const userId = loginUserIdInput.value.trim();
        const password = loginPasswordInput.value.trim();
        if (!userId || !password) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }
        try {
            const response = await fetch(`${authApiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || '로그인에 실패했습니다.');
            token = data.token;
            localStorage.setItem('jwt_token', token);
            await checkLoginStatus();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleLogout = () => {
        token = null;
        currentUser = null;
        localStorage.removeItem('jwt_token');
        updateUI();
    };

    const checkLoginStatus = async () => {
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken) {
            updateUI();
            return;
        }
        token = storedToken;
        try {
             const response = await fetchWithAuth(`${authApiUrl}/me`);
             if (!response.ok) {
                handleLogout();
                return;
             }
             currentUser = await response.json();
             updateUI();
        } catch (error) {
            console.error('Session check failed:', error);
            handleLogout();
        }
    };

    // --- UI Update ---
    const getRankIcon = (rank) => {
        switch (rank) {
            case 'admin': return '🛡️';
            case 'Rookie': return '🔰';
            case 'Beginner': return '🌱';
            case 'Intermediate': return '🌿';
            case 'Expert': return '🌳';
            case 'Master': return '👑';
            default: return '';
        }
    };

    const updateUI = () => {
        if (token && currentUser) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            const rankIcon = getRankIcon(currentUser.rank);
            let welcomeHTML = `${rankIcon} ${escapeHTML(currentUser.name)}님, 환영합니다!`;
            if (currentUser.role === 'admin') {
                adminButton.style.display = 'inline-block';
            } else {
                adminButton.style.display = 'none';
            }
            userWelcomeMessage.innerHTML = welcomeHTML;
            boardListView.style.display = 'block'; // Show sidebar
            switchView('none'); // Hide detail view initially
            fetchBoards();
        } else {
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
            adminButton.style.display = 'none';
        }
    };

    // --- API Helper ---
    const fetchWithAuth = (url, options = {}) => {
        const headers = { ...options.headers };
        if (!options.body || !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers });
    };

    // --- Board Logic ---
    const fetchBoards = async () => {
        try {
            const response = await fetchWithAuth(boardsApiUrl);
            if (!response.ok) throw new Error('게시판 목록을 불러오는 데 실패했습니다.');
            boardsData = await response.json();
            renderBoards(boardsData);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const renderBoards = (boards) => {
        boardsList.innerHTML = '';
        boards.forEach(board => {
            const li = document.createElement('li');
            li.dataset.boardId = board.id;

            // The 'active' class will be managed on click now, not on render.
            // This simplifies logic as we are not showing posts at the same time.
            li.innerHTML = `<span class="board-name">${escapeHTML(board.name)}</span>`;
            boardsList.appendChild(li);
        });
    };

    const handleUpdateDescription = async (boardId, newDescription) => {
        try {
            const response = await fetchWithAuth(`${boardsApiUrl}/${boardId}/description`, {
                method: 'PUT',
                body: JSON.stringify({ description: newDescription }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '설명 수정에 실패했습니다.');
            }
            await fetchBoards();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        const name = createBoardNameInput.value.trim();
        const description = createBoardDescriptionInput.value.trim();
        if (!name) {
            alert('게시판 이름을 입력해주세요.');
            return;
        }
        try {
            const response = await fetchWithAuth(boardsApiUrl, {
                method: 'POST',
                body: JSON.stringify({ name, description }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '게시판 생성에 실패했습니다.');
            }
            createBoardNameInput.value = '';
            createBoardDescriptionInput.value = '';
            createBoardFormContainer.style.display = 'none';
            await fetchBoards();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    // --- Core App Logic (Posts & Comments) ---
    const fetchPosts = async () => {
        try {
            const response = await fetchWithAuth(`${postsApiUrl}?boardId=${currentBoardId}`);
            if (!response.ok) throw new Error('게시물을 불러오는 데 실패했습니다.');
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const renderPosts = (posts) => {
        postsList.innerHTML = '';
        if (posts.length === 0) {
            postsList.innerHTML = '<li>이 게시판에는 게시물이 없습니다.</li>';
            return;
        }
        posts.forEach(post => {
            const li = document.createElement('li');
            li.setAttribute('data-id', post.id);
            li.setAttribute('data-author-id', post.authorId);

            const postDate = new Date(post.createdAt);
            const postDateString = formatDate(postDate);
            const postUpdated = post.createdAt !== post.updatedAt;
            const postUpdatedDateString = postUpdated ? `(수정됨: ${formatDate(new Date(post.updatedAt))})` : '';

            // --- Comments HTML ---
            const commentsHtml = `
                <div class="comments-section">
                    <h4>댓글 (${post.comments.length})</h4>
                    <ul class="comments-list">
                        ${post.comments.map(comment => {
                            const commentDate = new Date(comment.createdAt);
                            const commentDateString = formatDate(commentDate);
                            const commentUpdated = comment.createdAt !== comment.updatedAt;
                            const commentUpdatedString = commentUpdated ? `(수정됨: ${formatDate(new Date(comment.updatedAt))})` : '';

                            const canModifyComment = currentUser && (currentUser.id === comment.authorId || currentUser.role === 'admin');
                            const commentActions = canModifyComment ? `
                                <div class="comment-actions">
                                    <button class="comment-edit-btn">수정</button>
                                    <button class="comment-delete-btn">삭제</button>
                                </div>` : '';

                            const userVoteComment = comment.votes && currentUser ? comment.votes[currentUser.id] : undefined;
                            const commentLikeClass = userVoteComment === 'like' ? 'active' : '';
                            const commentDislikeClass = userVoteComment === 'dislike' ? 'active' : '';
                            const isOwnComment = currentUser && currentUser.id === comment.authorId;
                            const commentVoteDisabled = isOwnComment ? 'disabled' : '';

                            const commentVoteButtons = `
                                <div class="vote-buttons">
                                    <button class="like-btn ${commentLikeClass}" data-votetype="like" data-target="comment" data-comment-id="${comment.id}" ${commentVoteDisabled}>👍</button>
                                    <span class="like-count">${comment.likes || 0}</span>
                                    <button class="dislike-btn ${commentDislikeClass}" data-votetype="dislike" data-target="comment" data-comment-id="${comment.id}" ${commentVoteDisabled}>👎</button>
                                    <span class="dislike-count">${comment.dislikes || 0}</span>
                                </div>`;

                            const commentAuthorRankIcon = getRankIcon(comment.authorRank);

                            return `
                                <li data-comment-id="${comment.id}" data-comment-author-id="${comment.authorId}">
                                    <div class="comment-view">
                                        <div class="comment-content">
                                            <span class="comment-author"><a href="/html/profile.html?userId=${comment.authorId}">${commentAuthorRankIcon} ${escapeHTML(comment.authorName || '익명')}</a></span>
                                            <span>${escapeHTML(comment.content)}</span>
                                            <div class="comment-meta">
                                                <span class="comment-date">${commentDateString} ${commentUpdatedString}</span>
                                            </div>
                                        </div>
                                        <div class="comment-feedback">
                                            ${commentVoteButtons}
                                            ${commentActions}
                                        </div>
                                    </div>
                                    <div class="comment-edit-form" style="display: none;">
                                        <input type="text" class="edit-comment-input" value="${escapeHTML(comment.content)}">
                                        <div class="comment-actions">
                                            <button class="comment-save-btn">저장</button>
                                            <button class="comment-cancel-btn">취소</button>
                                        </div>
                                    </div>
                                </li>`;
                        }).join('')}
                    </ul>
                    <form class="comment-form">
                        <input type="text" class="comment-input" placeholder="댓글을 입력하세요..." required>
                        <button type="submit">등록</button>
                    </form>
                </div>`;

            // --- Post HTML ---
            const canModifyPost = currentUser && (currentUser.id === post.authorId || currentUser.role === 'admin');
            const postActions = canModifyPost ? `
                <div class="post-actions">
                    <button class="edit-btn">수정</button>
                    <button class="delete-btn">삭제</button>
                </div>` : '';

            const userVotePost = post.votes && currentUser ? post.votes[currentUser.id] : undefined;
            const postLikeClass = userVotePost === 'like' ? 'active' : '';
            const postDislikeClass = userVotePost === 'dislike' ? 'active' : '';
            const isOwnPost = currentUser && currentUser.id === post.authorId;
            const postVoteDisabled = isOwnPost ? 'disabled' : '';

            const postVoteButtons = `
                <div class="vote-buttons">
                     <button class="like-btn ${postLikeClass}" data-votetype="like" data-target="post" ${postVoteDisabled}>👍</button>
                     <span class="like-count">${post.likes || 0}</span>
                     <button class="dislike-btn ${postDislikeClass}" data-votetype="dislike" data-target="post" ${postVoteDisabled}>👎</button>
                     <span class="dislike-count">${post.dislikes || 0}</span>
                </div>`;

            let attachmentHtml = '';
            if (post.attachment) {
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(post.attachment);
                if (isImage) {
                    attachmentHtml = `<div class="post-attachment"><img src="${post.attachment}" alt="Attachment" style="max-width: 100%; height: auto;"></div>`;
                } else {
                    attachmentHtml = `<div class="post-attachment"><a href="${post.attachment}" target="_blank" download>첨부파일 다운로드</a></div>`;
                }
            }

            const postAuthorRankIcon = getRankIcon(post.authorRank);

            li.innerHTML = `
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.content)}</p>
                ${attachmentHtml}
                <div class="post-meta">
                    <span class="post-author">작성자: <a href="/html/profile.html?userId=${post.authorId}">${postAuthorRankIcon} ${escapeHTML(post.authorName || '익명')}</a></span>
                    <span class="post-date">작성일: ${postDateString} ${postUpdatedDateString}</span>
                </div>
                <div class="post-feedback">
                    ${postVoteButtons}
                    ${postActions}
                </div>
                ${commentsHtml}
            `;
            postsList.appendChild(li);
        });
    };

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    showCreateBoardFormButton.addEventListener('click', () => createBoardFormContainer.style.display = 'block');
    cancelCreateBoardButton.addEventListener('click', () => createBoardFormContainer.style.display = 'none');
    createBoardForm.addEventListener('submit', handleCreateBoard);

    boardsList.addEventListener('click', (e) => {
        const boardLi = e.target.closest('li[data-board-id]');
        if (!boardLi) return;

        // Set active class on board list
        document.querySelectorAll('#boards-list li').forEach(li => li.classList.remove('active'));
        boardLi.classList.add('active');

        currentBoardId = parseInt(boardLi.dataset.boardId, 10);
        const board = boardsData.find(b => b.id === currentBoardId);
        if (!board) return;

        // Populate header
        boardTitleHeader.textContent = board.name;
        boardDescriptionDetail.textContent = board.description || '';

        // Handle edit button
        editDescBtnContainer.innerHTML = ''; // Clear previous button
        const isCreator = currentUser && currentUser.id === board.createdBy;
        if (isCreator) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-description-btn';
            editButton.textContent = '설명 수정';
            editDescBtnContainer.appendChild(editButton);
        }

        switchView('board-detail');
        fetchPosts();
    });

    boardDetailHeader.addEventListener('click', (e) => {
        const board = boardsData.find(b => b.id === currentBoardId);
        if (!board) return;

        if (e.target.classList.contains('edit-description-btn')) {
            // Show edit UI
            boardDescriptionDetail.innerHTML = `
                <textarea id="edit-description-input" class="edit-description-input">${escapeHTML(board.description || '')}</textarea>
            `;
            editDescBtnContainer.innerHTML = `
                <button class="save-description-btn">저장</button>
                <button class="cancel-edit-description-btn">취소</button>
            `;
        } else if (e.target.classList.contains('save-description-btn')) {
            const newDescription = document.getElementById('edit-description-input').value;
            handleUpdateDescription(currentBoardId, newDescription);
        } else if (e.target.classList.contains('cancel-edit-description-btn')) {
            // Just re-populate the header to cancel
            boardDescriptionDetail.textContent = board.description || '';
            editDescBtnContainer.innerHTML = '';
            const editButton = document.createElement('button');
            editButton.className = 'edit-description-btn';
            editButton.textContent = '설명 수정';
            editDescBtnContainer.appendChild(editButton);
        }
    });

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = createTitleInput.value.trim();
        const content = createContentInput.value.trim();
        const attachmentFile = attachmentInput.files[0];

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('boardId', currentBoardId);
        if (attachmentFile) {
            formData.append('attachment', attachmentFile);
        }

        try {
            const response = await fetchWithAuth(postsApiUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '게시물 생성에 실패했습니다.');
            }
            createTitleInput.value = '';
            createContentInput.value = '';
            attachmentInput.value = '';
            imagePreviewContainer.innerHTML = '';
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    postsList.addEventListener('click', async (e) => {
        const target = e.target;
        const postLi = target.closest('li[data-id]');
        if (!postLi) return;
        const postId = postLi.dataset.id;

        if (target.classList.contains('delete-btn')) {
            if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
            try {
                const response = await fetchWithAuth(`${postsApiUrl}/${postId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '게시물 삭제에 실패했습니다.');
                }
                fetchPosts();
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        }
        else if (target.classList.contains('edit-btn')) {
            const title = postLi.querySelector('h3').textContent;
            const content = postLi.querySelector('p').textContent;
            showEditForm(postId, title, content);
        }
        else if (target.classList.contains('comment-delete-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const commentId = commentLi.dataset.commentId;
            if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
            try {
                const response = await fetchWithAuth(`${postsApiUrl}/${postId}/comments/${commentId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '댓글 삭제에 실패했습니다.');
                }
                fetchPosts();
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        }
        else if (target.classList.contains('comment-edit-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const viewDiv = commentLi.querySelector('.comment-view');
            const editFormEl = commentLi.querySelector('.comment-edit-form');
            viewDiv.style.display = 'none';
            editFormEl.style.display = 'flex';
        }
        else if (target.classList.contains('comment-cancel-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const viewDiv = commentLi.querySelector('.comment-view');
            const editFormEl = commentLi.querySelector('.comment-edit-form');
            viewDiv.style.display = 'flex';
            editFormEl.style.display = 'none';
        }
        else if (target.classList.contains('comment-save-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const commentId = commentLi.dataset.commentId;
            const newContent = commentLi.querySelector('.edit-comment-input').value.trim();
            if (!newContent) {
                alert('댓글 내용이 비어있습니다.');
                return;
            }
            try {
                const response = await fetchWithAuth(`${postsApiUrl}/${postId}/comments/${commentId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ content: newContent }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '댓글 수정에 실패했습니다.');
                }
                fetchPosts();
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        }
        else if (target.classList.contains('like-btn') || target.classList.contains('dislike-btn')) {
            if (!currentUser) { alert('로그인이 필요합니다.'); return; }
            const voteType = target.dataset.votetype;
            const targetType = target.dataset.target;
            let url;

            if (targetType === 'post') {
                url = `${postsApiUrl}/${postId}/vote`;
            } else if (targetType === 'comment') {
                const commentId = target.dataset.commentId;
                url = `${postsApiUrl}/${postId}/comments/${commentId}/vote`;
            } else {
                return;
            }

            try {
                const response = await fetchWithAuth(url, {
                    method: 'POST',
                    body: JSON.stringify({ voteType }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '투표 처리에 실패했습니다.');
                }
                fetchPosts();
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        }
    });

    postsList.addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = e.target;
        if (!target.classList.contains('comment-form')) return;

        const li = target.closest('li[data-id]');
        if (!li) return;
        const postId = li.dataset.id;
        const commentInput = target.querySelector('.comment-input');
        const content = commentInput.value.trim();

        if (!content) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            const response = await fetchWithAuth(`${postsApiUrl}/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '댓글 작성에 실패했습니다.');
            }
            commentInput.value = '';
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    attachmentInput.addEventListener('change', () => {
        const file = attachmentInput.files[0];
        imagePreviewContainer.innerHTML = '';

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreviewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Helper Functions ---
    const showEditForm = (id, title, content) => {
        editIdInput.value = id;
        editTitleInput.value = title;
        editContentInput.value = content;
        createFormContainer.style.display = 'none';
        editFormContainer.style.display = 'block';
    };

    const hideEditForm = () => {
        editFormContainer.style.display = 'none';
        createFormContainer.style.display = 'block';
    };

    cancelEditBtn.addEventListener('click', hideEditForm);

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function formatDate(date) {
        return new Date(date).toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        });
    }

    // --- Initial Load ---
    checkLoginStatus();

    logoDiv.addEventListener('click', () => {
        window.location.href = '/';
    });
});
