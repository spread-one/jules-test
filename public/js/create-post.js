document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById('create-post-form');
    const createTitleInput = document.getElementById('create-title');
    const createContentInput = document.getElementById('create-content');
    const attachmentInput = document.getElementById('create-attachment');
    const imagePreviewContainer = document.getElementById('image-preview');

    const postsApiUrl = '/api/posts';
    const token = localStorage.getItem('jwt_token');

    // Get boardId from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');

    if (!boardId) {
        alert('잘못된 접근입니다. 게시판으로 돌아갑니다.');
        window.location.href = '/';
        return;
    }

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    function fetchWithAuth(url, options = {}) {
        const headers = { ...options.headers };
        if (!options.body || !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers });
    }

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = createTitleInput.value.trim();
        const content = createContentInput.value.trim();
        const attachmentFile = attachmentInput.files[0];

        if (!title || !content) {
            return alert('제목과 내용을 모두 입력해주세요.');
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('boardId', boardId);
        if (attachmentFile) {
            formData.append('attachment', attachmentFile);
        }

        try {
            const response = await fetchWithAuth(postsApiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '게시물 생성에 실패했습니다.');
            }

            alert('게시물이 성공적으로 등록되었습니다.');
            // Set the next action in localStorage and redirect to the main page
            localStorage.setItem('nextAction', JSON.stringify({ view: 'board', boardId: boardId }));
            window.location.href = '/';

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    attachmentInput.addEventListener('change', () => {
        const file = attachmentInput.files[0];
        imagePreviewContainer.innerHTML = '';
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreviewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
});
