import * as api from './api.js';
import { getToken, handleLogin, handleLogout, checkLoginStatus } from './auth.js';
import {
    postsList,
    createTitleInput,
    createContentInput,
    editIdInput,
    editTitleInput,
    editContentInput,
    showEditForm,
    hideEditForm,
    showNotification,
    addPostToDOM,
    updatePostInDOM,
    removePostFromDOM,
    renderComments
} from './ui.js';

// --- DOM Elements ---
const loginForm = document.getElementById('login-form');
const loginUserIdInput = document.getElementById('login-userId');
const loginPasswordInput = document.getElementById('login-password');
const logoutButton = document.getElementById('logout-button');
const createPostForm = document.getElementById('create-post-form');
const editPostForm = document.getElementById('edit-post-form');
const cancelEditBtn = document.getElementById('cancel-edit');

// --- Event Listeners ---

// Auth
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = loginUserIdInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!userId || !password) {
        showNotification('아이디와 비밀번호를 모두 입력해주세요.', 'error');
        return;
    }
    handleLogin(userId, password);
});

logoutButton.addEventListener('click', () => {
    handleLogout();
    showNotification('로그아웃 되었습니다.', 'success');
});

// Post Creation
createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = createTitleInput.value.trim();
    const content = createContentInput.value.trim();
    if (!title || !content) {
        showNotification('제목과 내용을 모두 입력해주세요.', 'error');
        return;
    }
    try {
        const response = await api.createPost(title, content, getToken());
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '게시물 생성에 실패했습니다.');
        }
        const newPost = await response.json();
        createTitleInput.value = '';
        createContentInput.value = '';
        addPostToDOM(newPost);
        showNotification('게시물이 성공적으로 등록되었습니다.', 'success');
    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    }
});

// Post Editing
editPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editIdInput.value;
    const title = editTitleInput.value.trim();
    const content = editContentInput.value.trim();
    if (!title || !content) {
        showNotification('제목과 내용을 모두 입력해주세요.', 'error');
        return;
    }
    try {
        const response = await api.updatePost(id, title, content, getToken());
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '게시물 수정에 실패했습니다.');
        }
        const updatedPost = await response.json();
        hideEditForm();
        updatePostInDOM(updatedPost);
        showNotification('게시물이 성공적으로 수정되었습니다.', 'success');
    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    }
});

cancelEditBtn.addEventListener('click', hideEditForm);

// Post/Comment Actions (Event Delegation)
postsList.addEventListener('click', async (e) => {
    const target = e.target;
    const postLi = target.closest('li[data-id]');
    if (!postLi) return;
    const postId = postLi.dataset.id;

    // Post Delete
    if (target.classList.contains('delete-btn')) {
        if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
        try {
            const response = await api.deletePost(postId, getToken());
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '게시물 삭제에 실패했습니다.');
            }
            removePostFromDOM(postId);
            showNotification('게시물이 삭제되었습니다.', 'success');
        } catch (error) {
            console.error(error);
            showNotification(error.message, 'error');
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
            const response = await api.deleteComment(postId, commentId, getToken());
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '댓글 삭제에 실패했습니다.');
            }
            commentLi.remove();
            showNotification('댓글이 삭제되었습니다.', 'success');
        } catch (error) {
            console.error(error);
            showNotification(error.message, 'error');
        }
    }
    // Comment Edit
    else if (target.classList.contains('comment-edit-btn')) {
        const commentLi = target.closest('li[data-comment-id]');
        if (!commentLi) return;
        commentLi.querySelector('.comment-view').style.display = 'none';
        commentLi.querySelector('.comment-edit-form').style.display = 'flex';
    }
    // Comment Edit Cancel
    else if (target.classList.contains('comment-cancel-btn')) {
        const commentLi = target.closest('li[data-comment-id]');
        if (!commentLi) return;
        commentLi.querySelector('.comment-view').style.display = 'flex';
        commentLi.querySelector('.comment-edit-form').style.display = 'none';
    }
    // Comment Edit Save
    else if (target.classList.contains('comment-save-btn')) {
        const commentLi = target.closest('li[data-comment-id]');
        if (!commentLi) return;
        const commentId = commentLi.dataset.commentId;
        const newContent = commentLi.querySelector('.edit-comment-input').value.trim();
        if (!newContent) {
            showNotification('댓글 내용이 비어있습니다.', 'error');
            return;
        }
        try {
            const response = await api.updateComment(postId, commentId, newContent, getToken());
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '댓글 수정에 실패했습니다.');
            }
            const updatedComment = await response.json();
            const postResponse = await api.getPosts(getToken());
            const posts = await postResponse.json();
            const post = posts.find(p => p.id === parseInt(postId));
            renderComments(postId, post.comments);
            showNotification('댓글이 수정되었습니다.', 'success');
        } catch (error) {
            console.error(error);
            showNotification(error.message, 'error');
        }
    }
});

// Comment Creation (Event Delegation)
postsList.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.target.classList.contains('comment-form')) return;
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const postId = li.dataset.id;
    const commentInput = e.target.querySelector('.comment-input');
    const content = commentInput.value.trim();
    if (!content) {
        showNotification('댓글 내용을 입력해주세요.', 'error');
        return;
    }
    try {
        const response = await api.createComment(postId, content, getToken());
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '댓글 작성에 실패했습니다.');
        }
        commentInput.value = '';
        const postResponse = await api.getPosts(getToken());
        const posts = await postResponse.json();
        const post = posts.find(p => p.id === parseInt(postId));
        renderComments(postId, post.comments);
        showNotification('댓글이 성공적으로 등록되었습니다.', 'success');
    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});
