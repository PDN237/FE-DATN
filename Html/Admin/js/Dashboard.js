document.addEventListener("DOMContentLoaded", () => {
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

    // Chart instances
    let difficultyChart = null;

    // Initialize Difficulty Chart
    function initDifficultyChart(problemDifficulty) {
        const ctx = document.getElementById('difficultyChart').getContext('2d');
        
        const labels = problemDifficulty.map(d => d.difficulty || 'Unknown');
        const counts = problemDifficulty.map(d => d.count);
        const colors = ['#10b981', '#f59e0b', '#ef4444', '#64748b'];

        if (difficultyChart) {
            difficultyChart.destroy();
        }

        difficultyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 500
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                cutout: '65%'
            }
        });
    }

    async function loadDashboardStats() {
        try {
            const response = await fetch('https://be-datn-6gb6.onrender.com/api/admin/dashboard/stats', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard stats");
            }
            
            const data = await response.json();
            
            // 1. Render KPI Cards
            if (data.stats) {
                animateValue(document.getElementById("statUsers"), 0, data.stats.totalUsers || 0, 1000);
                animateValue(document.getElementById("statCourses"), 0, data.stats.totalCourses || 0, 1000);
                animateValue(document.getElementById("statProblems"), 0, data.stats.totalProblems || 0, 1000);
                animateValue(document.getElementById("statSubmissions"), 0, data.stats.totalSubmissions || 0, 1000);
                animateValue(document.getElementById("statActive7Days"), 0, data.stats.activeUsers7Days || 0, 1000);
                animateValue(document.getElementById("statActive30Days"), 0, data.stats.activeUsers30Days || 0, 1000);
                document.getElementById("activeUsers30Days").textContent = data.stats.activeUsers30Days || 0;
                document.getElementById("statSuccessRate").textContent = (data.stats.submissionSuccessRate || 0) + '%';
            }

            // 2. Render Charts
            if (data.problemDifficulty && data.problemDifficulty.length > 0) {
                initDifficultyChart(data.problemDifficulty);
            }

            // 3. Render Top Courses
            const topCoursesTable = document.getElementById("topCoursesTable");
            if (data.topCourses && data.topCourses.length > 0) {
                topCoursesTable.innerHTML = "";
                data.topCourses.forEach((course, index) => {
                    topCoursesTable.innerHTML += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, ${index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#e2e8f0'} 0%, ${index === 0 ? '#f59e0b' : index === 1 ? '#64748b' : index === 2 ? '#92400e' : '#cbd5e1'} 100%); color: ${index < 3 ? '#fff' : '#64748b'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">
                                        ${index + 1}
                                    </div>
                                    <div style="font-weight: 600; color: #1e293b;">${course.Title || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <span style="font-weight: 700; color: #5b7be8; font-size: 1.125rem;">${course.enrollmentCount || 0}</span>
                                <span style="color: #94a3b8; font-size: 0.875rem; margin-left: 0.25rem;">học viên</span>
                            </td>
                        </tr>
                    `;
                });
            } else {
                topCoursesTable.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 2rem;">Chưa có dữ liệu khóa học</td></tr>`;
            }

            // 4. Render Recent Users
            const usersTable = document.getElementById("recentUsersTable");
            if (data.recentUsers && data.recentUsers.length > 0) {
                usersTable.innerHTML = "";
                data.recentUsers.forEach(user => {
                    const date = new Date(user.CreatedAt).toLocaleDateString('vi-VN');
                    const initial = user.FullName ? user.FullName.charAt(0).toUpperCase() : 'U';
                    usersTable.innerHTML += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="width:36px; height:36px; border-radius:10px; background: linear-gradient(135deg, #5b7be8 0%, #4c63d2 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size: 0.875rem;">
                                        ${initial}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: #1e293b;">${user.FullName || 'No Name'}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="color: #64748b;">${user.Email}</td>
                            <td style="color: #64748b; font-size: 0.875rem;">${date}</td>
                        </tr>
                    `;
                });
            } else {
                usersTable.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8;">Chưa có học viên mới</td></tr>`;
            }

            // 5. Render Recent Submissions
            const subTable = document.getElementById("recentSubmissionsTable");
            if (data.recentSubmissions && data.recentSubmissions.length > 0) {
                subTable.innerHTML = "";
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

                    const displayName = sub.FullName && sub.FullName !== 'Unknown User' ? sub.FullName : (sub.Email || 'Unknown');

                    subTable.innerHTML += `
                        <tr>
                            <td>
                                <div style="font-weight: 600; color: #1e293b;">${displayName}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">${date}</div>
                            </td>
                            <td style="color: #334155; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${sub.ProblemTitle || 'Bài tập #N/A'}
                            </td>
                            <td>
                                <span class="status-badge ${badgeClass}">${badgeText}</span>
                            </td>
                        </tr>
                    `;
                });
            } else {
                subTable.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 2rem;">Chưa có lượt nộp bài nào</td></tr>`;
            }

        } catch (error) {
            console.error(error);
            document.getElementById("topCoursesTable").innerHTML = `<tr><td colspan="2" style="text-align: center; color: #ef4444;">Lỗi tải dữ liệu</td></tr>`;
            document.getElementById("recentUsersTable").innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Lỗi tải dữ liệu</td></tr>`;
            document.getElementById("recentSubmissionsTable").innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Lỗi tải dữ liệu</td></tr>`;
        }
    }

    // Initialize
    loadDashboardStats();
});
