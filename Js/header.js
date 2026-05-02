// Shared header logic for all pages
// Handles login state, role-based navigation, and avatar dropdown

class HeaderManager {
    constructor() {
        this.userId = localStorage.getItem('userId');
        this.userRole = localStorage.getItem('userRole');
        this.roleId = localStorage.getItem('roleId');
        
        // Also try to get roleId from the user object stored in localStorage
        try {
            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            if (userObj && userObj.roleId) {
                this.roleId = userObj.roleId;
            }
        } catch (e) {
            console.error('Error parsing user object:', e);
        }
        
        this.isLoggedIn = this.userId && this.userId !== 'null' && this.userId !== '';
        // Check for admin using both string role and numeric RoleID
        // RoleID = 1 is Admin in the database
        this.isAdmin = (this.userRole && this.userRole.toLowerCase() === 'admin') ||
                       (this.roleId && parseInt(this.roleId) === 1);
        this.API_BASE = 'https://be-datn-6gb6.onrender.com/api/profile';

        console.log('HeaderManager initialized:', {
            userId: this.userId,
            userRole: this.userRole,
            roleId: this.roleId,
            isLoggedIn: this.isLoggedIn,
            isAdmin: this.isAdmin
        });

        this.init();
    }

    init() {
        this.updateHeader();
        this.setupDropdown();
        this.loadUserAvatar();
    }

    updateHeader() {
        // Remove login link from navigation if it exists
        const loginLinks = document.querySelectorAll('a[href*="login.html"]');
        loginLinks.forEach(link => {
            if (link.classList.contains('nav-link')) {
                link.style.display = 'none';
            }
        });

        // Handle admin link visibility in navigation
        const adminLinks = document.querySelectorAll('a[href*="admin-dashboard.html"]');
        console.log('Admin links found:', adminLinks.length);
        console.log('Is admin:', this.isAdmin);
        console.log('User role:', this.userRole);
        
        adminLinks.forEach(link => {
            console.log('Admin link classes:', link.classList.toString());
            if (link.classList.contains('nav-link')) {
                if (this.isAdmin) {
                    link.style.display = 'flex';
                    link.classList.add('admin-visible');
                } else {
                    link.style.display = 'none';
                    link.classList.remove('admin-visible');
                }
            }
        });

        // Handle profile/avatar display based on login state
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const profileDropdown = document.querySelector('.profile-dropdown');
        const loginButton = headerActions.querySelector('a[href*="login.html"]:not(.nav-link)');
        const dropdownMenu = document.getElementById('dropdownMenu');

        // Always show profile dropdown
        if (profileDropdown) {
            profileDropdown.style.display = 'block';
        }

        // Hide login button if it exists (we'll use dropdown instead)
        if (loginButton) {
            loginButton.style.display = 'none';
        }

        // Update dropdown menu content based on login state
        this.updateDropdownMenu(dropdownMenu);
    }

    updateDropdownMenu(dropdownMenu) {
        if (!dropdownMenu) return;

        // Clear existing menu items
        dropdownMenu.innerHTML = '';

        if (this.isLoggedIn) {
            // Show profile info link
            dropdownMenu.innerHTML += `
                <a href="/FrondEnd/Html/profile/profile.html" class="dropdown-item" id="infoMenuItem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
                    </svg>
                    Thông tin
                </a>
            `;

            // Show leaderboard link
            dropdownMenu.innerHTML += `
                <a href="/FrondEnd/Html/Board/board.html" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 6l2 2-4 4 4 4-2 2-6-6z"/>
                        <rect x="3" y="14" width="4" height="6"/>
                        <rect x="10" y="8" width="4" height="12"/>
                        <rect x="17" y="11" width="4" height="9"/>
                    </svg>
                    Bảng xếp hạng
                </a>
            `;

            // Show admin link if user is admin
            if (this.isAdmin) {
                dropdownMenu.innerHTML += `
                    <a href="/FrondEnd/Html/Admin/admin-dashboard.html" class="dropdown-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4l-2.1.7.3 2.2-2 1.2-1.6-1.5-2.1.9-.4 2.2h-2.2l-.4-2.2-2.1-.9-1.6 1.5-2-1.2.3-2.2L20 12z"/>
                        </svg>
                        Trang quản trị
                    </a>
                `;
            }

            // Show logout link
            dropdownMenu.innerHTML += `
                <a href="#" class="dropdown-item logout" id="logoutBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Đăng xuất
                </a>
            `;

            // Attach logout handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        } else {
            // Show login link when not logged in
            dropdownMenu.innerHTML += `
                <a href="/FrondEnd/Html/Login/login.html" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                    Đăng nhập
                </a>
            `;
        }
    }

    logout() {
        // Clear all localStorage items
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('roleId');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        
        // Redirect to login page using absolute path from server root
        window.location.href = '/FrondEnd/Html/Login/login.html';
    }

    createLoginButton(headerActions) {
        const loginBtn = document.createElement('a');
        loginBtn.href = '/FrondEnd/Html/Login/login.html';
        loginBtn.className = 'btn-login';
        loginBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            <span>Đăng nhập</span>
        `;
        loginBtn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            border-radius: 10px;
            transition: all 0.3s ease;
        `;
        loginBtn.addEventListener('mouseenter', () => {
            loginBtn.style.transform = 'translateY(-2px)';
            loginBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        });
        loginBtn.addEventListener('mouseleave', () => {
            loginBtn.style.transform = 'translateY(0)';
            loginBtn.style.boxShadow = 'none';
        });

        // Insert after theme toggle
        const themeToggle = headerActions.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.insertAdjacentElement('afterend', loginBtn);
        } else {
            headerActions.appendChild(loginBtn);
        }
    }

    setupDropdown() {
        const profileBtn = document.getElementById('profileBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (!profileBtn || !dropdownMenu) return;

        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    async loadUserAvatar() {
        if (!this.isLoggedIn) return;

        try {
            const response = await fetch(`${this.API_BASE}/avatar?userId=${this.userId}`);
            const data = await response.json();
            
            if (data.success && data.avatarUrl) {
                const headerAvatar = document.getElementById('headerAvatar');
                if (headerAvatar) {
                    headerAvatar.src = data.avatarUrl;
                }
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
        }
    }
}

// Initialize header when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.headerManager === 'undefined') {
        window.headerManager = new HeaderManager();
    }
});

// Also handle case where script loads after DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof window.headerManager === 'undefined') {
        window.headerManager = new HeaderManager();
    }
}
