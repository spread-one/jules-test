document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const signupForm = document.getElementById('signup-form');
    const nameInput = document.getElementById('signup-name');
    const userIdInput = document.getElementById('signup-userId');
    const passwordInput = document.getElementById('signup-password');
    const adminCheckbox = document.getElementById('signup-admin-checkbox');

    // Modal elements
    const modal = document.getElementById('admin-passkey-modal');
    const passkeyInput = document.getElementById('admin-passkey-input');
    const passkeySubmitBtn = document.getElementById('admin-passkey-submit');
    const closeButton = document.querySelector('.close-button');

    // --- Modal Logic ---
    const showModal = () => {
        modal.style.display = 'flex';
    };

    const hideModal = () => {
        modal.style.display = 'none';
        passkeyInput.value = ''; // Clear input on close
    };

    closeButton.addEventListener('click', hideModal);
    // Also hide modal if user clicks outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideModal();
        }
    });

    // --- Main Signup Logic ---

    // This function performs the actual fetch request for both user and admin
    const performSignup = async (isAdmin = false, adminPasskey = null) => {
        const name = nameInput.value.trim();
        const userId = userIdInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !userId || !password) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const body = { name, userId, password };
        if (isAdmin) {
            body.isAdmin = true;
            body.adminPasskey = adminPasskey;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
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
            // If admin signup fails, hide the modal so they can try again
            if (isAdmin) {
                hideModal();
            }
        }
    };

    // --- Event Listeners ---

    // The main form submission is now conditional
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // If admin checkbox is checked, show the modal to get the passkey
        // The actual submission will be handled by the modal's button
        if (adminCheckbox.checked) {
            showModal();
        } else {
            // If not an admin, proceed with normal signup
            await performSignup(false);
        }
    });

    // Handle the submission from the admin passkey modal
    passkeySubmitBtn.addEventListener('click', async () => {
        const passkey = passkeyInput.value.trim();
        if (!passkey) {
            alert('관리자 패스키를 입력해주세요.');
            return;
        }
        await performSignup(true, passkey);
    });

    // Uncheck the admin box if the modal is closed without submitting
    // This prevents a confusing state where the box is checked but no admin action is pending
    modal.addEventListener('transitionend', () => {
        if (modal.style.display === 'none') {
            adminCheckbox.checked = false;
        }
    });
});
