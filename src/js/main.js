document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api/posts';

    const postsList = document.getElementById('posts-list');

    const createForm = document.getElementById('create-post-form');
    const createTitleInput = document.getElementById('create-title');
    const createContentInput = document.getElementById('create-content');

    const editFormContainer = document.getElementById('edit-form-container');
    const createFormContainer = document.getElementById('create-form-container');
    const editForm = document.getElementById('edit-post-form');
    const editIdInput = document.getElementById('edit-post-id');
    const editTitleInput = document.getElementById('edit-title');
    const editContentInput = document.getElementById('edit-content');
    const cancelEditBtn = document.getElementById('cancel-edit');

    // --- Fetch and Render Posts ---
    const fetchPosts = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('게시물을 불러오는 데 실패했습니다.');
            }
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const renderPosts = (posts) => {
        postsList.innerHTML = '';
        if (posts.length === 0) {
            postsList.innerHTML = '<li>게시물이 없습니다.</li>';
            return;
        }
        posts.forEach(post => {
            const li = document.createElement('li');
            li.setAttribute('data-id', post.id);
            li.innerHTML = `
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.content)}</p>
                <div class="post-actions">
                    <button class="edit-btn">수정</button>
                    <button class="delete-btn">삭제</button>
                </div>
            `;
            postsList.appendChild(li);
        });
    };

    // --- Event Listeners ---

    // Create Post
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = createTitleInput.value.trim();
        const content = createContentInput.value.trim();

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) {
                throw new Error('게시물 생성에 실패했습니다.');
            }

            createTitleInput.value = '';
            createContentInput.value = '';
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    // Handle Edit and Delete clicks
    postsList.addEventListener('click', (e) => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;
        const postId = li.dataset.id;

        if (target.classList.contains('delete-btn')) {
            handleDelete(postId);
        } else if (target.classList.contains('edit-btn')) {
            const title = li.querySelector('h3').textContent;
            const content = li.querySelector('p').textContent;
            showEditForm(postId, title, content);
        }
    });

    const handleDelete = async (postId) => {
        if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${postId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('게시물 삭제에 실패했습니다.');
            }
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const showEditForm = (id, title, content) => {
        editIdInput.value = id;
        editTitleInput.value = title;
        editContentInput.value = content;
        createFormContainer.style.display = 'none';
        editFormContainer.style.display = 'block';
    };

    // Edit Post
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const title = editTitleInput.value.trim();
        const content = editContentInput.value.trim();

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            });
            if (!response.ok) {
                throw new Error('게시물 수정에 실패했습니다.');
            }
            hideEditForm();
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    const hideEditForm = () => {
        editFormContainer.style.display = 'none';
        createFormContainer.style.display = 'block';
    };

    cancelEditBtn.addEventListener('click', hideEditForm);

    // --- Utility ---
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // --- Initial Fetch ---
    fetchPosts();
});
