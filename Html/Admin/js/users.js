document.addEventListener('DOMContentLoaded', function() {
    loadUsers();

    // Search functionality
    document.getElementById('userSearch').addEventListener('input', function() {
        filterUsers(this.value);
    });

    // Add user button
    document.getElementById('btnAddUser').addEventListener('click', function() {
        openUserModal();
    });

    // Modal events
    document.getElementById('userModalCancel').addEventListener('click', closeUserModal);
    document.getElementById('userModalSave').addEventListener('click', saveUser);
});

async function loadUsers() {
    try {
        const response = await fetch('https://be-datn-6gb6.onrender.com/api/admin/users');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        alert('Error loading users. Backend /api/admin/users needed.');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        const status = typeof user.IsActive === 'boolean' ? (user.IsActive ? 'Active' : 'Inactive') : (parseInt(user.IsActive) ? 'Active' : 'Inactive');
        const joinedDate = new Date(user.CreatedAt).toLocaleDateString();

        const roleDisplay = typeof user.Role === 'number' ? reverseRoleMap[user.Role] || 'Unknown' : user.Role;
        row.innerHTML = `
            <td>${user.FullName}</td>
            <td>${user.Email}</td>
            <td>${roleDisplay}</td>
            <td><span class="status-${status.toLowerCase()}">${status}</span></td>
            <td>${joinedDate}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.UserID})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.UserID})">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function filterUsers(query) {
    const rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        const visible = name.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
        row.style.display = visible ? '' : 'none';
    });
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

    if (userId) {
        title.textContent = 'Edit User';
        loadUserForEdit(userId);
        if (passwordField) passwordField.required = false;
    } else {
        title.textContent = 'Add User';
        form.reset();
        if (passwordField) passwordField.required = true;
    }

    modal.style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const fullName = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const roleStr = document.getElementById('userRole').value;
    const statusStr = document.getElementById('userStatus').value;
    const password = document.getElementById('userPassword') ? document.getElementById('userPassword').value : '';

    if (!fullName || !email || !roleStr || !statusStr) {
        alert('Please fill all required fields.');
        return;
    }

    if (!userId && !password) {
        alert('Password required for new users.');
        return;
    }

    const roleId = roleMap[roleStr];
    const isActive = statusStr === 'active';

    const userData = {
        FullName: fullName,
        Email: email,
        RoleID: roleId,
        IsActive: isActive,
        Describe: document.getElementById('userDescribe') ? document.getElementById('userDescribe').value : ''
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
        alert(userId ? 'User updated!' : 'User created!');
    } catch (error) {
        console.error('Save error:', error);
        alert('Error saving user: ' + error.message);
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
        
        // Password remains empty for edit
    } catch (error) {
        console.error('Load user error:', error);
        alert('Error loading user data.');
        closeUserModal();
    }
}

async function deleteUser(userId) {
    if (confirm('Deactivate this user? (sets IsActive=false)')) {
        try {
            const response = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IsActive: false })
            });

            if (!response.ok) throw new Error('Delete failed');
            
            loadUsers();
            alert('User deactivated!');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deactivating user.');
        }
    }
}
