document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let token = null;
    let currentUser = null;
    let viewingUserId = null;

    // --- API URLs ---
    const profileApiBaseUrl = '/api/profile';
    const authApiUrl = '/api/auth';

    // --- DOM Elements ---
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const profileTitle = document.getElementById('profile-title');
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
            // If not logged in, they can't view their own profile.
            // Redirect to login, as profile page without a target is the "my profile" page.
            const params = new URLSearchParams(window.location.search);
            if (!params.has('userId')) {
                 window.location.href = '/index.html';
                 return;
            }
        }
        token = storedToken;

        try {
            const response = await fetchWithAuth(`${authApiUrl}/me`);
            if (response.ok) {
                currentUser = await response.json();
            }
            // Continue execution even if not logged in, to allow viewing public profiles
            initializeProfilePage();
        } catch (error) {
            console.error('Session check failed:', error);
            // Still try to load the page, might be a public profile
            initializeProfilePage();
        }
    };

    // --- Page Initialization ---
    const initializeProfilePage = () => {
        const params = new URLSearchParams(window.location.search);
        viewingUserId = params.get('userId');

        updateWelcomeMessage(); // Update welcome message for logged-in user
        fetchProfileData(); // Fetch profile data for the correct user
    };

    // --- UI Update ---

    const updateWelcomeMessage = () => {
        if (currentUser) {
            let welcomeHTML = `${escapeHTML(currentUser.name)}(${escapeHTML(currentUser.userId)})님, 환영합니다!`;
            userWelcomeMessage.innerHTML = welcomeHTML;
        } else {
            // Handle case where user is not logged in but viewing a profile
            userWelcomeMessage.innerHTML = '로그인되지 않았습니다.';
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
        const isMyProfile = !viewingUserId || (currentUser && currentUser.id == viewingUserId);
        let profileApiUrl;

        if (isMyProfile) {
            // This requires login, which is checked in checkLoginStatus
            if (!currentUser) {
                // This case should be handled by the redirect in checkLoginStatus, but as a fallback:
                myPostsList.innerHTML = '<li>로그인이 필요합니다.</li>';
                myCommentsList.innerHTML = '';
                return;
            }
            profileApiUrl = `${profileApiBaseUrl}/me`;
        } else {
            profileApiUrl = `${profileApiBaseUrl}/${viewingUserId}`;
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
        // Update title and edit button based on whose profile it is
        if (isMyProfile) {
            profileTitle.textContent = '내 프로필';
            document.title = '내 프로필';
            editProfileButton.style.display = 'block';
        } else {
            const profileName = escapeHTML(data.name || '사용자');
            profileTitle.textContent = `${profileName}의 프로필`;
            document.title = `${profileName}의 프로필`;
            editProfileButton.style.display = 'none';
        }

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
            // The PUT endpoint is always /me for editing
            const response = await fetchWithAuth(`${profileApiBaseUrl}/me`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newName, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || '프로필 수정에 실패했습니다.');
            }

            alert(data.message);
            hideModal();
            // Refresh user info and profile data
            await checkLoginStatus();

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
