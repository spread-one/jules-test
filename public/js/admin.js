document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('jwt_token');
    const usersTableBody = document.getElementById('users-table-body');
    const adminApiUrl = '/api/admin';

    // --- Helper Functions ---
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

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // --- Core Functions ---

    const fetchAndRenderUsers = async () => {
        try {
            const response = await fetchWithAuth(`${adminApiUrl}/users`);

            if (response.status === 403 || response.status === 401) {
                // If not authorized, redirect to home page
                alert('접근 권한이 없습니다. 메인 페이지로 이동합니다.');
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '사용자 정보를 불러오는 데 실패했습니다.');
            }

            const users = await response.json();
            renderUsers(users);

        } catch (error) {
            console.error('Error fetching users:', error);
            usersTableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
        }
    };

    const renderUsers = (users) => {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6">등록된 사용자가 없습니다.</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-user-id', user.id);

            const suspendButtonText = user.isSuspended ? '정지 해제' : '계정 정지';
            const statusText = user.isSuspended ? '정지됨' : '활성';
            const statusClass = user.isSuspended ? 'status-suspended' : 'status-active';

            // Admins cannot be suspended
            const actionButton = user.role === 'admin'
                ? '<span>(관리자)</span>'
                : `<button class="suspend-toggle-btn" data-user-id="${user.id}">${suspendButtonText}</button>`;

            tr.innerHTML = `
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.userId)}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.postCount}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${actionButton}</td>
            `;
            usersTableBody.appendChild(tr);
        });
    };

    const handleSuspendToggle = async (e) => {
        const target = e.target;
        if (!target.classList.contains('suspend-toggle-btn')) {
            return;
        }

        const userId = target.dataset.userId;
        if (!confirm(`정말로 이 사용자의 상태를 변경하시겠습니까?`)) {
            return;
        }

        try {
            const response = await fetchWithAuth(`${adminApiUrl}/users/${userId}/toggle-suspend`, {
                method: 'POST'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '작업에 실패했습니다.');
            }

            alert(result.message);
            fetchAndRenderUsers(); // Refresh the list

        } catch (error) {
            console.error('Error toggling suspension:', error);
            alert(error.message);
        }
    };


    // --- Initial Load & Event Listeners ---
    if (!token) {
        alert('로그인이 필요합니다. 메인 페이지로 이동합니다.');
        window.location.href = '/';
    } else {
        fetchAndRenderUsers();
        usersTableBody.addEventListener('click', handleSuspendToggle);
    }
});
