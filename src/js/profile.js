document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let token = null;
    let currentUser = null;

    // --- API URLs ---
    const profileApiUrl = '/api/profile/me';
    const authApiUrl = '/api/auth';

    // --- DOM Elements ---
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const myPostsList = document.getElementById('my-posts-list');
    const myCommentsList = document.getElementById('my-comments-list');
    const editProfileButton = document.getElementById('edit-profile-button');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeButton = document.querySelector('.close-button');
    const editProfileForm = document.getElementById('edit-profile-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newNameInput = document.getElementById('new-name');
    const newPasswordInput = document.getElementById('new-password');

    // --- Auth Functions ---

    const handleLogout = () => {
        token = null;
        currentUser = null;
        localStorage.removeItem('jwt_token');
        window.location.href = '/index.html';
    };

    const checkLoginStatus = async () => {
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken) {
            window.location.href = '/index.html';
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
            fetchProfileData();
        } catch (error) {
            console.error('Session check failed:', error);
            handleLogout();
        }
    };

    // --- UI Update ---

    const updateUI = () => {
        if (currentUser) {
            let welcomeHTML = `${escapeHTML(currentUser.name)}(${escapeHTML(currentUser.userId)})님, 환영합니다!`;
            userWelcomeMessage.innerHTML = welcomeHTML;
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

    // --- Profile Logic ---

    const fetchProfileData = async () => {
        try {
            const response = await fetchWithAuth(profileApiUrl);
            if (!response.ok) {
                throw new Error('프로필 정보를 불러오는 데 실패했습니다.');
            }
            const data = await response.json();
            renderProfileData(data);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const renderProfileData = (data) => {
        // Render posts
        myPostsList.innerHTML = '';
        if (data.posts.length === 0) {
            myPostsList.innerHTML = '<li>작성한 글이 없습니다.</li>';
        } else {
            data.posts.forEach(post => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <h3>${escapeHTML(post.title)}</h3>
                    <p>${escapeHTML(post.content)}</p>
                    <span class="post-date">작성일: ${formatDate(post.createdAt)}</span>
                `;
                myPostsList.appendChild(li);
            });
        }

        // Render comments
        myCommentsList.innerHTML = '';
        if (data.comments.length === 0) {
            myCommentsList.innerHTML = '<li>작성한 댓글이 없습니다.</li>';
        } else {
            data.comments.forEach(comment => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <p>${escapeHTML(comment.content)}</p>
                    <span class="comment-meta">원문: ${escapeHTML(comment.postTitle)}</span>
                    <span class="comment-date">작성일: ${formatDate(comment.createdAt)}</span>
                `;
                myCommentsList.appendChild(li);
            });
        }
    };

    // --- Modal Logic ---

    const showModal = () => {
        editProfileModal.style.display = 'block';
    };

    const hideModal = () => {
        editProfileModal.style.display = 'none';
        editProfileForm.reset();
    };

    // --- Event Listeners ---

    logoutButton.addEventListener('click', handleLogout);
    editProfileButton.addEventListener('click', showModal);
    closeButton.addEventListener('click', hideModal);
    window.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            hideModal();
        }
    });

    editProfileForm.addEventListener('submit', async (e) => {
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
            const response = await fetchWithAuth(profileApiUrl, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newName, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || '프로필 수정에 실패했습니다.');
            }

            alert(data.message);
            hideModal();
            // Refresh user info
            checkLoginStatus();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    // --- Helper Functions ---

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
