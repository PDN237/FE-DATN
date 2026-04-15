// Avatar selection and management
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = 'https://be-datn-6gb6.onrender.com/api/profile';
    let currentUserId = 1;
    let availableAvatars = [];
    let selectedAvatarUrl = null;

    // Get user ID from localStorage
    let userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            if (userObj && userObj.id) {
                currentUserId = userObj.id;
            }
        } catch(e) {}
    }

    // DOM elements
    const avatarModal = document.getElementById('avatarSelectionModal');
    const avatarGrid = document.getElementById('avatarGrid');
    const closeAvatarModal = document.getElementById('closeAvatarModal');
    const cancelAvatarSelection = document.getElementById('cancelAvatarSelection');
    const confirmAvatarSelection = document.getElementById('confirmAvatarSelection');
    const avatarPreview = document.getElementById('avatarPreview');
    const headerAvatar = document.getElementById('headerAvatar');

    // Open avatar selection modal
    window.openAvatarSelection = function() {
        avatarModal.classList.add('active');
        loadAvailableAvatars();
    };

    // Close avatar selection modal
    function closeAvatarModalFn() {
        avatarModal.classList.remove('active');
        selectedAvatarUrl = null;
    }

    // Load available avatars from backend
    async function loadAvailableAvatars() {
        avatarGrid.innerHTML = `
            <div class="avatar-loading">
                <div class="pf-spinner"></div>
                <span>Đang tải avatar...</span>
            </div>
        `;

        try {
            const response = await fetch(`${API_BASE}/avatar/available`);
            const data = await response.json();

            if (data.success) {
                availableAvatars = data.avatars;
                renderAvatarGrid();
            } else {
                avatarGrid.innerHTML = '<p class="pf-empty">Lỗi tải avatar: ' + data.message + '</p>';
            }
        } catch (err) {
            console.error('loadAvailableAvatars error:', err);
            avatarGrid.innerHTML = '<p class="pf-empty">Không thể kết nối đến máy chủ.</p>';
        }
    }

    // Render avatar grid
    function renderAvatarGrid() {
        if (availableAvatars.length === 0) {
            avatarGrid.innerHTML = '<p class="pf-empty">Không có avatar nào.</p>';
            return;
        }

        avatarGrid.innerHTML = availableAvatars.map(avatar => `
            <div class="avatar-item ${selectedAvatarUrl === avatar.url ? 'avatar-item--selected' : ''}" 
                 data-url="${avatar.url}" 
                 data-seed="${avatar.seed}"
                 onclick="selectAvatar('${avatar.url}')">
                <img src="${avatar.url}" alt="Avatar ${avatar.seed}" loading="lazy" />
                <div class="avatar-item-overlay">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
        `).join('');
    }

    // Select avatar
    window.selectAvatar = function(url) {
        selectedAvatarUrl = url;
        
        // Update visual selection
        document.querySelectorAll('.avatar-item').forEach(item => {
            item.classList.remove('avatar-item--selected');
            if (item.dataset.url === url) {
                item.classList.add('avatar-item--selected');
            }
        });

        // Enable confirm button
        confirmAvatarSelection.disabled = false;
    };

    // Confirm avatar selection and update user avatar
    confirmAvatarSelection.addEventListener('click', async () => {
        if (!selectedAvatarUrl) return;

        const oldHTML = confirmAvatarSelection.innerHTML;
        confirmAvatarSelection.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;animation:pfSpin 0.7s linear infinite"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28 8"/></svg> Đang cập nhật...';
        confirmAvatarSelection.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/avatar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId,
                    avatarUrl: selectedAvatarUrl
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update avatar previews on the page
                if (avatarPreview) avatarPreview.src = selectedAvatarUrl;
                if (headerAvatar) headerAvatar.src = selectedAvatarUrl;
                
                // Show success message
                showToast('✅ Cập nhật avatar thành công!', 'success');
                closeAvatarModalFn();
            } else {
                showToast('❌ Cập nhật thất bại: ' + data.message, 'error');
            }
        } catch (err) {
            console.error('updateAvatar error:', err);
            showToast('❌ Đã xảy ra lỗi khi cập nhật avatar!', 'error');
        } finally {
            confirmAvatarSelection.innerHTML = oldHTML;
            confirmAvatarSelection.disabled = false;
        }
    });

    // Close modal handlers
    closeAvatarModal.addEventListener('click', closeAvatarModalFn);
    cancelAvatarSelection.addEventListener('click', closeAvatarModalFn);

    // Close modal on backdrop click
    avatarModal.addEventListener('click', (e) => {
        if (e.target === avatarModal) closeAvatarModalFn();
    });

    // Toast notification helper
    function showToast(msg, type = 'success') {
        const toast = document.getElementById('toastNotif');
        if (!toast) { alert(msg); return; }
        toast.textContent = msg;
        toast.className = 'pf-toast ' + type + ' show';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.className = 'pf-toast'; }, 3200);
    }

    // Initialize - disable confirm button initially
    if (confirmAvatarSelection) {
        confirmAvatarSelection.disabled = true;
    }
});
