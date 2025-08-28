document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let token = null;
    let currentUser = null;

    // --- API URLs ---
    const postsApiUrl = '/api/posts';
    const authApiUrl = '/api/auth';

    // --- DOM Elements ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    const loginForm = document.getElementById('login-form');
    const loginUserIdInput = document.getElementById('login-userId');
    const loginPasswordInput = document.getElementById('login-password');

    const userInfo = document.getElementById('user-info');
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');

    const postsList = document.getElementById('posts-list');
    const createForm = document.getElementById('create-post-form');
    const createTitleInput = document.getElementById('create-title');
    const createContentInput = document.getElementById('create-content');

    const editFormContainer = document.getElementById('edit-form-container');
    const createFormContainer = document.getElementById('create-form-container');
    const editForm = document.getElementById('edit-post-form');
    const editIdInput = document.getElementById('edit-post-id');
    const editTitleInput = document.getElementById('edit-title');
    const editContentInput = document.getElementById('edit-content');
    const cancelEditBtn = document.getElementById('cancel-edit');


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
            if (!response.ok) {
                throw new Error(data.message || '로그인에 실패했습니다.');
            }

            token = data.token;
            localStorage.setItem('jwt_token', token);

            // Fetch user info to store locally
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
                // Token is invalid or expired
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

    const updateUI = () => {
        if (token && currentUser) {
            // Logged in
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            userWelcomeMessage.textContent = `${currentUser.name}(${currentUser.userId})님, 환영합니다!`;
            fetchPosts();
        } else {
            // Logged out
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
            postsList.innerHTML = ''; // Clear posts
        }
    };

    // --- API Helper ---

    const fetchWithAuth = (url, options = {}) => {
        const headers = {
            ...options.headers,
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, { ...options, headers });
    };

    // --- Core App Logic (Posts & Comments) ---

    const fetchPosts = async () => {
        try {
            const response = await fetchWithAuth(postsApiUrl); // Public route, but auth helps identify user
            if (!response.ok) {
                throw new Error('게시물을 불러오는 데 실패했습니다.');
            }
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
            postsList.innerHTML = '<li>게시물이 없습니다.</li>';
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

                            // Conditionally show comment actions
                            const commentActions = currentUser && currentUser.id === comment.authorId ? `
                                <div class="comment-actions">
                                    <button class="comment-edit-btn">수정</button>
                                    <button class="comment-delete-btn">삭제</button>
                                </div>` : '';

                            return `
                                <li data-comment-id="${comment.id}" data-comment-author-id="${comment.authorId}">
                                    <div class="comment-view">
                                        <div class="comment-content">
                                            <span class="comment-author">${escapeHTML(comment.authorName || '익명')}</span>
                                            <span>${escapeHTML(comment.content)}</span>
                                            <div class="comment-meta">
                                                <span class="comment-date">${commentDateString} ${commentUpdatedString}</span>
                                            </div>
                                        </div>
                                        ${commentActions}
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
            const postActions = currentUser && currentUser.id === post.authorId ? `
                <div class="post-actions">
                    <button class="edit-btn">수정</button>
                    <button class="delete-btn">삭제</button>
                </div>` : '';

            li.innerHTML = `
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.content)}</p>
                <div class="post-meta">
                    <span class="post-author">작성자: ${escapeHTML(post.authorName || '익명')}</span>
                    <span class="post-date">작성일: ${postDateString} ${postUpdatedDateString}</span>
                </div>
                ${postActions}
                ${commentsHtml}
            `;
            postsList.appendChild(li);
        });
    };

    // --- Event Listeners ---

    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);

    // Create Post
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = createTitleInput.value.trim();
        const content = createContentInput.value.trim();

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetchWithAuth(postsApiUrl, {
                method: 'POST',
                body: JSON.stringify({ title, content }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '게시물 생성에 실패했습니다.');
            }
            createTitleInput.value = '';
            createContentInput.value = '';
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    // Edit Post
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const title = editTitleInput.value.trim();
        const content = editContentInput.value.trim();

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetchWithAuth(`${postsApiUrl}/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, content }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '게시물 수정에 실패했습니다.');
            }
            hideEditForm();
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    // Handle Clicks for Edit/Delete and Comment actions
    postsList.addEventListener('click', async (e) => {
        const target = e.target;
        const postLi = target.closest('li[data-id]');
        if (!postLi) return;
        const postId = postLi.dataset.id;

        // Post Delete
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
        // Post Edit
        else if (target.classList.contains('edit-btn')) {
            const title = postLi.querySelector('h3').textContent;
            const content = postLi.querySelector('p').textContent;
            showEditForm(postId, title, content);
        }
        // Comment Delete
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
        // Comment Edit
        else if (target.classList.contains('comment-edit-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const viewDiv = commentLi.querySelector('.comment-view');
            const editForm = commentLi.querySelector('.comment-edit-form');
            viewDiv.style.display = 'none';
            editForm.style.display = 'flex';
        }
        // Comment Edit Cancel
        else if (target.classList.contains('comment-cancel-btn')) {
            const commentLi = target.closest('li[data-comment-id]');
            if (!commentLi) return;
            const viewDiv = commentLi.querySelector('.comment-view');
            const editForm = commentLi.querySelector('.comment-edit-form');
            viewDiv.style.display = 'flex';
            editForm.style.display = 'none';
        }
        // Comment Edit Save
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
    });

    // Handle Comment Creation
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
});
