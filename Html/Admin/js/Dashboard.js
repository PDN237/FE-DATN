// Check local storage for auth token if your admin uses standard auth
// const token = localStorage.getItem('authToken');

// Chart instances
let difficultyChart = null;
let submissionChart = null;

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

// Initialize Difficulty Chart
function initDifficultyChart(data) {
    const ctx = document.getElementById('difficultyChart').getContext('2d');
    
    if (difficultyChart) {
        difficultyChart.destroy();
    }

    const labels = data.map(d => d.difficulty || 'Unknown');
    const values = data.map(d => d.count);
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

    difficultyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng bài tập',
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length).map(c => c),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 31, 53, 0.9)',
                    titleColor: '#22d3ee',
                    bodyColor: '#e5e7eb',
                    borderColor: 'rgba(34, 211, 238, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(34, 211, 238, 0.1)',
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Initialize Submission Chart
function initSubmissionChart(data) {
    const ctx = document.getElementById('submissionChart').getContext('2d');
    
    if (submissionChart) {
        submissionChart.destroy();
    }

    const labels = data.map(d => d.status || 'Unknown');
    const values = data.map(d => d.count);
    const colors = {
        'Accepted': '#10b981',
        'Wrong Answer': '#ef4444',
        'Time Limit Exceeded': '#f59e0b',
        'Runtime Error': '#8b5cf6',
        'Compilation Error': '#3b82f6',
        'default': '#6b7280'
    };

    const backgroundColors = labels.map(label => colors[label] || colors['default']);

    submissionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(15, 31, 53, 0.9)',
                borderWidth: 3,
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
                        color: '#e5e7eb',
                        font: {
                            size: 11,
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 31, 53, 0.9)',
                    titleColor: '#22d3ee',
                    bodyColor: '#e5e7eb',
                    borderColor: 'rgba(34, 211, 238, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                }
            }
        }
    });
}

// Render Top Courses
function renderTopCourses(courses) {
    const container = document.getElementById('topCoursesList');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="loading-state">Chưa có dữ liệu</div>';
        return;
    }

    container.innerHTML = courses.map((course, index) => {
        const levelClass = course.level?.toLowerCase() || 'basic';
        const levelBadge = levelClass.includes('cơ bản') ? 'basic' : 
                          levelClass.includes('trung cấp') ? 'intermediate' : 
                          levelClass.includes('nâng cao') ? 'advanced' : 'basic';
        const levelText = course.level || 'Cơ bản';

        return `
            <div class="course-item">
                <div style="font-size: 1.5rem; font-weight: 800; color: rgba(34, 211, 238, 0.3); width: 30px; text-align: center;">
                    ${index + 1}
                </div>
                <img src="${course.thumbnail || 'https://via.placeholder.com/50'}" alt="${course.title}" class="course-thumb">
                <div class="course-info">
                    <div class="course-title">${course.title}</div>
                    <div class="course-meta">
                        <span class="level-badge ${levelBadge}">${levelText}</span>
                    </div>
                </div>
                <div class="course-stat">
                    <div class="course-stat-value">${course.enrollmentCount}</div>
                    <div class="course-stat-label">Học viên</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Completion Rates
function renderCompletionRates(completions) {
    const container = document.getElementById('completionList');
    
    if (!completions || completions.length === 0) {
        container.innerHTML = '<div class="loading-state">Chưa có dữ liệu</div>';
        return;
    }

    container.innerHTML = completions.map(course => {
        const rate = parseFloat(course.completionRate) || 0;
        const progressBarColor = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';

        return `
            <div class="completion-item">
                <div class="course-info" style="flex: 1;">
                    <div class="course-title">${course.title}</div>
                    <div class="course-meta">
                        <span>${course.enrolledCount} đăng ký</span>
                        <span>•</span>
                        <span>${course.completedCount} hoàn thành</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${rate}%; background: ${progressBarColor};"></div>
                    </div>
                </div>
                <div class="course-stat">
                    <div class="course-stat-value" style="color: ${progressBarColor};">${rate}%</div>
                    <div class="course-stat-label">Hoàn thành</div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadDashboardStats() {
    try {
        const response = await fetch('https://be-datn-6gb6.onrender.com/api/admin/dashboard/stats', {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error("Failed to fetch dashboard stats");
        }
        
        const data = await response.json();
        
        // 1. Render Stats Grid
        const statUsersObj = document.getElementById("statUsers");
        const statCoursesObj = document.getElementById("statCourses");
        const statProblemsObj = document.getElementById("statProblems");
        const statSubmissionsObj = document.getElementById("statSubmissions");
        const statActiveUsersObj = document.getElementById("statActiveUsers");
        const statEnrollmentsObj = document.getElementById("statEnrollments");
        const statCompletionRateObj = document.getElementById("statCompletionRate");
        const statAcceptanceRateObj = document.getElementById("statAcceptanceRate");

        if (data.stats) {
            animateValue(statUsersObj, 0, data.stats.totalUsers || 0, 1000);
            animateValue(statCoursesObj, 0, data.stats.totalCourses || 0, 1000);
            animateValue(statProblemsObj, 0, data.stats.totalProblems || 0, 1000);
            animateValue(statSubmissionsObj, 0, data.stats.totalSubmissions || 0, 1000);
            animateValue(statActiveUsersObj, 0, data.stats.activeUsers || 0, 1000);
            animateValue(statEnrollmentsObj, 0, data.stats.totalEnrollments || 0, 1000);
            
            setTimeout(() => {
                statCompletionRateObj.textContent = (data.stats.completionRate || 0) + '%';
                statAcceptanceRateObj.textContent = (data.stats.acceptanceRate || 0) + '%';
            }, 500);
        }

        // 2. Render Charts
        if (data.problemDifficulty) {
            initDifficultyChart(data.problemDifficulty);
        }

        if (data.submissionStats) {
            initSubmissionChart(data.submissionStats);
        }

        // 3. Render Top Courses
        if (data.topCourses) {
            renderTopCourses(data.topCourses);
        }

        // 4. Render Completion Rates
        if (data.courseCompletions) {
            renderCompletionRates(data.courseCompletions);
        }

        // 5. Render Recent Users
        const usersTable = document.getElementById("recentUsersTable");
        if (data.recentUsers && data.recentUsers.length > 0) {
            usersTable.innerHTML = "";
            data.recentUsers.forEach(user => {
                const date = new Date(user.CreatedAt).toLocaleDateString('vi-VN');
                usersTable.innerHTML += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%); color:#0f1f35; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.875rem;">
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

        // 6. Render Recent Submissions
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
                } else if (sub.status === 'Running') {
                    badgeClass = 'running';
                }

                subTable.innerHTML += `
                    <tr>
                        <td>
                            <div>${sub.FullName || sub.Email || 'No Name'}</div>
                            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${date}</div>
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
        document.getElementById("topCoursesList").innerHTML = `<div class="loading-state" style="color: #ef4444;">Lỗi tải dữ liệu</div>`;
        document.getElementById("completionList").innerHTML = `<div class="loading-state" style="color: #ef4444;">Lỗi tải dữ liệu</div>`;
    }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardStats();
});
