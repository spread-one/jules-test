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
    const profileApiBaseUrl = '/api/profile';
    const adminApiUrl = '/api/admin';

    // --- DOM Elements ---
    // Views
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const boardListView = document.getElementById('board-list-view');
    const boardDetailView = document.getElementById('board-detail-view');
    const profileView = document.getElementById('profile-view');
    const adminView = document.getElementById('admin-view');

    // Common Elements
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const adminButton = document.getElementById('admin-button');
    const profileButton = document.getElementById('profile-button');
    const logoDiv = document.querySelector('.logo');

    // Auth Elements
    const loginForm = document.getElementById('login-form');
    const loginUserIdInput = document.getElementById('login-userId');
    const loginPasswordInput = document.getElementById('login-password');

    // Board List Elements
    const boardsList = document.getElementById('boards-list');
    const showCreateBoardFormButton = document.getElementById('show-create-board-form-button');
    const createBoardFormContainer = document.getElementById('create-board-form-container');
    const createBoardForm = document.getElementById('create-board-form');
    const createBoardNameInput = document.getElementById('create-board-name');
    const createBoardDescriptionInput = document.getElementById('create-board-description');
    const cancelCreateBoardButton = document.getElementById('cancel-create-board');

    // Board Detail Elements
    const boardDetailHeader = document.getElementById('board-detail-header');
    const boardTitleHeader = document.getElementById('board-title-header');
    const boardDescriptionDetail = document.getElementById('board-description-detail');
    const editDescBtnContainer = document.getElementById('edit-desc-btn-container');
    const postsList = document.getElementById('posts-list');
    const createFormContainer = document.getElementById('create-form-container');
    const createForm = document.getElementById('create-post-form');
    const createTitleInput = document.getElementById('create-title');
    const createContentInput = document.getElementById('create-content');
    const attachmentInput = document.getElementById('create-attachment');
    const imagePreviewContainer = document.getElementById('image-preview');
    const editFormContainer = document.getElementById('edit-form-container');
    const editForm = document.getElementById('edit-post-form');
    const editIdInput = document.getElementById('edit-post-id');
    const editTitleInput = document.getElementById('edit-title');
    const editContentInput = document.getElementById('edit-content');
    const cancelEditBtn = document.getElementById('cancel-edit');

    // Profile View Elements
    const profileTitle = document.getElementById('profile-title');
    const myPostsList = document.getElementById('my-posts-list');
    const myCommentsList = document.getElementById('my-comments-list');
    const editProfileButton = document.getElementById('edit-profile-button');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeButton = document.querySelector('#profile-view .close-button');
    const editProfileForm = document.getElementById('edit-profile-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newNameInput = document.getElementById('new-name');
    const newPasswordInput = document.getElementById('new-password');

    // Admin View Elements
    const usersTableBody = document.getElementById('users-table-body');

    // --- View Switching ---
    const showAppView = (viewId) => {
        // Hide all main content views
        [boardDetailView, profileView, adminView].forEach(view => {
            if (view) view.style.display = 'none';
        });

        // Show the requested view
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
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
        window.location.href = '/'; // Redirect to home on logout
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
            showAppView(null); // Hide all detail views initially
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

    // --- Profile Logic ---
    const showProfileView = (userId) => {
        showAppView('profile-view');
        fetchProfileData(userId);
    };

    const fetchProfileData = async (userId) => {
        const isMyProfile = !userId || (currentUser && currentUser.id == userId);
        let profileApiUrl;

        if (isMyProfile) {
            if (!currentUser) {
                alert('로그인이 필요합니다.');
                showAppView(null); // Hide profile view if not logged in
                return;
            }
            profileApiUrl = `${profileApiBaseUrl}/me`;
        } else {
            profileApiUrl = `${profileApiBaseUrl}/${userId}`;
        }

        try {
            const response = await fetchWithAuth(profileApiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '프로필 정보를 불러오는 데 실패했습니다.');
            }
            const data = await response.json();
            renderProfileData(data, isMyProfile);
        } catch (error) {
            console.error(error);
            profileTitle.textContent = '프로필을 찾을 수 없습니다.';
            myPostsList.innerHTML = `<li>${error.message}</li>`;
            myCommentsList.innerHTML = '';
            editProfileButton.style.display = 'none';
        }
    };

    const renderProfileData = (data, isMyProfile) => {
        if (isMyProfile) {
            profileTitle.textContent = '내 프로필';
            editProfileButton.style.display = 'block';
        } else {
            const profileName = escapeHTML(data.name || '사용자');
            profileTitle.textContent = `${profileName}의 프로필`;
            editProfileButton.style.display = 'none';
        }

        myPostsList.innerHTML = data.posts.length === 0 ? '<li>작성한 글이 없습니다.</li>' : data.posts.map(post => `
            <li>
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.content)}</p>
                <span class="post-date">작성일: ${formatDate(post.createdAt)}</span>
            </li>
        `).join('');

        myCommentsList.innerHTML = data.comments.length === 0 ? '<li>작성한 댓글이 없습니다.</li>' : data.comments.map(comment => `
            <li>
                <p>${escapeHTML(comment.content)}</p>
                <span class="comment-meta">원문: ${escapeHTML(comment.postTitle)}</span>
                <span class="comment-date">작성일: ${formatDate(comment.createdAt)}</span>
            </li>
        `).join('');
    };

    const handleProfileEdit = async (e) => {
        e.preventDefault();
        const currentPassword = currentPasswordInput.value;
        const newName = newNameInput.value.trim();
        const newPassword = newPasswordInput.value;

        if (!currentPassword) {
            alert('현재 비밀번호를 입력해주세요.');
            return;
        }
        if (!newName && !newPassword) {
            alert('변경할 이름 또는 비밀번호를 입력해주세요.');
            return;
        }

        try {
            const response = await fetchWithAuth(`${profileApiBaseUrl}/me`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newName, newPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || '프로필 수정에 실패했습니다.');

            alert(data.message);
            editProfileModal.style.display = 'none';
            editProfileForm.reset();

            if (data.token) {
                localStorage.setItem('jwt_token', data.token);
                token = data.token;
            }
            // Re-fetch user data and update UI
            const meResponse = await fetchWithAuth(`${authApiUrl}/me`);
            currentUser = await meResponse.json();
            updateUI(); // This will refresh the welcome message
            showProfileView(currentUser.id); // Refresh profile view
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };


    // --- Admin Logic ---
    const showAdminView = async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('접근 권한이 없습니다.');
            showAppView(null);
            return;
        }
        showAppView('admin-view');
        await fetchAndRenderUsers();
    };

    const fetchAndRenderUsers = async () => {
        try {
            const response = await fetchWithAuth(`${adminApiUrl}/users`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '사용자 정보를 불러오는 데 실패했습니다.');
            }
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            usersTableBody.innerHTML = `<tr><td colspan="8">${error.message}</td></tr>`;
        }
    };

    const renderUsers = (users) => {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="8">등록된 사용자가 없습니다.</td></tr>';
            return;
        }
        usersTableBody.innerHTML = users.map(user => {
            const isSuspended = user.isSuspended;
            const suspendButtonText = isSuspended ? '정지 해제' : '계정 정지';
            const buttonActionClass = isSuspended ? 'unsuspend-action' : 'suspend-action';
            const statusText = isSuspended ? '정지됨' : '활성';
            const statusClass = isSuspended ? 'status-suspended' : 'status-active';

            const actionControls = user.role === 'admin' ? '<span>(관리자)</span>' : `
                <div class="action-group">
                    <button class="suspend-toggle-btn ${buttonActionClass}" data-user-id="${user.id}">${suspendButtonText}</button>
                </div>
                <div class="action-group">
                    <input type="number" class="score-input" value="${user.score}" placeholder="점수" style="width: 60px;"/>
                    <button class="adjust-score-btn" data-user-id="${user.id}">점수 조정</button>
                </div>
            `;
            return `
                <tr data-user-id="${user.id}">
                    <td>${escapeHTML(user.name)}</td>
                    <td>${escapeHTML(user.userId)}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td><span class="rank rank-${(user.rank || '').toLowerCase()}">${escapeHTML(user.rank)}</span></td>
                    <td>${user.score}</td>
                    <td>${user.postCount}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>${actionControls}</td>
                </tr>
            `;
        }).join('');
    };

    const handleAdminTableClick = async (e) => {
        const target = e.target;
        const userId = target.dataset.userId;

        if (target.classList.contains('suspend-toggle-btn')) {
            if (!confirm('정말로 이 사용자의 상태를 변경하시겠습니까?')) return;
            try {
                const response = await fetchWithAuth(`${adminApiUrl}/users/${userId}/toggle-suspend`, { method: 'POST' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || '작업에 실패했습니다.');
                alert(result.message);
                fetchAndRenderUsers();
            } catch (error) {
                console.error('Error toggling suspension:', error);
                alert(error.message);
            }
        }

        if (target.classList.contains('adjust-score-btn')) {
            const scoreInput = target.closest('td').querySelector('.score-input');
            const newScore = parseInt(scoreInput.value, 10);
            if (isNaN(newScore)) {
                alert('유효한 점수를 입력하세요.');
                return;
            }
            if (!confirm(`사용자의 점수를 ${newScore}(으)로 변경하시겠습니까?`)) return;
            try {
                const response = await fetchWithAuth(`${adminApiUrl}/users/${userId}/adjust-score`, {
                    method: 'POST',
                    body: JSON.stringify({ score: newScore }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || '점수 조정에 실패했습니다.');
                alert(result.message);
                fetchAndRenderUsers();
            } catch (error) {
                console.error('Error adjusting score:', error);
                alert(error.message);
            }
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

        showAppView('board-detail-view');
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

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    logoDiv.addEventListener('click', () => {
        window.history.pushState({}, '', '/');
        showAppView(null);
    });
    adminButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/?view=admin');
        showAdminView();
    });
    profileButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            window.history.pushState({}, '', `/?userId=${currentUser.id}`);
            showProfileView(currentUser.id);
        } else {
            alert('로그인이 필요합니다.');
        }
    });

    // Board List
    showCreateBoardFormButton.addEventListener('click', () => createBoardFormContainer.style.display = 'block');
    cancelCreateBoardButton.addEventListener('click', () => createBoardFormContainer.style.display = 'none');
    createBoardForm.addEventListener('submit', handleCreateBoard);
    boardsList.addEventListener('click', (e) => {
        const boardLi = e.target.closest('li[data-board-id]');
        if (!boardLi) return;

        document.querySelectorAll('#boards-list li').forEach(li => li.classList.remove('active'));
        boardLi.classList.add('active');

        currentBoardId = parseInt(boardLi.dataset.boardId, 10);
        const board = boardsData.find(b => b.id === currentBoardId);
        if (!board) return;

        boardTitleHeader.textContent = board.name;
        boardDescriptionDetail.textContent = board.description || '';

        editDescBtnContainer.innerHTML = '';
        const isCreator = currentUser && currentUser.id === board.createdBy;
        if (isCreator) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-description-btn';
            editButton.textContent = '설명 수정';
            editDescBtnContainer.appendChild(editButton);
        }

        showAppView('board-detail-view');
        fetchPosts();
    });

    // Board Detail
    boardDetailHeader.addEventListener('click', (e) => {
        const board = boardsData.find(b => b.id === currentBoardId);
        if (!board) return;
        if (e.target.classList.contains('edit-description-btn')) {
            boardDescriptionDetail.innerHTML = `<textarea id="edit-description-input" class="edit-description-input">${escapeHTML(board.description || '')}</textarea>`;
            editDescBtnContainer.innerHTML = `<button class="save-description-btn">저장</button><button class="cancel-edit-description-btn">취소</button>`;
        } else if (e.target.classList.contains('save-description-btn')) {
            const newDescription = document.getElementById('edit-description-input').value;
            handleUpdateDescription(currentBoardId, newDescription);
        } else if (e.target.classList.contains('cancel-edit-description-btn')) {
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
        if (attachmentFile) formData.append('attachment', attachmentFile);
        try {
            const response = await fetchWithAuth(postsApiUrl, { method: 'POST', body: formData });
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
    postsList.addEventListener('click', handlePostAndCommentActions);
    postsList.addEventListener('submit', handleCommentSubmit);
    cancelEditBtn.addEventListener('click', hideEditForm);

    // Profile View
    editProfileButton.addEventListener('click', () => editProfileModal.style.display = 'block');
    closeButton.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
        editProfileForm.reset();
    });
    window.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
            editProfileForm.reset();
        }
    });
    editProfileForm.addEventListener('submit', handleProfileEdit);

    // Admin View
    usersTableBody.addEventListener('click', handleAdminTableClick);


    // --- URL Routing and Initial Load ---
    const handleRouting = () => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const view = params.get('view');

        if (view === 'admin') {
            showAdminView();
        } else if (userId) {
            showProfileView(userId);
        } else {
            // Default view
            showAppView(null);
        }
    };

    const initialLoad = async () => {
        await checkLoginStatus();
        handleRouting();
    };

    initialLoad();
});
