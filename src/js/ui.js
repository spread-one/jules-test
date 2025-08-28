import * as api from './api.js';
import { getToken, getCurrentUser } from './auth.js';

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userWelcomeMessage = document.getElementById('user-welcome-message');
const notificationArea = document.getElementById('notification-area');
export const postsList = document.getElementById('posts-list');
const createFormContainer = document.getElementById('create-form-container');
const editFormContainer = document.getElementById('edit-form-container');
export const editIdInput = document.getElementById('edit-post-id');
export const editTitleInput = document.getElementById('edit-title');
export const editContentInput = document.getElementById('edit-content');
export const createTitleInput = document.getElementById('create-title');
export const createContentInput = document.getElementById('create-content');

// --- Notification ---
let notificationTimer;
export const showNotification = (message, type = 'success') => {
    notificationArea.textContent = message;
    notificationArea.className = 'notification-area'; // Reset classes
    notificationArea.classList.add('show', type);

    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
        notificationArea.classList.remove('show');
    }, 3000);
};

// --- UI Update ---
export const updateUI = () => {
    const token = getToken();
    const currentUser = getCurrentUser();
    if (token && currentUser) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userWelcomeMessage.textContent = `${currentUser.name}(${currentUser.userId})님, 환영합니다!`;
        fetchAndRenderPosts();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        postsList.innerHTML = '';
    }
};

// --- Post & Comment Rendering ---
export const fetchAndRenderPosts = async () => {
    try {
        const response = await api.getPosts(getToken());
        if (!response.ok) {
            throw new Error('게시물을 불러오는 데 실패했습니다.');
        }
        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    }
};

const renderPosts = (posts) => {
    postsList.innerHTML = '';
    if (posts.length === 0) {
        postsList.innerHTML = '<li>게시물이 없습니다.</li>';
        return;
    }
    posts.forEach(post => {
        addPostToDOM(post, false); // Add without prepending
    });
};

export const addPostToDOM = (post, prepend = true) => {
    if (prepend && postsList.children.length === 1 && postsList.children[0].textContent === '게시물이 없습니다.') {
        postsList.innerHTML = '';
    }
    const li = document.createElement('li');
    li.setAttribute('data-id', post.id);
    li.setAttribute('data-author-id', post.authorId);

    const postContent = document.createElement('div');
    postContent.classList.add('post-content');
    postContent.innerHTML = createPostHTML(post);
    li.appendChild(postContent);

    const commentsSection = document.createElement('div');
    commentsSection.classList.add('comments-section');
    li.appendChild(commentsSection);

    renderComments(post.id, post.comments);

    if (prepend) {
        postsList.prepend(li);
    } else {
        postsList.appendChild(li);
    }
};

export const updatePostInDOM = (post) => {
    const postLi = postsList.querySelector(`li[data-id='${post.id}']`);
    if (postLi) {
        const postContent = postLi.querySelector('.post-content');
        if (postContent) {
            postContent.innerHTML = createPostHTML(post);
        }
    }
};

export const removePostFromDOM = (postId) => {
    const postLi = postsList.querySelector(`li[data-id='${postId}']`);
    if (postLi) {
        postLi.remove();
    }
    if (postsList.children.length === 0) {
        postsList.innerHTML = '<li>게시물이 없습니다.</li>';
    }
};

export const renderComments = (postId, comments) => {
    const postLi = postsList.querySelector(`li[data-id='${postId}']`);
    if (!postLi) return;

    const commentsSection = postLi.querySelector('.comments-section');
    if (!commentsSection) return;

    commentsSection.innerHTML = `
        <h4>댓글 (${comments.length})</h4>
        <ul class="comments-list">
            ${comments.map(comment => createCommentHTML(comment)).join('')}
        </ul>
        <form class="comment-form">
            <input type="text" class="comment-input" placeholder="댓글을 입력하세요..." required>
            <button type="submit">등록</button>
        </form>
    `;
};


const createPostHTML = (post) => {
    const currentUser = getCurrentUser();
    const postDate = new Date(post.createdAt);
    const postDateString = formatDate(postDate);
    const postUpdated = post.createdAt !== post.updatedAt;
    const postUpdatedDateString = postUpdated ? `(수정됨: ${formatDate(new Date(post.updatedAt))})` : '';

    const postActions = currentUser && currentUser.id === post.authorId ? `
        <div class="post-actions">
            <button class="edit-btn">수정</button>
            <button class="delete-btn">삭제</button>
        </div>` : '';

    return `
        <h3>${escapeHTML(post.title)}</h3>
        <p>${escapeHTML(post.content)}</p>
        <div class="post-meta">
            <span class="post-author">작성자: ${escapeHTML(post.authorName || '익명')}</span>
            <span class="post-date">작성일: ${postDateString} ${postUpdatedDateString}</span>
        </div>
        ${postActions}
    `;
};

const createCommentHTML = (comment) => {
    const currentUser = getCurrentUser();
    const commentDate = new Date(comment.createdAt);
    const commentDateString = formatDate(commentDate);
    const commentUpdated = comment.createdAt !== comment.updatedAt;
    const commentUpdatedString = commentUpdated ? `(수정됨: ${formatDate(new Date(comment.updatedAt))})` : '';

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
};


// --- Form Handling ---
export const showEditForm = (id, title, content) => {
    editIdInput.value = id;
    editTitleInput.value = title;
    editContentInput.value = content;
    createFormContainer.style.display = 'none';
    editFormContainer.style.display = 'block';
};

export const hideEditForm = () => {
    editFormContainer.style.display = 'none';
    createFormContainer.style.display = 'block';
};

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
