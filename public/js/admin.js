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
            usersTableBody.innerHTML = '<tr><td colspan="8">등록된 사용자가 없습니다.</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-user-id', user.id);

            const isSuspended = user.isSuspended;
            const suspendButtonText = isSuspended ? '정지 해제' : '계정 정지';
            const buttonActionClass = isSuspended ? 'unsuspend-action' : 'suspend-action';
            const statusText = isSuspended ? '정지됨' : '활성';
            const statusClass = isSuspended ? 'status-suspended' : 'status-active';

            let actionControls = '';
            if (user.role === 'admin') {
                actionControls = '<span>(관리자)</span>';
            } else {
                actionControls = `
                    <div class="action-group">
                        <button class="suspend-toggle-btn ${buttonActionClass}" data-user-id="${user.id}">${suspendButtonText}</button>
                    </div>
                    <div class="action-group">
                        <input type="number" class="score-input" value="${user.score}" placeholder="점수" style="width: 60px;"/>
                        <button class="adjust-score-btn" data-user-id="${user.id}">점수 조정</button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.userId)}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td><span class="rank rank-${(user.rank || '').toLowerCase()}">${escapeHTML(user.rank)}</span></td>
                <td>${user.score}</td>
                <td>${user.postCount}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${actionControls}</td>
            `;
            usersTableBody.appendChild(tr);
        });
    };

    const handleTableClick = async (e) => {
        const target = e.target;
        const userId = target.dataset.userId;

        if (target.classList.contains('suspend-toggle-btn')) {
            if (!confirm(`정말로 이 사용자의 상태를 변경하시겠습니까?`)) return;

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

    // --- Initial Load & Event Listeners ---
    if (!token) {
        alert('로그인이 필요합니다. 메인 페이지로 이동합니다.');
        window.location.href = '/';
    } else {
        fetchAndRenderUsers();
        usersTableBody.addEventListener('click', handleTableClick);
    }
});
