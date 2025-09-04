document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageList = document.getElementById('message-list');

    const roomPath = window.location.pathname.split('/');
    const chatRoomId = roomPath[roomPath.length - 1];

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

    async function fetchHistoryAndUser() {
        try {
            // Fetch current user and message history in parallel
            const [userRes, historyRes] = await Promise.all([
                fetchWithAuth('/api/auth/me'),
                fetchWithAuth(`/api/chat/rooms/${chatRoomId}/messages`)
            ]);

            if (!userRes.ok || !historyRes.ok) {
                throw new Error('Failed to load chat room data.');
            }

            const user = await userRes.json();
            currentUserId = user.id;

            const history = await historyRes.json();
            messageList.innerHTML = ''; // Clear any placeholders
            history.forEach(message => {
                appendMessage(message, currentUserId === message.user.id);
            });

            // Scroll to the bottom after rendering history
            messageList.scrollTop = messageList.scrollHeight;

        } catch (error) {
            console.error(error);
            messageList.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // The 'io' object is available from the /socket.io/socket.io.js script
    const socket = io({
        auth: {
            token: localStorage.getItem('jwt_token')
        }
    });

    // Join the chat room
    socket.emit('joinRoom', { chatRoomId });

    // Listen for incoming messages
    socket.on('message', (message) => {
        // For live messages, the server provides the isMine flag
        appendMessage(message, message.isMine);
    });

    // Handle form submission
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgText = messageInput.value;
        if (msgText.trim() === '') return;

        // Send message to server
        socket.emit('chatMessage', { chatRoomId, text: msgText });

        // Clear input and focus
        messageInput.value = '';
        messageInput.focus();
    });

    function appendMessage(message, isMine) {
        const { text, user, timestamp } = message;
        const msgElement = document.createElement('div');
        msgElement.classList.add('message', isMine ? 'sent' : 'received');

        const p = document.createElement('p');
        p.innerText = text;

        const span = document.createElement('span');
        span.classList.add('timestamp');
        span.innerText = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgElement.appendChild(p);
        msgElement.appendChild(span);
        messageList.appendChild(msgElement);

        // Scroll to the bottom
        messageList.scrollTop = messageList.scrollHeight;
    }

    console.log(`Entered chat room: ${chatRoomId}`);
    fetchHistoryAndUser();
});
