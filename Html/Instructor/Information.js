let instructorData = null;

// Get instructor ID from URL
function getInstructorIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Fetch instructor data from API
async function fetchInstructorData() {
    const instructorId = getInstructorIdFromUrl();
    
    if (!instructorId) {
        showError('Không tìm thấy ID giảng viên');
        return;
    }

    try {
        const response = await fetch(`https://be-datn-6gb6.onrender.com/api/information/${instructorId}`);
        const result = await response.json();

        if (result.success) {
            instructorData = result.data;
            displayInstructorInfo();
            displayCourses();
        } else {
            showError(result.message || 'Không thể tải thông tin giảng viên');
        }
    } catch (error) {
        console.error('Error fetching instructor data:', error);
        showError('Lỗi kết nối đến server');
    }
}

// Display instructor information
function displayInstructorInfo() {
    if (!instructorData) return;

    const instructor = instructorData.instructor;
    const stats = instructorData.stats;

    // Update instructor avatar
    const avatarImg = document.getElementById('instructorAvatar');
    if (instructor.AvatarUrl && instructor.AvatarUrl !== 'default-avatar.png') {
        avatarImg.src = instructor.AvatarUrl;
    } else {
        avatarImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.FullName}`;
    }

    // Update instructor name
    document.getElementById('instructorName').textContent = instructor.FullName;
    
    // Update instructor email
    document.getElementById('instructorEmail').textContent = instructor.Email;

    // Update stats
    document.getElementById('totalCourses').textContent = stats.totalCourses;
    document.getElementById('publishedCourses').textContent = stats.publishedCourses;

    // Update member since date
    if (instructor.CreatedAt) {
        const date = new Date(instructor.CreatedAt);
        const year = date.getFullYear();
        document.getElementById('memberSince').textContent = year;
    }

    // Update location if available
    if (instructor.Location) {
        document.getElementById('instructorLocation').textContent = instructor.Location;
        document.getElementById('locationDetail').style.display = 'flex';
    }

    // Update phone if available
    if (instructor.Phone) {
        document.getElementById('instructorPhone').textContent = instructor.Phone;
        document.getElementById('phoneDetail').style.display = 'flex';
    }

    // Update bio
    const bioText = document.getElementById('instructorBio');
    if (instructor.Describe && instructor.Describe.trim()) {
        bioText.textContent = instructor.Describe;
    } else {
        bioText.textContent = 'Chưa có thông tin giới thiệu.';
    }
}

// Display courses
function displayCourses() {
    if (!instructorData) return;

    const coursesGrid = document.getElementById('coursesGrid');
    const noCourses = document.getElementById('noCourses');
    
    const courses = instructorData.courses;

    // Clear existing courses
    coursesGrid.innerHTML = '';

    // Check if no courses
    if (courses.length === 0) {
        noCourses.style.display = 'flex';
        return;
    }

    noCourses.style.display = 'none';

    // Create course cards
    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
}

// Create course card element
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';

    const thumbnail = course.Thumbnail || 'https://via.placeholder.com/400x225?text=Khong+co+anh';
    const levelClass = course.Level ? course.Level.toLowerCase() : 'beginner';

    card.innerHTML = `
        <div class="course-thumbnail">
            <img src="${thumbnail}" alt="${course.Title}" onerror="this.src='https://via.placeholder.com/400x225?text=Khong+co+anh'">
        </div>
        <div class="course-content">
            <div class="course-level level-${levelClass}">${course.Level || 'Cơ bản'}</div>
            <h3 class="course-title">${course.Title}</h3>
            <p class="course-description">${course.Description || 'Không có mô tả'}</p>
            <div class="course-meta">
                <span class="meta-item">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(course.CreatedAt)}
                </span>
            </div>
            <a href="../Course/courseDetail.html?courseId=${course.CourseID}" class="course-link">
                Xem khóa học <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;

    return card;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show error message
function showError(message) {
    const contentWrapper = document.querySelector('.content-wrapper');
    contentWrapper.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <a href="../../Index.html" class="back-link">Quay lại trang chủ</a>
        </div>
    `;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    fetchInstructorData();
});
