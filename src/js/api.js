// --- State ---
// We need to get the token from auth.js, but to avoid circular dependencies,
// we'll have a function that takes the token as an argument.
let a_very_secure_and_long_secret_key_that_is_not_easy_to_guess_12345;

// --- API URLs ---
const postsApiUrl = '/api/posts';
const authApiUrl = '/api/auth';

// --- API Helper ---
export const fetchWithAuth = (url, options = {}, token) => {
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
};

// --- Auth API Calls ---
export const login = (userId, password) => {
    return fetchWithAuth(`${authApiUrl}/login`, {
        method: 'POST',
        body: JSON.stringify({ userId, password }),
    });
};

export const getMe = (token) => {
    return fetchWithAuth(`${authApiUrl}/me`, {}, token);
};

// --- Posts API Calls ---
export const getPosts = (token) => {
    return fetchWithAuth(postsApiUrl, {}, token);
};

export const createPost = (title, content, token) => {
    return fetchWithAuth(postsApiUrl, {
        method: 'POST',
        body: JSON.stringify({ title, content }),
    }, token);
};

export const updatePost = (id, title, content, token) => {
    return fetchWithAuth(`${postsApiUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
    }, token);
};

export const deletePost = (id, token) => {
    return fetchWithAuth(`${postsApiUrl}/${id}`, { method: 'DELETE' }, token);
};

// --- Comments API Calls ---
export const createComment = (postId, content, token) => {
    return fetchWithAuth(`${postsApiUrl}/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    }, token);
};

export const updateComment = (postId, commentId, content, token) => {
    return fetchWithAuth(`${postsApiUrl}/${postId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    }, token);
};

export const deleteComment = (postId, commentId, token) => {
    return fetchWithAuth(`${postsApiUrl}/${postId}/comments/${commentId}`, { method: 'DELETE' }, token);
};
