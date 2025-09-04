document.addEventListener('DOMContentLoaded', () => {
    // The 'io' object is available from the /socket.io/socket.io.js script
    const socket = io({
        auth: {
            token: localStorage.getItem('jwt_token')
        }
    });

    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageList = document.getElementById('message-list');

    const roomPath = window.location.pathname.split('/');
    const chatRoomId = roomPath[roomPath.length - 1];

    // Join the chat room
    socket.emit('joinRoom', { chatRoomId });

    // Listen for incoming messages
    socket.on('message', (message) => {
        appendMessage(message);
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

    function appendMessage({ text, user, timestamp, isMine }) {
        const msgElement = document.createElement('div');
        msgElement.classList.add('message', isMine ? 'sent' : 'received');

        const p = document.createElement('p');
        p.innerText = text;

        const span = document.createElement('span');
        span.classList.add('timestamp');
        span.innerText = new Date(timestamp).toLocaleTimeString();

        msgElement.appendChild(p);
        msgElement.appendChild(span);
        messageList.appendChild(msgElement);

        // Scroll to the bottom
        messageList.scrollTop = messageList.scrollHeight;
    }

    console.log(`Entered chat room: ${chatRoomId}`);
});
