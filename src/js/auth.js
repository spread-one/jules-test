import * as api from './api.js';
import { updateUI, showNotification } from './ui.js';

let token = null;
let currentUser = null;

export const getToken = () => token;
export const getCurrentUser = () => currentUser;

export const handleLogout = () => {
    token = null;
    currentUser = null;
    localStorage.removeItem('jwt_token');
    updateUI();
};

export const handleLogin = async (userId, password) => {
    try {
        const response = await api.login(userId, password);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '로그인에 실패했습니다.');
        }

        token = data.token;
        localStorage.setItem('jwt_token', token);
        showNotification('로그인 성공!', 'success');
        await checkLoginStatus();
    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    }
};

export const checkLoginStatus = async () => {
    const storedToken = localStorage.getItem('jwt_token');
    if (!storedToken) {
        updateUI();
        return;
    }
    token = storedToken;

    try {
        const response = await api.getMe(token);
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
