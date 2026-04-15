document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = 'https://be-datn-6gb6.onrender.com/api/profile';
    
    // Get current user ID from localStorage
    let userStr = localStorage.getItem("user");
    let currentUserId = 1;
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            if (userObj && userObj.id) {
                currentUserId = userObj.id;
            }
        } catch(e) {}
    }

    // Load leaderboard data
    async function loadLeaderboard() {
        try {
            const response = await fetch(`${API_BASE}/leaderboard`);
            const data = await response.json();

            if (data.success) {
                renderPodium(data.leaderboard);
                renderTable(data.leaderboard);
            } else {
                console.error('Failed to load leaderboard:', data.message);
            }
        } catch (err) {
            console.error('loadLeaderboard error:', err);
        }
    }

    // Render top 3 podium
    function renderPodium(leaderboard) {
        const podiumContainer = document.getElementById('podiumContainer');
        if (!podiumContainer) return;

        // Get top 3 users
        const top3 = leaderboard.slice(0, 3);
        
        // Order: 2nd, 1st, 3rd for podium layout
        const podiumOrder = [top3[1], top3[0], top3[2]].filter(u => u);
        
        if (podiumOrder.length === 0) {
            podiumContainer.innerHTML = '<p class="no-data">Chưa có dữ liệu xếp hạng</p>';
            return;
        }

        const podiumHTML = podiumOrder.map((user, index) => {
            const rank = user.rank;
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : 'rank-3';
            const badgeClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
            const crown = rank === 1 ? `
                <div class="crown">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                    </svg>
                </div>
            ` : '';

            // Get title class for styling
            const titleClass = getTitleClass(user.title);

            return `
                <div class="podium-card ${rankClass}">
                    ${crown}
                    <div class="rank-badge ${badgeClass}">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        <span>${rank}</span>
                    </div>
                    <img src="${user.AvatarUrl}" alt="${user.FullName}" class="podium-avatar">
                    <h3 class="podium-name">${user.FullName}</h3>
                    <div class="podium-title title-badge ${titleClass}">${user.title}</div>
                    <div class="podium-score">${user.score.toLocaleString()} điểm</div>
                    <div class="podium-stats">
                        <span class="stat-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 11 12 14 22 4"/>
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                            </svg>
                            ${user.solved_problems} bài
                        </span>
                        <span class="stat-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                            ${user.completed_courses} khóa
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        podiumContainer.innerHTML = podiumHTML;
    }

    // Render leaderboard table
    function renderTable(leaderboard) {
        const tableBody = document.getElementById('rankingTableBody');
        if (!tableBody) return;

        if (leaderboard.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Chưa có dữ liệu xếp hạng</td></tr>';
            return;
        }

        // Skip top 3 in table (already shown in podium)
        const tableData = leaderboard.slice(3);

        const tableHTML = tableData.map(user => {
            const isCurrentUser = user.UserID === currentUserId;
            const rowClass = isCurrentUser ? 'rank-row current-user' : 'rank-row';
            const titleClass = getTitleClass(user.title);

            return `
                <tr class="${rowClass}">
                    <td class="rank-cell">
                        <span class="rank-number">${user.rank}</span>
                    </td>
                    <td class="user-cell">
                        <img src="${user.AvatarUrl}" alt="${user.FullName}" class="user-avatar">
                        <div class="user-info">
                            <span class="user-name">${user.FullName}</span>
                        </div>
                    </td>
                    <td class="title-cell">
                        <span class="title-badge ${titleClass}">${user.title}</span>
                    </td>
                    <td class="score-cell">
                        <span class="score">${user.score.toLocaleString()}</span>
                    </td>
                    <td class="problems-cell">
                        <span class="problems">${user.solved_problems}</span>
                    </td>
                    <td class="courses-cell">
                        <span class="courses">${user.completed_courses}</span>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableHTML;
    }

    // Get title class for styling
    function getTitleClass(title) {
        if (title === 'Kim Cương') return 'title-diamond';
        if (title === 'Bạch Kim') return 'title-platinum';
        if (title === 'Vàng') return 'title-gold';
        if (title === 'Bạc') return 'title-silver';
        if (title === 'Đồng') return 'title-bronze';
        return '';
    }

    // Load leaderboard on page load
    loadLeaderboard();
});
