document.addEventListener('DOMContentLoaded', function() {
    loadUsers();

    // Search functionality
    document.getElementById('userSearch').addEventListener('input', function() {
        filterUsers();
    });

    // Filter functionality
    document.getElementById('roleFilter').addEventListener('change', function() {
        filterUsers();
    });

    document.getElementById('statusFilter').addEventListener('change', function() {
        filterUsers();
    });

    // Add user button
    document.getElementById('btnAddUser').addEventListener('click', function() {
        openUserModal();
    });

    // Modal events
    document.getElementById('userModalCancel').addEventListener('click', closeUserModal);
    document.getElementById('userModalClose').addEventListener('click', closeUserModal);
    document.getElementById('userModalSave').addEventListener('click', saveUser);

    // Close modal on overlay click
    document.getElementById('userModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeUserModal();
        }
    });
});

let allUsers = [];

async function loadUsers() {
    try {
        const response = await fetch('https://be-datn-6gb6.onrender.com/api/admin/users');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const users = await response.json();
        allUsers = users;
        displayUsers(users);
        updateStats(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #ef4444; padding: 3rem;">
                    <i class="fas fa-exclamation-circle" style="margin-right: 0.5rem;"></i> Lỗi tải dữ liệu
                </td>
            </tr>
        `;
    }
}

function updateStats(users) {
    const total = users.length;
    const active = users.filter(u => u.IsActive === true || u.IsActive === 'true' || parseInt(u.IsActive) === 1).length;
    const inactive = total - active;
    const admin = users.filter(u => u.Role === 1 || u.Role === 'admin').length;

    animateValue(document.getElementById('totalUsers'), 0, total, 1000);
    animateValue(document.getElementById('activeUsers'), 0, active, 1000);
    animateValue(document.getElementById('inactiveUsers'), 0, inactive, 1000);
    animateValue(document.getElementById('adminCount'), 0, admin, 1000);
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #6b7280; padding: 3rem;">
                    <i class="fas fa-users" style="margin-right: 0.5rem;"></i> Không có người dùng nào
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');

        const isActive = user.IsActive === true || user.IsActive === 'true' || parseInt(user.IsActive) === 1;
        const status = isActive ? 'active' : 'inactive';
        const statusText = isActive ? 'Đang hoạt động' : 'Ngưng hoạt động';
        
        const joinedDate = new Date(user.CreatedAt).toLocaleDateString('vi-VN');

        const roleDisplay = typeof user.Role === 'number' ? reverseRoleMap[user.Role] || 'student' : (user.Role || 'student').toLowerCase();
        const initial = user.FullName ? user.FullName.charAt(0).toUpperCase() : 'U';

        row.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-avatar">${initial}</div>
                    <div class="user-info">
                        <span class="user-name">${user.FullName || 'Unknown'}</span>
                        <span class="user-email">${user.Email || ''}</span>
                    </div>
                </div>
            </td>
            <td>${user.Email || ''}</td>
            <td><span class="role-badge ${roleDisplay}">${roleDisplay}</span></td>
            <td>${user.score || 0}</td>
            <td>${user.title || '-'}</td>
            <td><span class="status-badge ${status}">${statusText}</span></td>
            <td>${joinedDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${user.UserID})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteUser(${user.UserID})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function filterUsers() {
    const searchQuery = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();

    const filtered = allUsers.filter(user => {
        const matchesSearch = (user.FullName || '').toLowerCase().includes(searchQuery) || 
                              (user.Email || '').toLowerCase().includes(searchQuery);
        
        const userRole = typeof user.Role === 'number' ? reverseRoleMap[user.Role] || 'student' : (user.Role || 'student').toLowerCase();
        const matchesRole = !roleFilter || userRole === roleFilter;

        const isActive = user.IsActive === true || user.IsActive === 'true' || parseInt(user.IsActive) === 1;
        const userStatus = isActive ? 'active' : 'inactive';
        const matchesStatus = !statusFilter || userStatus === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    displayUsers(filtered);
}

const roleMap = {
    'admin': 1,
    'instructor': 4,
    'student': 3
};
const reverseRoleMap = {
    1: 'admin',
    4: 'instructor',
    3: 'student'
};

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    const passwordField = document.getElementById('userPassword');
    const passwordHint = document.getElementById('passwordHint');

    if (userId) {
        title.innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
        loadUserForEdit(userId);
        if (passwordField) passwordField.required = false;
        if (passwordHint) passwordHint.textContent = 'Bỏ trống nếu không đổi';
    } else {
        title.innerHTML = '<i class="fas fa-user-plus"></i> Add User';
        form.reset();
        if (passwordField) passwordField.required = true;
        if (passwordHint) passwordHint.textContent = 'Bắt buộc cho người dùng mới';
    }

    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const fullName = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const roleStr = document.getElementById('userRole').value;
    const statusStr = document.getElementById('userStatus').value;
    const password = document.getElementById('userPassword') ? document.getElementById('userPassword').value : '';

    if (!fullName || !email || !roleStr || !statusStr) {
        alert('Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
    }

    if (!userId && !password) {
        alert('Mật khẩu bắt buộc cho người dùng mới.');
        return;
    }

    const roleId = roleMap[roleStr];
    const isActive = statusStr === 'active';

    const userData = {
        FullName: fullName,
        Email: email,
        RoleID: roleId,
        IsActive: isActive,
        Describe: document.getElementById('userDescribe') ? document.getElementById('userDescribe').value : '',
        score: parseInt(document.getElementById('userScore')?.value) || 0,
        title: document.getElementById('userTitle')?.value || ''
    };

    if (password) userData.PassWord = password;
    if (userId) userData.UserID = parseInt(userId);

    const method = userId ? 'PUT' : 'POST';
    const url = userId ? `https://be-datn-6gb6.onrender.com/api/admin/users/${userId}` : 'https://be-datn-6gb6.onrender.com/api/admin/users';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || `HTTP ${response.status}`);
        }

        closeUserModal();
        loadUsers();
        alert(userId ? 'Cập nhật người dùng thành công!' : 'Tạo người dùng thành công!');
    } catch (error) {
        console.error('Save error:', error);
        alert('Lỗi lưu người dùng: ' + error.message);
    }
}

