// User Course List - API + demo fallback with search/filter
// Uses real DB data from /api/courses/courses, keeps course-user.js path

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

// 30 motivational messages that rotate every 2 hours
const motivationalMessages = [
  "Hãy bắt đầu ngay hôm nay, tương lai của bạn đang chờ đợi!",
  "Mỗi bước nhỏ đều đưa bạn đến gần hơn với mục tiêu.",
  "Đừng bỏ cuộc, nỗ lực của bạn sẽ được đền đáp!",
  "Kiến thức là sức mạnh, hãy tiếp tục học tập!",
  "Bạn có thể làm được nhiều hơn bạn nghĩ!",
  "Học tập là hành trình, hãy tận hưởng từng khoảnh khắc.",
  "Mỗi ngày học là một ngày phát triển.",
  "Tin vào bản thân và tiếp tục tiến về phía trước.",
  "Thành công đến từ sự kiên trì và nỗ lực không ngừng.",
  "Hãy biến những thách thức thành cơ hội để phát triển.",
  "Đừng so sánh mình với người khác, hãy so sánh với phiên bản trước của bạn.",
  "Mỗi bài học là một viên gạch xây dựng thành công của bạn.",
  "Hãy kiên nhẫn, kết quả sẽ đến với thời gian.",
  "Bạn là kiến trúc sư của tương lai chính mình.",
  "Học tập không chỉ để thi, mà để phát triển bản thân.",
  "Mỗi sai lầm là một bài học quý giá.",
  "Hãy tập trung vào tiến bộ, không phải sự hoàn hảo.",
  "Năng lượng và sự nhiệt huyết sẽ đưa bạn đến thành công.",
  "Đừng ngại thử cái mới, đó là cách bạn phát triển.",
  "Mục tiêu không quan trọng bằng hành động bạn thực hiện mỗi ngày.",
  "Hãy coi học tập là một cơ hội để khám phá thế giới.",
  "Sự kỷ luật là cầu nối giữa mục tiêu và thành công.",
  "Bạn có tiềm năng vô hạn, hãy khai phá nó!",
  "Hãy học từ những người giỏi hơn và truyền cảm hứng cho người khác.",
  "Mỗi ngày trôi qua là một cơ hội mới để trở nên tốt hơn.",
  "Đừng để nỗi sợ cản trở bạn đạt được ước mơ.",
  "Hãy xây dựng thói quen học tập tốt từ hôm nay.",
  "Kiên trì là chìa khóa mở cánh cửa thành công.",
  "Bạn đáng được thành công, hãy tiếp tục nỗ lực!",
  "Hãy nhớ: bạn học không phải để thông minh, mà để không ngu ngốc."
];

// Function to get motivational message based on current time (rotates every 2 hours)
function getMotivationalMessage() {
  const now = new Date();
  const hours = now.getHours();
  const messageIndex = Math.floor(hours / 2) % motivationalMessages.length;
  return motivationalMessages[messageIndex];
}

// Function to update motivational message display
function updateMotivationalMessage() {
  const messageElement = document.getElementById('motivationalMessage');
  if (messageElement) {
    messageElement.textContent = getMotivationalMessage();
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  const courseGrid = document.querySelector('.course-grid');
  const searchInput = document.querySelector('.search-box input');
  const filterSelect = document.querySelector('.filter-bar select');

  // Update motivational message
  updateMotivationalMessage();

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
      const userId = getLoggedUser();
      const courseProgressMap = new Map();
      
      // Fetch progress for all courses
      for (const course of coursesRaw) {
        try {
          const progressRes = await window.apiFetch(`/api/courses/courses/${course.CourseID}/progress?userId=${userId}`);
          courseProgressMap.set(course.CourseID, progressRes);
        } catch (error) {
          console.error(`Error fetching progress for course ${course.CourseID}:`, error);
          courseProgressMap.set(course.CourseID, { progress: 0, completedLessons: 0, totalLessons: 0 });
        }
      }
      
      courses = coursesRaw.map(c => {
        const progressData = courseProgressMap.get(c.CourseID) || { progress: 0, completedLessons: 0, totalLessons: 0 };
        return {
          id: c.CourseID,
          title: c.Title,
          desc: c.Description || 'Khóa học chất lượng cao',
          level: c.Level || 'Cơ bản',
          img: c.Thumbnail || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
          progress: progressData.progress || 0
        };
      });
      console.log('✅ Loaded', courses.length, 'real courses from DB with progress');
    } else {
      console.log('ℹ️ No DB courses, using demo');
    }
  } catch (error) {
    console.log('❌ API error, using demo:', error.message);
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
    const filtered = level === 'all' ?
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

