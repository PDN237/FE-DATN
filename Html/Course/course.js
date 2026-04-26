// LMS Course List - Fixed version with API + hardcoded fallback
// Prioritizes API data, falls back to demo courses if empty (no DB needed)

function getLoggedUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.UserID || user.userId || user.id || 1;
    }
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : 1;
  } catch (error) {
    console.error('Error getting logged user:', error);
    return 1;
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  const courseGrid = document.querySelector('.course-grid');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');

  // Load user avatar
  await loadUserAvatar();

  // Show loading
  courseGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">⏳ Loading courses...</div>';

  try {
    // Global progress bar
    const progress = await window.apiFetch('/api/courses/user/progress');
    const percent = progress.percentage || 0;
    progressBarFill.style.width = percent + '%';
    progressPercentage.textContent = percent + '%';

    // Try API first
    const coursesRaw = await window.apiFetch('/api/courses/courses');
    let courses = Array.isArray(coursesRaw) ? coursesRaw : [];
    console.log('API courses:', coursesRaw, '→', courses.length, 'courses');

    // FALLBACK: Demo courses if API empty (matching HTML)
    if (courses.length === 0) {
      console.log('API empty → using demo courses');
      courses = [
        {
          CourseID: 'Bubble Sort',
          Title: 'Bubble Sort',
          Description: 'Sắp xếp cơ bản cho người mới.',
          Level: 'Cơ bản',
          Thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c'
        },
        {
          CourseID: 'Selection Sort',
          Title: 'Selection Sort',
          Description: 'Chọn phần tử nhỏ nhất.',
          Level: 'Cơ bản',
          Thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475'
        },
        {
          CourseID: 'Merge Sort',
          Title: 'Merge Sort',
          Description: 'Chia để trị.',
          Level: 'Trung cấp',
          Thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd'
        },
        {
          CourseID: 'Quick Sort',
          Title: 'Quick Sort',
          Description: 'Sắp xếp nhanh.',
          Level: 'Trung cấp',
          Thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4'
        },
        {
          CourseID: 'Dijkstra',
          Title: 'Dijkstra',
          Description: 'Tìm đường đi ngắn nhất.',
          Level: 'Nâng cao',
          Thumbnail: 'https://images.unsplash.com/photo-1526378722484-cc5c510f75c7'
        }
      ];
    }

    courseGrid.innerHTML = '';

    // Get user ID for progress tracking
    const userId = getLoggedUser();

    // Fetch progress for all courses
    const courseProgressMap = new Map();
    for (const course of courses) {
      try {
        const progressRes = await window.apiFetch(`/api/courses/courses/${course.CourseID}/progress?userId=${userId}`);
        courseProgressMap.set(course.CourseID, progressRes);
      } catch (error) {
        console.error(`Error fetching progress for course ${course.CourseID}:`, error);
        courseProgressMap.set(course.CourseID, { progress: 0, completedLessons: 0, totalLessons: 0 });
      }
    }

    // Sort courses: in progress (0 < progress < 100) → not started (progress = 0) → completed (progress = 100)
    courses.sort((a, b) => {
      const progressA = (courseProgressMap.get(a.CourseID) || {}).progress || 0;
      const progressB = (courseProgressMap.get(b.CourseID) || {}).progress || 0;

      // Helper function to get sort priority
      const getPriority = (progress) => {
        if (progress > 0 && progress < 100) return 0; // In progress - highest priority
        if (progress === 0) return 1; // Not started - medium priority
        return 2; // Completed - lowest priority
      };

      const priorityA = getPriority(progressA);
      const priorityB = getPriority(progressB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same category, sort by progress descending (higher progress first)
      return progressB - progressA;
    });

    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.onclick = () => openCourse(course.CourseID);

      const levelBadge = course.Level === 'Cơ bản' ? 'Cơ bản' :
        course.Level === 'Trung cấp' ? 'Trung cấp' : 'Nâng cao';

      // Get real progress from backend
      const progressData = courseProgressMap.get(course.CourseID) || { progress: 0, completedLessons: 0, totalLessons: 0 };
      const progress = progressData.progress || 0;
      const progressText = progress > 0 ?
        `${progress}% hoàn thành` : 'Chưa bắt đầu';

      card.innerHTML = `
        <img class="course-img" src="${course.Thumbnail || '/FrondEnd/Image/course-placeholder.jpg'}"
             alt="${course.Title}" onerror="this.src='/FrondEnd/Image/course-placeholder.jpg'">
        <h3>${course.Title}</h3>
        <p>${course.Description || 'Khóa học chất lượng cao'}</p>
        <span class="badge">${levelBadge}</span>
        <div class="course-card-progress">
          <div class="course-card-progress-text">${progressText}</div>
          <div class="course-card-progress-bar">
            <div class="course-card-progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
      `;

      courseGrid.appendChild(card);
    });

  } catch (error) {
    console.error('Lỗi load courses:', error);
    // FINAL FALLBACK: Render hardcoded (survives API/server outage)
    console.log('API failed → rendering demo courses');
    renderDemoCourses(courseGrid);
  }
});

// Fallback renderer (used on API failure)
function renderDemoCourses(grid) {
  const demoCourses = [
    { id: 'Bubble Sort', title: 'Bubble Sort', desc: 'Sắp xếp cơ bản cho người mới.', level: 'Cơ bản', img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c', progress: 45 },
    { id: 'Selection Sort', title: 'Selection Sort', desc: 'Chọn phần tử nhỏ nhất.', level: 'Cơ bản', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475', progress: 30 },
    { id: 'Merge Sort', title: 'Merge Sort', desc: 'Chia để trị.', level: 'Trung cấp', img: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd', progress: 0 },
    { id: 'Quick Sort', title: 'Quick Sort', desc: 'Sắp xếp nhanh.', level: 'Trung cấp', img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4', progress: 0 },
  ];

  // Sort courses: in progress (0 < progress < 100) → not started (progress = 0) → completed (progress = 100)
  demoCourses.sort((a, b) => {
    const getPriority = (progress) => {
      if (progress > 0 && progress < 100) return 0; // In progress - highest priority
      if (progress === 0) return 1; // Not started - medium priority
      return 2; // Completed - lowest priority
    };

    const priorityA = getPriority(a.progress);
    const priorityB = getPriority(b.progress);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Within same category, sort by progress descending
    return b.progress - a.progress;
  });

  grid.innerHTML = '';
  demoCourses.forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.onclick = () => openCourse(course.id);
    card.innerHTML = `
      <img class="course-img" src="${course.img}" alt="${course.title}">
      <h3>${course.title}</h3>
      <p>${course.desc}</p>
      <span class="badge">${course.level}</span>
      <div class="course-card-progress">
        <div class="course-card-progress-text">${course.progress}% hoàn thành</div>
        <div class="course-card-progress-bar">
          <div class="course-card-progress-fill" style="width: ${course.progress}%"></div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openCourse(courseId) {
  window.location.href = `courseDetail.html?courseId=${courseId}`;
}

// Search filter (works with both API and demo courses)
document.querySelector('.search-box input')?.addEventListener('input', function (e) {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.course-card').forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = title.includes(term) ? 'block' : 'none';
  });
});

// Load user avatar from backend
async function loadUserAvatar() {
  try {
    const userId = getLoggedUser();
    const API_BASE = 'https://be-datn-6gb6.onrender.com/api/profile';
    
    const response = await fetch(`${API_BASE}/avatar?userId=${userId}`);
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
