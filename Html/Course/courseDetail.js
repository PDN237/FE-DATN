// LMS Course Detail - Robust Error Handling + Course ID Validation
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = parseInt(urlParams.get('courseId'));
  
  // Validate courseId
  if (!courseId || courseId < 1) {
    document.querySelector('.course-content').innerHTML = `
      <div style="text-align:center; padding:2rem; color:#ef4444;">
        <h2>❌ Khóa học không tồn tại</h2>
        <p>Course ID: ${courseId || 'missing'}</p>
        <a href="course.html" class="btn btn-primary" style="margin-top:1rem;">← Về danh sách khóa học</a>
      </div>
    `;
    return;
  }
  
  console.log('Loading courseDetail for ID:', courseId);
  
  const lessonList = document.getElementById('lessonList');
  const commentList = document.getElementById('commentList');
  const courseProgressBar = document.getElementById('courseProgressBar');
  const completedLessons = document.getElementById('completedLessons');
  const courseProgressPercent = document.getElementById('courseProgressPercent');
  
  // Loading UI
  lessonList.innerHTML = '<li style="text-align:center; padding:1rem;">⏳ Đang tải nội dung...</li>';
  
  try {
    // 1. Load course details
console.log('Fetching course:', courseId);
    const courseRes = await window.apiFetch(`/api/courses/courses/${courseId}`);
    const course = await courseRes;
    
    if (!course) {
      throw new Error('Course not found in database');
    }
    
    document.getElementById('title').textContent = course.Title || 'Untitled Course';
    document.getElementById('desc').textContent = course.Description || 'No description available';
    
    // 2. Load modules + lessons with progress
    const userId = getLoggedUser();
    console.log('Fetching modules/lessons for:', courseId, 'userId:', userId);
    const modulesRes = await window.apiFetch(`/api/courses/courses/${courseId}/modules-lessons?userId=${userId}`).catch(() => []);
    const modules = Array.isArray(modulesRes) ? modulesRes : []; 
    
    lessonList.innerHTML = '';
    let totalLessons = 0, completedCount = 0;
    
    if (modules.length === 0) {
      lessonList.innerHTML = '<li>Chưa có bài học nào cho khóa học này.</li>';
    } else {
      modules.forEach(module => {
        totalLessons += module.lessons?.length || 0;
        const moduleDiv = document.createElement('div');
        moduleDiv.innerHTML = `
          <h4 style="margin:1rem 0 0.5rem; padding:0.5rem; background:#f1f5f9; border-radius:4px;">
            📁 ${module.title} (${module.lessons?.length || 0} bài)
          </h4>
        `;
        
        const lessonsList = document.createElement('ul');
        lessonsList.style.marginLeft = '1.5rem';
        lessonsList.style.listStyle = 'none';
        
        (module.lessons || []).forEach(lesson => {
          completedCount += lesson.completed ? 1 : 0;
          const li = document.createElement('li');
          const isCompleted = lesson.completed || false;
          li.className = isCompleted ? 'lesson completed-lesson' : 'lesson';
          
          const status = lesson.status || 'locked';
          
          li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; cursor:pointer;">
              <span>${lesson.title || 'Untitled Lesson'}</span>
              <span style="font-size:0.8rem; padding:0.2rem 0.5rem; background:#${isCompleted ? '22c55e' : 'ef4444'}; color:white; border-radius:12px;">
                ${isCompleted ? '✓ Hoàn thành' : '🔒 Khóa'}
              </span>
            </div>
          `; 
          
          if (isCompleted || status !== 'locked') {
            li.style.cursor = 'pointer';
            li.onclick = () => window.location.href = `lesson.html?courseId=${courseId}&lessonId=${lesson.id}`;
            li.title = 'Click to open lesson';
          }
          
          lessonsList.appendChild(li);
        });
        
        moduleDiv.appendChild(lessonsList);
        lessonList.appendChild(moduleDiv);
      });
    }
    
    // Course progress (API usage)
    const progressData = await loadCourseProgress(courseId, userId);
    if (progressData) {
        courseProgressBar.style.width = progressData.progress + '%';
        completedLessons.textContent = `${progressData.completedLessons}/${progressData.totalLessons} bài`;
        courseProgressPercent.textContent = progressData.progress + '%';
    } else {
        const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        courseProgressBar.style.width = percent + '%';
        completedLessons.textContent = `${completedCount}/${totalLessons} bài`;
        courseProgressPercent.textContent = percent + '%';
    }
    
    // 3. Load comments (fallback)
    const commentsRes = await window.apiFetch(`/api/comments/${courseId}`).catch(() => []);
    const comments = Array.isArray(commentsRes) ? commentsRes : [];
    
    commentList.innerHTML = comments.length ? 
      comments.map(c => `
        <div style="background:#f8f9fa; padding:1rem; margin:1rem 0; border-radius:8px;">
          <h4 style="margin:0 0 0.5rem 0;">User ${c.UserID} ⭐${'★'.repeat(c.Rating || 1)}</h4>
          <p>${c.Content}</p>
          <small>${new Date(c.CreatedAt).toLocaleString()}</small>
        </div>
      `).join('') : 
      '<p style="text-align:center; color:#666;">Chưa có bình luận nào.</p>';
    
  } catch (error) {
    console.error('CourseDetail error:', error);
    lessonList.innerHTML = `
      <li style="color:#ef4444; text-align:center; padding:2rem;">
        ❌ Lỗi tải khóa học ID ${courseId}: ${error.message}
        <br><a href="course.html" style="color:#0891b2;">← Về danh sách</a>
      </li>
    `;
  }
  
  // Global functions (safe)
  window.back = () => window.location.href = 'course.html';
  window.startCourse = () => {
    const firstUnlocked = document.querySelector('[title*="open lesson"]');
    if (firstUnlocked) firstUnlocked.click();
    else alert('No unlocked lessons available');
  };
});

// Comment form with proper error handling
document.addEventListener('DOMContentLoaded', () => {
  const stars = document.querySelectorAll('.star');
  const commentBtn = document.querySelector('.comment-form button');
  const commentForm = document.querySelector('.comment-form');
  
  if (!stars.length || !commentBtn) return;
  
  let rating = 0;
  
  stars.forEach((star, i) => {
    star.onclick = () => {
      rating = i + 1;
      stars.forEach((s, idx) => s.classList.toggle('active', idx < rating));
    };
  });
  
  commentBtn.onclick = async () => {
    const content = document.getElementById('commentText')?.value?.trim();
    const name = document.getElementById('username')?.value?.trim();
    
    if (!content || !name || !rating) {
      alert('⭕ Vui lòng điền đầy đủ: Tên + Nội dung + Sao đánh giá!');
      return;
    }
    
    try {
      const courseId = new URLSearchParams(window.location.search).get('courseId');
      await window.apiFetch(`/api/comments/${courseId}`, {
        method: 'POST',
        body: JSON.stringify({ content, rating })
      });
      alert('✅ Comment đã gửi!');
      commentForm.reset();
      location.reload();
    } catch (error) {
      alert('❌ Lỗi gửi: ' + error.message);
    }
  };
});

function getLoggedUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || parseInt(localStorage.getItem('userId')) || 1;
  } catch {
    return 1;
  }
}

async function loadCourseProgress(courseId, userId) {
  try {
    const res = await window.apiFetch(`/api/courses/courses/${courseId}/progress?userId=${userId}`);
    return res;
  } catch (error) {
    console.error('Failed to load course progress:', error);
    return null;
  }
}


