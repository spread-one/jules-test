document.addEventListener('DOMContentLoaded', () => {
    const chatList = document.getElementById('chat-list');

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

    async function fetchChatRooms() {
        try {
            const response = await fetchWithAuth('/api/chat/rooms');
            if (!response.ok) {
                throw new Error('채팅 목록을 불러오는 데 실패했습니다.');
            }
            const rooms = await response.json();
            renderChatRooms(rooms);
        } catch (error) {
            console.error(error);
            chatList.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function renderChatRooms(rooms) {
        chatList.innerHTML = '';
        if (rooms.length === 0) {
            chatList.innerHTML = '<p>진행중인 채팅이 없습니다.</p>';
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.classList.add('chat-item');
            roomElement.dataset.roomId = room.id;

            const lastMessageText = room.lastMessage ? escapeHTML(room.lastMessage.text) : '아직 메시지가 없습니다.';
            const lastMessageTime = room.lastMessage ? new Date(room.lastMessage.timestamp).toLocaleTimeString() : '';

            roomElement.innerHTML = `
                <div class="chat-item-user">
                    <strong>${escapeHTML(room.otherUser.name)}</strong>
                </div>
                <div class="chat-item-message">
                    <p>${lastMessageText}</p>
                </div>
                <div class="chat-item-timestamp">
                    <span>${lastMessageTime}</span>
                </div>
            `;
            chatList.appendChild(roomElement);
        });
    }

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    chatList.addEventListener('click', (event) => {
        const chatItem = event.target.closest('.chat-item');
        if (chatItem) {
            const chatRoomId = chatItem.dataset.roomId;
            window.location.href = `/chat/${chatRoomId}`;
        }
    });

    fetchChatRooms();
});
