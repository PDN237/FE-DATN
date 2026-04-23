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
    
    // Debug: Log course data to check UserID field
    console.log('Course data:', course);
    console.log('UserID:', course.UserID, 'userid:', course.userid);
    
    // Load instructor information
    const instructorId = course.UserID || course.userid;
    if (instructorId) {
      loadInstructorInfo(instructorId);
    } else {
      console.warn('No UserID found in course data');
      document.getElementById('instructorName').textContent = 'Không có thông tin';
    }
    
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

    // Load course statistics
    await loadCourseStatistics(courseId, userId);

    // Load top 3 comments (testimonials)
    await loadTopComments(courseId);

    // Load all comments
    await loadAllComments(courseId);

    // Load user's existing review (if any)
    await loadUserReview(courseId, userId);

    // Check course completion and enable/disable review form
    await checkReviewEligibility(courseId, userId);
    
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
  const commentBtn = document.getElementById('submitCommentBtn');
  const commentText = document.getElementById('commentText');
  const ratingValue = document.getElementById('ratingValue');

  if (!stars.length || !commentBtn) return;

  let rating = 0;

  stars.forEach((star) => {
    star.onclick = () => {
      rating = parseInt(star.dataset.rating);
      stars.forEach((s) => {
        const starRating = parseInt(s.dataset.rating);
        s.classList.toggle('active', starRating <= rating);
      });
      // Update rating value display
      if (ratingValue) {
        ratingValue.textContent = `${rating}/5`;
      }
    };
  });

  commentBtn.onclick = async () => {
    const content = commentText?.value?.trim();
    const userId = getLoggedUser();

    if (!rating) {
      alert('⭕ Vui lòng chọn số sao đánh giá!');
      return;
    }

    try {
      const courseId = new URLSearchParams(window.location.search).get('courseId');
      const editingMode = commentBtn.dataset.isEditing === 'true';

      if (editingMode) {
        // Update existing comment
        await window.apiFetch(`/api/comments/${courseId}`, {
          method: 'PUT',
          body: JSON.stringify({ userId, content: content || '', rating })
        });
        alert('✅ Đánh giá đã cập nhật thành công!');
      } else {
        // Create new comment
        await window.apiFetch(`/api/comments/${courseId}`, {
          method: 'POST',
          body: JSON.stringify({ userId, content: content || '', rating })
        });
        alert('✅ Đánh giá đã gửi thành công!');
      }

      commentText.value = '';
      rating = 0;
      stars.forEach(s => s.classList.remove('active'));
      if (ratingValue) {
        ratingValue.textContent = '0/5';
      }
      commentBtn.dataset.isEditing = 'false';
      commentBtn.textContent = 'Gửi đánh giá';

      // Reload comments and statistics
      await loadCourseStatistics(parseInt(courseId), userId);
      await loadTopComments(parseInt(courseId));
      await loadAllComments(parseInt(courseId));
      await loadUserReview(parseInt(courseId), userId);
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

async function loadInstructorInfo(instructorId) {
  console.log('Loading instructor info for ID:', instructorId);
  try {
    const res = await window.apiFetch(`/api/information/${instructorId}`);
    console.log('Instructor API response:', res);

    if (res.success && res.data.instructor) {
      const instructor = res.data.instructor;
      const instructorLink = document.getElementById('instructorName');
      instructorLink.textContent = instructor.FullName || 'Giảng viên';
      instructorLink.href = `../Instructor/Information.html?id=${instructorId}`;
      console.log('Instructor name set to:', instructor.FullName);
    } else {
      console.warn('Invalid instructor response:', res);
      document.getElementById('instructorName').textContent = 'Giảng viên';
    }
  } catch (error) {
    console.error('Failed to load instructor info:', error);
    // Fallback: show generic instructor name without link
    const instructorLink = document.getElementById('instructorName');
    instructorLink.textContent = 'Giảng viên';
    instructorLink.href = '#';
    instructorLink.style.pointerEvents = 'none';
    instructorLink.style.color = '#9ca3af';
  }
}

async function loadCourseStatistics(courseId, userId) {
  try {
    // Use existing course progress API that's already working
    const progressRes = await window.apiFetch(`/api/courses/courses/${courseId}/progress?userId=${userId}`);
    console.log('Course progress:', progressRes);

    // Get rating statistics separately
    const ratingStats = await window.apiFetch(`/api/comments/${courseId}/rating-stats`).catch(() => ({ totalRatings: 0, averageRating: 0 }));

    // Update statistics display
    document.getElementById('averageRating').textContent = `⭐ ${ratingStats.averageRating || 0}`;
    document.getElementById('totalRatings').textContent = `${ratingStats.totalRatings || 0} đánh giá`;
    document.getElementById('totalLessons').textContent = `${progressRes.totalLessons || 0} bài`;
    document.getElementById('completedLessonsInfo').textContent = `${progressRes.completedLessons || 0}/${progressRes.totalLessons || 0}`;
    document.getElementById('courseProgressInfo').textContent = `${progressRes.progress || 0}%`;

    return { ...progressRes, ...ratingStats };
  } catch (error) {
    console.error('Failed to load course statistics:', error);
    return null;
  }
}

async function loadTopComments(courseId) {
  try {
    const res = await window.apiFetch(`/api/comments/${courseId}/top`);
    const comments = Array.isArray(res) ? res : [];
    console.log('Top comments:', comments);

    const testimonialsList = document.getElementById('testimonialsList');
    if (!testimonialsList) return;

    if (comments.length === 0) {
      testimonialsList.innerHTML = '<p style="text-align:center; color:#666;">Chưa có đánh giá nào.</p>';
      return;
    }

    testimonialsList.innerHTML = comments.map(comment => `
      <div class="testimonial-card">
        <div class="testimonial-header">
          <img src="${comment.avatarUrl}" alt="${comment.userName}" class="testimonial-avatar">
          <div class="testimonial-info">
            <h4 class="testimonial-name">${comment.userName}</h4>
            <div class="testimonial-rating">
              ${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}
            </div>
          </div>
        </div>
        <p class="testimonial-content">${comment.content}</p>
        <small class="testimonial-date">${new Date(comment.createdAt).toLocaleDateString('vi-VN')}</small>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load top comments:', error);
    const testimonialsList = document.getElementById('testimonialsList');
    if (testimonialsList) {
      testimonialsList.innerHTML = '<p style="text-align:center; color:#666;">Không thể tải đánh giá.</p>';
    }
  }
}

async function loadAllComments(courseId) {
  try {
    const res = await window.apiFetch(`/api/comments/${courseId}`);
    const comments = Array.isArray(res) ? res : [];
    console.log('All comments:', comments);

    const allCommentsList = document.getElementById('allCommentsList');
    console.log('allCommentsList element:', allCommentsList);

    if (!allCommentsList) {
      console.error('allCommentsList element not found');
      return;
    }

    if (comments.length === 0) {
      allCommentsList.innerHTML = '<p style="text-align:center; color:#666; padding:1rem;">Chưa có bình luận nào.</p>';
      console.log('No comments to display');
      return;
    }

    const commentsHTML = comments.map(comment => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-user">${comment.userName || 'Người dùng'}</span>
          <span class="comment-rating">${'★'.repeat(comment.rating || 1)}</span>
        </div>
        <p class="comment-text">${comment.content || ''}</p>
        <small class="comment-date">${new Date(comment.createdAt).toLocaleString('vi-VN')}</small>
      </div>
    `).join('');

    allCommentsList.innerHTML = commentsHTML;
    console.log('Comments rendered successfully');
  } catch (error) {
    console.error('Failed to load all comments:', error);
  }
}

async function loadUserReview(courseId, userId) {
  try {
    const res = await window.apiFetch(`/api/comments/${courseId}/user?userId=${userId}`);
    const userReview = res;

    console.log('User review:', userReview);

    if (userReview) {
      // User has an existing review, populate the form
      const commentText = document.getElementById('commentText');
      const ratingValue = document.getElementById('ratingValue');
      const commentBtn = document.getElementById('submitCommentBtn');
      const stars = document.querySelectorAll('.star');

      if (commentText) commentText.value = userReview.content || '';
      if (ratingValue) ratingValue.textContent = `${userReview.rating}/5`;

      // Set star rating
      stars.forEach((s) => {
        const starRating = parseInt(s.dataset.rating);
        s.classList.toggle('active', starRating <= userReview.rating);
      });

      // Set editing mode
      if (commentBtn) {
        commentBtn.textContent = 'Cập nhật đánh giá';
        commentBtn.dataset.isEditing = 'true';
      }

      // Store rating for form submission
      window.currentRating = userReview.rating;
    }
  } catch (error) {
    console.error('Failed to load user review:', error);
  }
}

async function checkReviewEligibility(courseId, userId) {
  try {
    const progressRes = await window.apiFetch(`/api/courses/courses/${courseId}/progress?userId=${userId}`);
    const ratingFormCard = document.querySelector('.rating-form-card');
    const submitBtn = document.getElementById('submitCommentBtn');

    if (!ratingFormCard) return;

    if (!progressRes.courseCompleted) {
      // Course not completed, disable review form
      ratingFormCard.style.opacity = '0.5';
      ratingFormCard.style.pointerEvents = 'none';

      // Add message
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = 'background: #fef3c7; color: #92400e; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;';
      messageDiv.innerHTML = `⚠️ Bạn cần hoàn thành khóa học (${progressRes.completedLessons}/${progressRes.totalLessons} bài) trước khi đánh giá.`;

      ratingFormCard.insertBefore(messageDiv, ratingFormCard.firstChild);
    } else {
      // Course completed, enable review form
      ratingFormCard.style.opacity = '1';
      ratingFormCard.style.pointerEvents = 'auto';
    }
  } catch (error) {
    console.error('Failed to check review eligibility:', error);
  }
}
