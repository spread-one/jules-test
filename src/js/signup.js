document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const nameInput = document.getElementById('signup-name');
    const userIdInput = document.getElementById('signup-userId');
    const passwordInput = document.getElementById('signup-password');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const userId = userIdInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !userId || !password) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, userId, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Use the server's error message if available
                throw new Error(result.message || '회원가입에 실패했습니다.');
            }

            alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
            window.location.href = '/'; // Redirect to the login page (index.html)

        } catch (error) {
            console.error('Signup failed:', error);
            alert(error.message);
        }
    });
});
