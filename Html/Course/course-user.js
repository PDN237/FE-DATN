// User Course List - API + demo fallback with search/filter
// Uses real DB data from /api/courses/courses, keeps course-user.js path

document.addEventListener('DOMContentLoaded', async function() {
  const courseGrid = document.querySelector('.course-grid');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');
  const searchInput = document.querySelector('.search-box input');
  const filterSelect = document.querySelector('.filter-bar select');
  
  // Show loading
  courseGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">⏳ Loading courses...</div>';
  
  // Fallback demo courses (matching HTML)
  const demoCourses = [
    {
      id: 'Bubble Sort',
      title: 'Bubble Sort',
      desc: 'Sắp xếp cơ bản cho người mới.',
      level: 'Cơ bản',
      img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
      progress: 45
    },
    {
      id: 'Selection Sort',
      title: 'Selection Sort',
      desc: 'Chọn phần tử nhỏ nhất.',
      level: 'Cơ bản',
      img: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      progress: 30
    },
    {
      id: 'Merge Sort',
      title: 'Merge Sort',
      desc: 'Chia để trị.',
      level: 'Trung cấp',
      img: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd',
      progress: 0
    },
    {
      id: 'Quick Sort',
      title: 'Quick Sort',
      desc: 'Sắp xếp nhanh.',
      level: 'Trung cấp',
      img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
      progress: 0
    },
    {
      id: 'Dijkstra',
      title: 'Dijkstra',
      desc: 'Tìm đường đi ngắn nhất.',
      level: 'Nâng cao',
      img: 'https://images.unsplash.com/photo-1526378722484-cc5c510f75c7',
      progress: 0
    }
  ];

  let courses = demoCourses;
  
  try {
    // Load real data from API first
    const apiResponse = await window.apiFetch('/api/courses/courses');
    console.log('Raw API response:', apiResponse);
    
    let coursesRaw;
    if (apiResponse.recordset && Array.isArray(apiResponse.recordset)) {
      coursesRaw = apiResponse.recordset;
    } else if (Array.isArray(apiResponse)) {
      coursesRaw = apiResponse;
    } else {
      coursesRaw = [];
    }
    
    if (coursesRaw.length > 0) {
      courses = coursesRaw.map(c => ({
        id: c.CourseID,
        title: c.Title,
        desc: c.Description || 'Khóa học chất lượng cao',
        level: c.Level || 'Cơ bản',
        img: c.Thumbnail || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
        progress: 0  // TODO: fetch per-course progress
      }));
      console.log('✅ Loaded', courses.length, 'real courses from DB');
    } else {
      console.log('ℹ️ No DB courses, using demo');
    }
  } catch (error) {
    console.log('❌ API error, using demo:', error.message);
  }
  
  // Global progress bar from API
  try {
    const progress = await window.apiFetch('/api/courses/user/progress');
    const percent = progress.percentage || 25;
    progressBarFill.style.width = percent + '%';
    progressPercentage.textContent = percent + '%';
  } catch (error) {
    console.log('Progress API error:', error);
    // Fallback
    const globalProgress = 25;
    progressBarFill.style.width = globalProgress + '%';
    progressPercentage.textContent = globalProgress + '%';
  }
  
  // Render courses
  function renderCourses(coursesToShow) {
    courseGrid.innerHTML = '';
    coursesToShow.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.onclick = () => openCourse(course.id);
      card.innerHTML = `
        <img class="course-img" src="${course.img}" alt="${course.title}" onerror="this.src='/FrondEnd/Image/course-placeholder.jpg'">
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
      courseGrid.appendChild(card);
    });
  }
  
  // Initial render
  renderCourses(courses);
  
  // Search
  searchInput.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const filtered = courses.filter(course => 
      course.title.toLowerCase().includes(term)
    );
    renderCourses(filtered);
  });
  
  // Filter by level
  filterSelect.addEventListener('change', function(e) {
    const level = e.target.value;
    const filtered = level === 'Tất cả' ? 
      courses : 
      courses.filter(course => course.level === level);
    renderCourses(filtered);
  });
  
  // Gợi ý button (random from loaded courses)
  document.querySelector('.filter-bar button').addEventListener('click', function() {
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    alert(`Gợi ý: ${randomCourse.title}\\n"${randomCourse.desc}"`);
    // Scroll to course
    const courseCard = document.querySelector(`[onclick="openCourse('${randomCourse.id}')"]`);
    courseCard?.scrollIntoView({ behavior: 'smooth' });
  });
});

function openCourse(courseId) {
  window.location.href = `courseDetail.html?courseId=${courseId}`;
}

