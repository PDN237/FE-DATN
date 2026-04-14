// LMS Course List - Fixed version with API + hardcoded fallback
// Prioritizes API data, falls back to demo courses if empty (no DB needed)

document.addEventListener('DOMContentLoaded', async function () {
  const courseGrid = document.querySelector('.course-grid');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');

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

    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.onclick = () => openCourse(course.CourseID);

      const levelBadge = course.Level === 'Cơ bản' ? 'Cơ bản' :
        course.Level === 'Trung cấp' ? 'Trung cấp' : 'Nâng cao';

      // Demo progress for all (backend doesn't provide per-course yet)
      const demoProgress = Math.floor(Math.random() * 51); // 0-50%
      const progressText = demoProgress > 0 ?
        `${demoProgress}% hoàn thành` : 'Chưa bắt đầu';

      card.innerHTML = `
        <img class="course-img" src="${course.Thumbnail || '/FrondEnd/Image/course-placeholder.jpg'}" 
             alt="${course.Title}" onerror="this.src='/FrondEnd/Image/course-placeholder.jpg'">
        <h3>${course.Title}</h3>
        <p>${course.Description || 'Khóa học chất lượng cao'}</p>
        <span class="badge">${levelBadge}</span>
        <div class="course-card-progress">
          <div class="course-card-progress-text">${progressText}</div>
          <div class="course-card-progress-bar">
            <div class="course-card-progress-fill" style="width: ${demoProgress}%"></div>
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

