document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentUser = null;
    let currentBoardId = 1;
    let boardsData = [];

    // --- API URLs ---
    const postsApiUrl = '/api/posts';
    const authApiUrl = '/api/auth';
    const boardsApiUrl = '/api/boards';
    const profileApiBaseUrl = '/api/profile';
    const adminApiUrl = '/api/admin';

    // --- DOM Elements ---
    // Views
    const authContainer = document.getElementById('auth-container');
    const appMain = document.getElementById('app-main');
    const boardSelectionView = document.getElementById('board-selection-view');
    const boardDetailWrapper = document.getElementById('board-detail-wrapper');
    const appContainer = document.getElementById('app-container');
    const boardListView = document.getElementById('board-list-view');
    const boardDetailView = document.getElementById('board-detail-view');
    const profileView = document.getElementById('profile-view');
    const adminView = document.getElementById('admin-view');

    // Common Elements
    const sidebar = document.querySelector('.sidebar');
    const writePostFab = document.getElementById('write-post-fab');
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
    const fullBoardsList = document.getElementById('full-boards-list');
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
    const editFormContainer = document.getElementById('edit-form-container');
    const editForm = document.getElementById('edit-post-form');
    const editIdInput = document.getElementById('edit-post-id');
    const editTitleInput = document.getElementById('edit-title');
    const editContentInput = document.getElementById('edit-content');
    const cancelEditBtn = document.getElementById('cancel-edit');

    // Create Post Elements (in modal)
    const createPostFormContainer = document.getElementById('create-form-container');
    const createPostForm = document.getElementById('create-post-form');
    const createPostTitleInput = document.getElementById('create-title');
    const createPostContentInput = document.getElementById('create-content');
    const createPostAttachmentInput = document.getElementById('create-attachment');
    const cancelCreatePostButton = document.getElementById('cancel-create-post');

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
    function showBoardSelectionView() {
        boardSelectionView.style.display = 'block';
        boardDetailWrapper.style.display = 'none';
        appContainer.style.display = 'none'; // Hide the container of other views
    }

    function showBoardDetailView() {
        boardSelectionView.style.display = 'none';
        boardDetailWrapper.style.display = 'flex'; // Use flex for sidebar layout
        appContainer.style.display = 'block';
        showAppView('board-detail-view'); // Show the specific posts view inside
    }

    function showAppView(viewId) {
        // This function now only toggles views *within* the app-container
        [boardDetailView, profileView, adminView].forEach(view => {
            if (view) view.style.display = 'none';
        });

        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
        }

        // Hide the sidebar for profile and admin views
        if (viewId === 'profile-view' || viewId === 'admin-view') {
            sidebar.style.display = 'none';
        } else {
            sidebar.style.display = 'block';
        }
    }

    // --- Auth & UI Functions ---
    async function handleLogin(e) {
        e.preventDefault();
        const userId = loginUserIdInput.value.trim();
        const password = loginPasswordInput.value.trim();
        if (!userId || !password) return alert('아이디와 비밀번호를 모두 입력해주세요.');
        try {
            const response = await fetch(`${authApiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || '로그인에 실패했습니다.');
            localStorage.setItem('jwt_token', data.token);
            await checkLoginStatus(); // This will now trigger the full UI update and routing
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('jwt_token');
        window.location.href = '/';
    }

    async function checkLoginStatus() {
        const storedToken = localStorage.getItem('jwt_token');
        if (storedToken) {
            try {
                const response = await fetchWithAuth(`${authApiUrl}/me`);
                if (response.ok) {
                    currentUser = await response.json();
                } else {
                    // Token is invalid or expired
                    localStorage.removeItem('jwt_token');
                    currentUser = null;
                }
            } catch (error) {
                console.error('Session check failed:', error);
                currentUser = null;
            }
        } else {
            currentUser = null;
        }
        await updateUI(); // Await the UI update to complete
    }

    async function updateUI() {
        if (currentUser) {
            authContainer.style.display = 'none';
            appMain.style.display = 'block'; // Show the main app container
            const rankIcon = getRankIcon(currentUser.rank);
            userWelcomeMessage.innerHTML = `${rankIcon} ${escapeHTML(currentUser.name)}님, 환영합니다!`;
            adminButton.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
            await fetchBoards(); // Await board fetching and rendering
        } else {
            authContainer.style.display = 'block';
            appMain.style.display = 'none';
        }
    }

    // --- API Helper ---
    function fetchWithAuth(url, options = {}) {
        const headers = { ...options.headers };
        const localToken = localStorage.getItem('jwt_token');

        if (!options.body || !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (localToken) {
            headers['Authorization'] = `Bearer ${localToken}`;
        }
        return fetch(url, { ...options, headers });
    }

    // --- Board Logic ---
    async function fetchBoards() {
        try {
            const response = await fetchWithAuth(boardsApiUrl);
            if (!response.ok) throw new Error('게시판 목록을 불러오는 데 실패했습니다.');
            boardsData = await response.json();
            renderBoards(boardsData);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    function renderBoards(boards) {
        // Clear both lists
        fullBoardsList.innerHTML = '';
        boardsList.innerHTML = '';

        boards.forEach(board => {
            // Populate the full-width list
            const fullLi = document.createElement('li');
            fullLi.dataset.boardId = board.id;
            fullLi.innerHTML = `
                <div class="full-board-item">
                    <h3>${escapeHTML(board.name)}</h3>
                    <p>${escapeHTML(board.description || '설명이 없습니다.')}</p>
                </div>`;
            fullBoardsList.appendChild(fullLi);

            // Populate the sidebar list
            const sidebarLi = document.createElement('li');
            sidebarLi.dataset.boardId = board.id;
            sidebarLi.innerHTML = `<span class="board-name">${escapeHTML(board.name)}</span>`;
            boardsList.appendChild(sidebarLi);
        });
    }

    async function handleCreateBoard(e) {
        e.preventDefault();
        const name = createBoardNameInput.value.trim();
        const description = createBoardDescriptionInput.value.trim();

        if (!name) {
            return alert('게시판 이름을 입력해주세요.');
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

            alert('게시판이 성공적으로 생성되었습니다.');
            createBoardForm.reset();
            createBoardFormContainer.style.display = 'none';
            await fetchBoards(); // Refresh the boards list
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // --- Profile Logic ---
    function showProfileView(userId) {
        showAppView('profile-view');
        fetchProfileData(userId);
    }

    async function fetchProfileData(userId) {
        const isMyProfile = !userId || (currentUser && currentUser.id == userId);
        let profileApiUrl = isMyProfile ? `${profileApiBaseUrl}/me` : `${profileApiBaseUrl}/${userId}`;
        if (isMyProfile && !currentUser) {
            alert('로그인이 필요합니다.');
            showBoardSelectionView();
            return;
        }
        try {
            const response = await fetchWithAuth(profileApiUrl);
            if (!response.ok) throw new Error((await response.json()).message || '프로필 정보를 불러오는 데 실패했습니다.');
            renderProfileData(await response.json(), isMyProfile);
        } catch (error) {
            console.error(error);
            profileTitle.textContent = '프로필을 찾을 수 없습니다.';
            myPostsList.innerHTML = `<li>${error.message}</li>`;
            myCommentsList.innerHTML = '';
            editProfileButton.style.display = 'none';
        }
    }

    function renderProfileData(data, isMyProfile) {
        profileTitle.textContent = isMyProfile ? '내 프로필' : `${escapeHTML(data.name || '사용자')}의 프로필`;
        editProfileButton.style.display = isMyProfile ? 'block' : 'none';
        myPostsList.innerHTML = data.posts.length ? data.posts.map(p => `<li><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.content)}</p><span class="post-date">작성일: ${formatDate(p.createdAt)}</span></li>`).join('') : '<li>작성한 글이 없습니다.</li>';
        myCommentsList.innerHTML = data.comments.length ? data.comments.map(c => `<li><p>${escapeHTML(c.content)}</p><span class="comment-meta">원문: ${escapeHTML(c.postTitle)}</span><span class="comment-date">작성일: ${formatDate(c.createdAt)}</span></li>`).join('') : '<li>작성한 댓글이 없습니다.</li>';
    }

    async function handleProfileEdit(e) {
        e.preventDefault();
        const currentPassword = currentPasswordInput.value;
        const newName = newNameInput.value.trim();
        const newPassword = newPasswordInput.value;
        if (!currentPassword) return alert('현재 비밀번호를 입력해주세요.');
        if (!newName && !newPassword) return alert('변경할 이름 또는 비밀번호를 입력해주세요.');
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
            }
            // Re-fetch user info to update the UI with new name/rank
            await checkLoginStatus();
            showProfileView(currentUser.id);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // --- Admin Logic ---
    async function showAdminView() {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('접근 권한이 없습니다.');
            showBoardSelectionView();
            return;
        }
        showAppView('admin-view');
        await fetchAndRenderUsers();
    }

    async function fetchAndRenderUsers() {
        try {
            const response = await fetchWithAuth(`${adminApiUrl}/users`);
            if (!response.ok) throw new Error((await response.json()).message || '사용자 정보를 불러오는 데 실패했습니다.');
            renderUsers(await response.json());
        } catch (error) {
            console.error('Error fetching users:', error);
            usersTableBody.innerHTML = `<tr><td colspan="8">${error.message}</td></tr>`;
        }
    }

    function renderUsers(users) {
        usersTableBody.innerHTML = users.length ? users.map(user => {
            const isSuspended = user.isSuspended;
            const actionControls = user.role === 'admin' ? '<span>(관리자)</span>' : `
                <div class="action-group">
                    <button class="suspend-toggle-btn ${isSuspended ? 'unsuspend-action' : 'suspend-action'}" data-user-id="${user.id}">${isSuspended ? '정지 해제' : '계정 정지'}</button>
                </div>
                <div class="action-group">
                    <input type="number" class="score-input" value="${user.score}" style="width: 60px;"/>
                    <button class="adjust-score-btn" data-user-id="${user.id}">점수 조정</button>
                </div>`;
            return `<tr data-user-id="${user.id}">
                    <td>${escapeHTML(user.name)}</td><td>${escapeHTML(user.userId)}</td><td>${formatDate(user.createdAt)}</td>
                    <td><span class="rank rank-${(user.rank || '').toLowerCase()}">${escapeHTML(user.rank)}</span></td><td>${user.score}</td>
                    <td>${user.postCount}</td><td><span class="${isSuspended ? 'status-suspended' : 'status-active'}">${isSuspended ? '정지됨' : '활성'}</span></td>
                    <td>${actionControls}</td></tr>`;
        }).join('') : '<tr><td colspan="8">등록된 사용자가 없습니다.</td></tr>';
    }

    async function handleAdminTableClick(e) {
        const target = e.target;
        const userId = target.dataset.userId;
        if (target.classList.contains('suspend-toggle-btn')) {
            if (!confirm('정말로 이 사용자의 상태를 변경하시겠습니까?')) return;
            try {
                const response = await fetchWithAuth(`${adminApiUrl}/users/${userId}/toggle-suspend`, { method: 'POST' });
                if (!response.ok) throw new Error((await response.json()).message || '작업에 실패했습니다.');
                alert((await response.json()).message);
                fetchAndRenderUsers();
            } catch (error) {
                console.error('Error toggling suspension:', error);
                alert(error.message);
            }
        }
        if (target.classList.contains('adjust-score-btn')) {
            const scoreInput = target.closest('td').querySelector('.score-input');
            const newScore = parseInt(scoreInput.value, 10);
            if (isNaN(newScore)) return alert('유효한 점수를 입력하세요.');
            if (!confirm(`사용자의 점수를 ${newScore}(으)로 변경하시겠습니까?`)) return;
            try {
                const response = await fetchWithAuth(`${adminApiUrl}/users/${userId}/adjust-score`, {
                    method: 'POST',
                    body: JSON.stringify({ score: newScore }),
                });
                if (!response.ok) throw new Error((await response.json()).message || '점수 조정에 실패했습니다.');
                alert((await response.json()).message);
                fetchAndRenderUsers();
            } catch (error) {
                console.error('Error adjusting score:', error);
                alert(error.message);
            }
        }
    }

    // --- Core App Logic (Posts & Comments) ---
    async function fetchPosts() {
        try {
            const response = await fetchWithAuth(`${postsApiUrl}?boardId=${currentBoardId}`);
            if (!response.ok) throw new Error('게시물을 불러오는 데 실패했습니다.');
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    function renderPosts(posts) {
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
                            const commentActions = canModifyComment ? `<div class="comment-actions"><button class="comment-edit-btn">수정</button><button class="comment-delete-btn">삭제</button></div>` : '';
                            const userVoteComment = comment.votes && currentUser ? comment.votes[currentUser.id] : undefined;
                            const commentLikeClass = userVoteComment === 'like' ? 'active' : '';
                            const commentDislikeClass = userVoteComment === 'dislike' ? 'active' : '';
                            const isOwnComment = currentUser && currentUser.id === comment.authorId;
                            const commentVoteDisabled = isOwnComment ? 'disabled' : '';
                            const commentVoteButtons = `<div class="vote-buttons"><button class="like-btn ${commentLikeClass}" data-votetype="like" data-target="comment" data-comment-id="${comment.id}" ${commentVoteDisabled}>👍</button><span class="like-count">${comment.likes || 0}</span><button class="dislike-btn ${commentDislikeClass}" data-votetype="dislike" data-target="comment" data-comment-id="${comment.id}" ${commentVoteDisabled}>👎</button><span class="dislike-count">${comment.dislikes || 0}</span></div>`;
                            const commentAuthorRankIcon = getRankIcon(comment.authorRank);
                            return `<li data-comment-id="${comment.id}" data-comment-author-id="${comment.authorId}"><div class="comment-view"><div class="comment-content"><span class="comment-author"><a href="#" data-user-id="${comment.authorId}" class="profile-link">${commentAuthorRankIcon} ${escapeHTML(comment.authorName || '익명')}</a></span><span>${escapeHTML(comment.content)}</span><div class="comment-meta"><span class="comment-date">${commentDateString} ${commentUpdatedString}</span></div></div><div class="comment-feedback">${commentVoteButtons}${commentActions}</div></div><div class="comment-edit-form" style="display: none;"><input type="text" class="edit-comment-input" value="${escapeHTML(comment.content)}"><div class="comment-actions"><button class="comment-save-btn">저장</button><button class="comment-cancel-btn">취소</button></div></div></li>`;
                        }).join('')}
                    </ul>
                    <form class="comment-form"><input type="text" class="comment-input" placeholder="댓글을 입력하세요..." required><button type="submit">등록</button></form>
                </div>`;

            const canModifyPost = currentUser && (currentUser.id === post.authorId || currentUser.role === 'admin');
            const postActions = canModifyPost ? `<div class="post-actions"><button class="edit-btn">수정</button><button class="delete-btn">삭제</button></div>` : '';
            const userVotePost = post.votes && currentUser ? post.votes[currentUser.id] : undefined;
            const postLikeClass = userVotePost === 'like' ? 'active' : '';
            const postDislikeClass = userVotePost === 'dislike' ? 'active' : '';
            const isOwnPost = currentUser && currentUser.id === post.authorId;
            const postVoteDisabled = isOwnPost ? 'disabled' : '';
            const postVoteButtons = `<div class="vote-buttons"><button class="like-btn ${postLikeClass}" data-votetype="like" data-target="post" ${postVoteDisabled}>👍</button><span class="like-count">${post.likes || 0}</span><button class="dislike-btn ${postDislikeClass}" data-votetype="dislike" data-target="post" ${postVoteDisabled}>👎</button><span class="dislike-count">${post.dislikes || 0}</span></div>`;
            let attachmentHtml = '';
            if (post.attachment) {
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(post.attachment);
                attachmentHtml = isImage ? `<div class="post-attachment"><img src="${post.attachment}" alt="Attachment" style="max-width: 100%; height: auto;"></div>` : `<div class="post-attachment"><a href="${post.attachment}" target="_blank" download>첨부파일 다운로드</a></div>`;
            }
            const postAuthorRankIcon = getRankIcon(post.authorRank);
            li.innerHTML = `<h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.content)}</p>${attachmentHtml}<div class="post-meta"><span class="post-author">작성자: <a href="#" data-user-id="${post.authorId}" class="profile-link">${postAuthorRankIcon} ${escapeHTML(post.authorName || '익명')}</a></span><span class="post-date">작성일: ${postDateString} ${postUpdatedDateString}</span></div><div class="post-feedback">${postVoteButtons}${postActions}</div>${commentsHtml}`;
            postsList.appendChild(li);
        });
    }

    async function handleCreatePost(e) {
        e.preventDefault();
        const title = createPostTitleInput.value.trim();
        const content = createPostContentInput.value.trim();
        const attachmentFile = createPostAttachmentInput.files[0];

        if (!title || !content) {
            return alert('제목과 내용을 모두 입력해주세요.');
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

            alert('게시물이 성공적으로 등록되었습니다.');
            createPostForm.reset();
            createPostFormContainer.style.display = 'none';
            await fetchPosts(); // Refresh the posts list
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    async function handlePostAndCommentActions(e) {
        const target = e.target;
        const postLi = target.closest('li[data-id]');
        if (!postLi) return;
        const postId = postLi.dataset.id;

        if (target.classList.contains('delete-btn')) {
            if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
            try {
                const response = await fetchWithAuth(`${postsApiUrl}/${postId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).message || '게시물 삭제에 실패했습니다.');
                fetchPosts();
            } catch (error) { console.error(error); alert(error.message); }
        } else if (target.classList.contains('edit-btn')) {
            const title = postLi.querySelector('h3').textContent;
            const content = postLi.querySelector('p').textContent;
            showEditForm(postId, title, content);
        } else if (target.classList.contains('comment-delete-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const commentId = commentLi.dataset.commentId;
            if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
            try {
                const response = await fetchWithAuth(`${postsApiUrl}/${postId}/comments/${commentId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).message || '댓글 삭제에 실패했습니다.');
                fetchPosts();
            } catch (error) { console.error(error); alert(error.message); }
        } else if (target.classList.contains('comment-edit-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            commentLi.querySelector('.comment-view').style.display = 'none';
            commentLi.querySelector('.comment-edit-form').style.display = 'flex';
        } else if (target.classList.contains('comment-cancel-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            commentLi.querySelector('.comment-view').style.display = 'flex';
            commentLi.querySelector('.comment-edit-form').style.display = 'none';
        } else if (target.classList.contains('comment-save-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const commentId = commentLi.dataset.commentId;
            const newContent = commentLi.querySelector('.edit-comment-input').value.trim();
            if (!newContent) return alert('댓글 내용이 비어있습니다.');
            try {
                const response = await fetchWithAuth(`${postsApiUrl}/${postId}/comments/${commentId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ content: newContent }),
                });
                if (!response.ok) throw new Error((await response.json()).message || '댓글 수정에 실패했습니다.');
                fetchPosts();
            } catch (error) { console.error(error); alert(error.message); }
        } else if (target.classList.contains('like-btn') || target.classList.contains('dislike-btn')) {
            if (!currentUser) return alert('로그인이 필요합니다.');
            const voteType = target.dataset.votetype;
            const targetType = target.dataset.target;
            let url = targetType === 'post' ? `${postsApiUrl}/${postId}/vote` : `${postsApiUrl}/${postId}/comments/${target.dataset.commentId}/vote`;
            try {
                const response = await fetchWithAuth(url, { method: 'POST', body: JSON.stringify({ voteType }) });
                if (!response.ok) throw new Error((await response.json()).message || '투표 처리에 실패했습니다.');
                fetchPosts();
            } catch (error) { console.error(error); alert(error.message); }
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault();
        if (!e.target.classList.contains('comment-form')) return;
        const li = e.target.closest('li[data-id]');
        if (!li) return;
        const postId = li.dataset.id;
        const commentInput = e.target.querySelector('.comment-input');
        const content = commentInput.value.trim();
        if (!content) return alert('댓글 내용을 입력해주세요.');
        try {
            const response = await fetchWithAuth(`${postsApiUrl}/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content }),
            });
            if (!response.ok) throw new Error((await response.json()).message || '댓글 작성에 실패했습니다.');
            commentInput.value = '';
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // --- Helper Functions ---
    function getRankIcon(rank) { return ({'admin':'🛡️','Rookie':'🔰','Beginner':'🌱','Intermediate':'🌿','Expert':'🌳','Master':'👑'})[rank]||''; }
    function escapeHTML(str) {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }
    function formatDate(date) { return new Date(date).toLocaleString('ko-KR', { year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false }); }
    function showEditForm(id, title, content) {
        editIdInput.value = id;
        editTitleInput.value = title;
        editContentInput.value = content;
        editFormContainer.style.display = 'block';
    }
    function hideEditForm() {
        editFormContainer.style.display = 'none';
    }

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    logoDiv.addEventListener('click', () => {
        window.history.pushState({}, '', '/');
        showBoardSelectionView();
    });
    writePostFab.addEventListener('click', () => {
        if (currentBoardId) {
            createPostFormContainer.style.display = 'block';
        } else {
            alert('게시판을 먼저 선택해주세요.');
        }
    });
    adminButton.addEventListener('click', (e) => { e.preventDefault(); window.history.pushState({}, '', '/?view=admin'); showAdminView(); });
    profileButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            window.history.pushState({}, '', `/?userId=${currentUser.id}`);
            showProfileView(currentUser.id);
        } else {
            alert('로그인이 필요합니다.');
        }
    });

    function selectBoard(boardId) {
        currentBoardId = boardId;

        // Highlight the selected board in the sidebar
        const allBoardItems = boardsList.querySelectorAll('li');
        allBoardItems.forEach(item => {
            if (item.dataset.boardId == currentBoardId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        showBoardDetailView();
        fetchPosts();
    }

    fullBoardsList.addEventListener('click', (e) => {
        const boardLi = e.target.closest('li[data-board-id]');
        if (boardLi) {
            const boardId = parseInt(boardLi.dataset.boardId, 10);
            selectBoard(boardId);
        }
    });

    boardsList.addEventListener('click', (e) => {
        const boardLi = e.target.closest('li[data-board-id]');
        if (boardLi) {
            const boardId = parseInt(boardLi.dataset.boardId, 10);
            if (boardId !== currentBoardId) {
                selectBoard(boardId);
            }
        }
    });

    // This is a master listener for all actions inside the posts list
    postsList.addEventListener('click', (e) => {
        // Profile link clicks
        const profileLink = e.target.closest('.profile-link');
        if (profileLink) {
            e.preventDefault();
            const userId = profileLink.dataset.userId;
            window.history.pushState({}, '', `/?userId=${userId}`);
            showProfileView(userId);
            return;
        }

        // All other post/comment actions
        handlePostAndCommentActions(e);
    });
    postsList.addEventListener('submit', handleCommentSubmit);
    editProfileButton.addEventListener('click', () => editProfileModal.style.display = 'block');
    closeButton.addEventListener('click', () => editProfileModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target == editProfileModal) editProfileModal.style.display = 'none'; });
    editProfileForm.addEventListener('submit', handleProfileEdit);
    usersTableBody.addEventListener('click', handleAdminTableClick);
    cancelEditBtn.addEventListener('click', hideEditForm);
    cancelCreatePostButton.addEventListener('click', () => {
        createPostFormContainer.style.display = 'none';
        createPostForm.reset();
    });
    showCreateBoardFormButton.addEventListener('click', () => createBoardFormContainer.style.display = 'block');
    cancelCreateBoardButton.addEventListener('click', () => createBoardFormContainer.style.display = 'none');
    createBoardForm.addEventListener('submit', handleCreateBoard);
    createPostForm.addEventListener('submit', handleCreatePost);
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

    // --- URL Routing and Initial Load ---
    function handleRouting() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('boardId')) {
            const boardId = parseInt(params.get('boardId'), 10);
            selectBoard(boardId);
        } else if (params.get('view') === 'admin') {
            showAdminView();
        } else if (params.has('userId')) {
            showProfileView(params.get('userId'));
        } else {
            showBoardSelectionView(); // Default view
        }
    }

    async function initialLoad() {
        await checkLoginStatus(); // This now ensures boards are rendered before proceeding

        const nextActionRaw = localStorage.getItem('nextAction');
        if (nextActionRaw) {
            localStorage.removeItem('nextAction'); // Consume the action
            try {
                const nextAction = JSON.parse(nextActionRaw);
                if (nextAction.view === 'board' && nextAction.boardId) {
                    selectBoard(nextAction.boardId);
                    // Also update the URL for consistency, but use replaceState to not break the back button
                    history.replaceState(null, '', `/?boardId=${nextAction.boardId}`);
                    return; // Stop further routing
                }
            } catch (e) {
                console.error("Could not parse nextAction from localStorage", e);
            }
        }

        handleRouting(); // Handle routing for direct navigation or bookmarks
        window.onpopstate = handleRouting;
    }

    initialLoad();
});
