document.addEventListener("DOMContentLoaded", () => {
    // Check local storage for auth token if your admin uses standard auth
    // const token = localStorage.getItem('authToken');
    
    // Function to animate counting numbers up from 0 to target
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

    async function loadDashboardStats() {
        try {
            // Note: Update to your exact API structure
            // If you use standard JWT admin token, pass it here
            const response = await fetch('https://be-datn-6gb6.onrender.com/api/admin/dashboard/stats', {
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` 
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard stats");
            }
            
            const data = await response.json();
            
            // 1. Render Stats Grid
            const statUsersObj = document.getElementById("statUsers");
            const statCoursesObj = document.getElementById("statCourses");
            const statProblemsObj = document.getElementById("statProblems");
            const statSubObj = document.getElementById("statSubmissions");

            if (data.stats) {
                animateValue(statUsersObj, 0, data.stats.totalUsers || 0, 1000);
                animateValue(statCoursesObj, 0, data.stats.totalCourses || 0, 1000);
                animateValue(statProblemsObj, 0, data.stats.totalProblems || 0, 1000);
                animateValue(statSubObj, 0, data.stats.totalSubmissions || 0, 1000);
            }

            // 2. Render Recent Users
            const usersTable = document.getElementById("recentUsersTable");
            if (data.recentUsers && data.recentUsers.length > 0) {
                usersTable.innerHTML = ""; // clear loading
                data.recentUsers.forEach(user => {
                    const date = new Date(user.CreatedAt).toLocaleDateString('vi-VN');
                    usersTable.innerHTML += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width:30px; height:30px; border-radius:50%; background:#22d3ee; color:#0f1f35; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                                        ${user.FullName ? user.FullName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    ${user.FullName || 'No Name'}
                                </div>
                            </td>
                            <td style="color: #9ca3af;">${user.Email}</td>
                            <td>${date}</td>
                        </tr>
                    `;
                });
            } else {
                usersTable.innerHTML = `<tr><td colspan="3" style="text-align: center;">Chưa có học viên mới</td></tr>`;
            }

            // 3. Render Recent Submissions
            const subTable = document.getElementById("recentSubmissionsTable");
            if (data.recentSubmissions && data.recentSubmissions.length > 0) {
                subTable.innerHTML = ""; // clear loading
                data.recentSubmissions.forEach(sub => {
                    const dateObj = new Date(sub.created_at);
                    const date = `${dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${dateObj.toLocaleDateString('vi-VN')}`;
                    
                    let badgeClass = 'pending';
                    let badgeText = sub.status;
                    if (sub.status === 'Accepted') {
                        badgeClass = 'accepted';
                    } else if (sub.status.includes('Wrong') || sub.status.includes('Error') || sub.status.includes('Fail')) {
                        badgeClass = 'wrong';
                        badgeText = 'Failed';
                    }

                    subTable.innerHTML += `
                        <tr>
                            <td>
                                <div>${sub.FullName || sub.Email || 'No Name'}</div>
                                <div style="font-size: 0.75rem; color: #6b7280;">${date}</div>
                            </td>
                            <td style="color: #e5e7eb; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${sub.ProblemTitle || 'Bài tập #N/A'}
                            </td>
                            <td>
                                <span class="status-badge ${badgeClass}">${badgeText}</span>
                            </td>
                        </tr>
                    `;
                });
            } else {
                subTable.innerHTML = `<tr><td colspan="3" style="text-align: center;">Chưa có lượt nộp bài nào</td></tr>`;
            }

        } catch (error) {
            console.error(error);
            document.getElementById("recentUsersTable").innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Lỗi tải dữ liệu</td></tr>`;
            document.getElementById("recentSubmissionsTable").innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Lỗi tải dữ liệu</td></tr>`;
        }
    }

    // Initialize
    loadDashboardStats();
});