async function editUser(userId) {
    openUserModal(userId);
}

async function loadUserForEdit(userId) {
    try {
        const response = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/users/${userId}`);
        if (!response.ok) throw new Error('User not found');
        const user = await response.json();

        document.getElementById('userId').value = user.UserID;
        document.getElementById('userName').value = user.FullName;
        document.getElementById('userEmail').value = user.Email;
        
        const roleStr = reverseRoleMap[user.Role] || 'student';
        document.getElementById('userRole').value = roleStr;
        
        const statusStr = user.IsActive ? 'active' : 'inactive';
        document.getElementById('userStatus').value = statusStr;
        
        // Load describe/bio
        if (document.getElementById('userDescribe')) {
            document.getElementById('userDescribe').value = user.Describe || '';
        }
        // Load score and title
        if (document.getElementById('userScore')) {
            document.getElementById('userScore').value = user.score || 0;
        }
        if (document.getElementById('userTitle')) {
            document.getElementById('userTitle').value = user.title || '';
        }
        
        // Password remains empty for edit
    } catch (error) {
        console.error('Load user error:', error);
        alert('Lỗi tải dữ liệu người dùng.');
        closeUserModal();
    }
}

async function deleteUser(userId) {
    if (confirm('Bạn có chắc muốn ngưng hoạt động người dùng này? (sets IsActive=false)')) {
        try {
            const response = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IsActive: false })
            });

            if (!response.ok) throw new Error('Delete failed');
            
            loadUsers();
            alert('Đã ngưng hoạt động người dùng!');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Lỗi ngưng hoạt động người dùng.');
        }
    }
}
