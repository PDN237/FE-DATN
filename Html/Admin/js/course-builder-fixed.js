// Course Preview - Admin Read-Only View
// Uses admin API endpoints to load course tree

const API_BASE = 'https://be-datn-6gb6.onrender.com/api/admin';

// Get courseId from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');

// State
let courseData = null;
let modulesData = [];
let activeLesson = null;

// Helpers
function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function formatTextWithLineBreaks(s) {
  if (!s) return '';
  return escHtml(s).replace(/\n/g, '<br>');
}

function formatVideoUrl(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&#?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const dr = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (dr) return `https://drive.google.com/file/d/${dr[1]}/preview`;
  return url;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!courseId) {
    document.getElementById('moduleTree').innerHTML = '<p style="padding:40px;text-align:center;color:#ee5a6f;">Không tìm thấy courseId trong URL.</p>';
    return;
  }

  await loadCourseTree();
});

// ============================================================
// LOAD COURSE TREE (using admin API)
// ============================================================
async function loadCourseTree() {
  try {
    // Load course data - backend returns course object directly with nested modules
    const courseRes = await fetch(`${API_BASE}/courses/${courseId}`);
    const courseResult = await courseRes.json();
    
    // Backend returns course object directly, not wrapped in {success, course}
    if (!courseResult || (courseResult.error && !courseResult.CourseID)) {
      document.getElementById('moduleTree').innerHTML = `<p style="padding:40px;text-align:center;color:#ee5a6f;">${courseResult.error || courseResult.message || 'Lỗi tải khóa học'}</p>`;
      return;
    }

    courseData = courseResult;
    modulesData = courseData.modules || [];

    // Update header
    document.getElementById('courseTitleHeader').textContent = courseData.Title;
    document.getElementById('courseSubtitle').textContent = 'Xem trước nội dung khóa học trước khi phê duyệt';
    document.getElementById('courseName').textContent = courseData.Title;
    document.getElementById('courseLevel').textContent = courseData.Level || 'Cơ bản';
    document.getElementById('moduleCount').textContent = `${modulesData.length} module`;
    document.title = `${courseData.Title} – Preview | Admin`;

    // Update status
    updateStatusUI(courseData);

    // Render tree
    renderTree();
  } catch (err) {
    document.getElementById('moduleTree').innerHTML = '<p style="padding:40px;text-align:center;color:#94a3b8;">Không thể kết nối đến máy chủ.</p>';
  }
}

function updateStatusUI(course) {
  const statusEl = document.getElementById('courseStatus');
  const banner = document.getElementById('feedbackBanner');
  const feedbackText = document.getElementById('feedbackText');
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const unpublishBtn = document.getElementById('unpublishBtn');

  // Check both camelCase and lowercase field names
  const accept = course.Accept || course.accept;
  const isCompleted = course.IsCompleted || course.iscompleted;
  const feedback = course.Feedback || course.feedback;

  // Status badge
  if (accept && isCompleted) {
    statusEl.textContent = '✓ Đã xuất bản';
    statusEl.className = 'cb-status-badge cb-status--published';
    approveBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
    unpublishBtn.style.display = 'inline-flex';
  } else if (accept && !isCompleted) {
    statusEl.textContent = '⏳ Đang chờ duyệt';
    statusEl.className = 'cb-status-badge cb-status--pending';
    approveBtn.style.display = 'inline-flex';
    rejectBtn.style.display = 'inline-flex';
    unpublishBtn.style.display = 'none';
  } else if (!accept && feedback) {
    statusEl.textContent = '✕ Bị từ chối';
    statusEl.className = 'cb-status-badge cb-status--rejected';
    approveBtn.style.display = 'inline-flex';
    rejectBtn.style.display = 'none';
    unpublishBtn.style.display = 'none';
  } else {
    statusEl.textContent = 'Đang soạn';
    statusEl.className = 'cb-status-badge cb-status--pending';
    approveBtn.style.display = 'inline-flex';
    rejectBtn.style.display = 'inline-flex';
    unpublishBtn.style.display = 'none';
  }

  // Feedback banner
  if (!accept && feedback) {
    banner.style.display = 'block';
    feedbackText.textContent = feedback;
  } else {
    banner.style.display = 'none';
  }
}

// ============================================================
// APPROVE / REJECT COURSE
// ============================================================
window.__approveCourse = function () {
  document.getElementById('approveCourseName').textContent = courseData.Title || '—';
  document.getElementById('approveModal').classList.add('active');
};

window.__rejectCourse = function () {
  document.getElementById('rejectCourseName').textContent = courseData.Title || '—';
  document.getElementById('rejectFeedback').value = '';
  document.getElementById('rejectModal').classList.add('active');
};

window.__unpublishCourse = function () {
  document.getElementById('unpublishCourseName').textContent = courseData.Title || '—';
  document.getElementById('unpublishFeedback').value = '';
  document.getElementById('unpublishModal').classList.add('active');
};

// Modal confirm handlers
document.getElementById('confirmApprove').addEventListener('click', async function () {
  try {
    const res = await fetch(`${API_BASE}/courses/${courseId}/approve`, {
      method: 'PUT'
    });
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('approveModal').classList.remove('active');
      alert('Khóa học đã được phê duyệt và xuất bản thành công!');
      window.location.href = '/FrondEnd/Html/Admin/Admin-Course.html';
    } else {
      alert('Lỗi: ' + (data.message || 'Không thể phê duyệt khóa học'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
});
document.getElementById('confirmReject').addEventListener('click', async function () {
  const feedback = document.getElementById('rejectFeedback').value.trim();
  if (!feedback) {
    alert('Vui lòng nhập lý do từ chối');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/courses/${courseId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback })
    });
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('rejectModal').classList.remove('active');
      alert('Đã từ chối khóa học và gửi feedback!');
      window.location.href = '/FrondEnd/Html/Admin/Admin-Course.html';
    } else {
      alert('Lỗi: ' + (data.message || 'Không thể từ chối khóa học'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
});

document.getElementById('confirmUnpublish').addEventListener('click', async function () {
  const feedback = document.getElementById('unpublishFeedback').value.trim();
  
  try {
    const res = await fetch(`${API_BASE}/courses/${courseId}/unpublish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: feedback || '' })
    });
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('unpublishModal').classList.remove('active');
      alert('Đã hủy xuất bản khóa học thành công!');
      window.location.href = '/FrondEnd/Html/Admin/Admin-Course.html';
    } else {
      alert('Lỗi: ' + (data.message || 'Không thể hủy xuất bản khóa học'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
});

// ============================================================
// RENDER MODULE TREE (READ-ONLY)
// ============================================================
function renderTree() {
  const container = document.getElementById('moduleTree');

  if (modulesData.length === 0) {
    container.innerHTML = `
      <div class="cb-empty-state">
        <div class="cb-empty-icon">📦</div>
        <h4>Chưa có module nào</h4>
        <p>Khóa học này chưa có nội dung.</p>
      </div>`;
    return;
  }

  container.innerHTML = modulesData.map((mod, idx) => {
    const lessonsHtml = (mod.lessons || []).map(lesson => {
      const icon = lesson.Type === 'video' ? '📹' : lesson.Type === 'reading' ? '📖' : '🧠';
      return `
        <div class="cb-lesson-node" data-lid="${lesson.LessonID}">
          <div class="cb-lesson-info" onclick="window.__selectLesson(${lesson.LessonID})">
            <span class="cb-lesson-icon">${icon}</span>
            <span class="cb-lesson-title">${escHtml(lesson.Title)}</span>
            <span class="cb-lesson-type-badge cb-lesson-type--${lesson.Type}">${lesson.Type}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="cb-module-block">
        <div class="cb-module-header">
          <div class="cb-module-left">
            <span class="cb-module-number">${idx + 1}</span>
            <h3 class="cb-module-name">${escHtml(mod.Title)}</h3>
            <span class="cb-module-count">${(mod.lessons || []).length} bài</span>
          </div>
        </div>
        <div class="cb-lessons-list">
          ${lessonsHtml || '<div class="ins-no-lessons">Chưa có bài học</div>'}
        </div>
      </div>`;
  }).join('');
}

// ============================================================
// LESSON PREVIEW (READ-ONLY)
// ============================================================
window.__selectLesson = async function (lessonId) {
  try {
    // First, try to find lesson in already loaded modulesData
    let lesson = null;
    for (const mod of modulesData) {
      if (mod.lessons) {
        const found = mod.lessons.find(l => (l.LessonID || l.lessonid) == lessonId);
        if (found) {
          lesson = found;
          break;
        }
      }
    }
    
    if (lesson) {
      activeLesson = lesson;
      renderPreview(activeLesson);
      renderTree(); // update active state
      return;
    }
    
    // If not found in modulesData, try API
    const res = await fetch(`${API_BASE}/lessons/${lessonId}`);
    const data = await res.json();
    
    if (!data || (data.error && !data.LessonID)) {
      document.getElementById('contentPreview').innerHTML = '<p style="padding:40px;text-align:center;color:#ee5a6f;">Lỗi tải bài học</p>';
      return;
    }

    activeLesson = data.lesson || data;
    renderPreview(activeLesson);
    renderTree(); // update active state
  } catch (err) {
    document.getElementById('contentPreview').innerHTML = '<p style="padding:40px;text-align:center;color:#94a3b8;">Không thể tải bài học</p>';
  }
};

function renderPreview(lesson) {
  const el = document.getElementById('contentPreview');
  const icon = lesson.Type === 'video' ? '📹' : lesson.Type === 'reading' ? '📖' : '🧠';

  const contentHtml = getPreviewContent(lesson);
  const quizHtml = renderQuizPreview(lesson);
  const hasDescribe = lesson.Describe && lesson.Describe.trim();
  const hasSummary = lesson.Summary && lesson.Summary.trim();
  const hasQuiz = quizHtml && quizHtml !== '<div class="cb-quiz-preview">🧠 Chưa có câu hỏi trắc nghiệm</div>';

  // Build tabs
  let tabsHtml = '';
  if (hasDescribe || hasSummary || hasQuiz) {
    tabsHtml = `
      <div class="cb-tabs">
        ${hasDescribe ? `<button class="cb-tab-btn cb-tab-btn--active" data-tab="describe" onclick="window.__switchTab('describe')"> Mô tả chi tiết</button>` : ''}
        ${hasSummary ? `<button class="cb-tab-btn" data-tab="summary" onclick="window.__switchTab('summary')"> Tóm tắt</button>` : ''}
        ${hasQuiz ? `<button class="cb-tab-btn" data-tab="quiz" onclick="window.__switchTab('quiz')"> Câu hỏi</button>` : ''}
      </div>
    `;
  }

  // Build tab content
  let tabContentHtml = '';
  if (hasDescribe) {
    tabContentHtml += `
      <div class="cb-tab-content cb-tab-content--active" id="tab-describe">
        <div class="cb-content-block">
          <p style="color: #475569; line-height: 1.8; margin: 0; white-space: pre-wrap;">${formatTextWithLineBreaks(lesson.Describe)}</p>
        </div>
      </div>
    `;
  }
  if (hasSummary) {
    tabContentHtml += `
      <div class="cb-tab-content" id="tab-summary">
        <div class="cb-content-block">
          <p style="color: #475569; line-height: 1.8; margin: 0; white-space: pre-wrap;">${formatTextWithLineBreaks(lesson.Summary)}</p>
        </div>
      </div>
    `;
  }
  if (hasQuiz) {
    tabContentHtml += `
      <div class="cb-tab-content" id="tab-quiz">
        ${quizHtml}
      </div>
    `;
  }

  el.innerHTML = `
    <div class="cb-lesson-header">
      <h2>${icon} ${escHtml(lesson.Title)}</h2>
      <div class="cb-lesson-meta">
        <span><strong>Loại:</strong> ${lesson.Type}</span>
        <span><strong>Thời lượng:</strong> ${lesson.Duration || 0}s</span>
        <span><strong>Thứ tự:</strong> ${lesson.OrderIndex || 0}</span>
      </div>
    </div>

    <div class="cb-content-display">
      ${contentHtml}
    </div>

    ${tabsHtml ? `
      <div class="cb-tabs-container">
        ${tabsHtml}
        <div class="cb-tabs-content">
          ${tabContentHtml}
        </div>
      </div>
    ` : ''}
  `;
}

window.__switchTab = function(tabName) {
  // Update buttons
  document.querySelectorAll('.cb-tab-btn').forEach(btn => {
    btn.classList.remove('cb-tab-btn--active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('cb-tab-btn--active');
    }
  });

  // Update content
  document.querySelectorAll('.cb-tab-content').forEach(content => {
    content.classList.remove('cb-tab-content--active');
  });
  const activeContent = document.getElementById(`tab-${tabName}`);
  if (activeContent) {
    activeContent.classList.add('cb-tab-content--active');
  }
};

function getPreviewContent(lesson) {
  const url = formatVideoUrl(lesson.ContentUrl);
  
  if (lesson.Type === 'video') {
    if (url) {
      return `<iframe src="${escHtml(url)}" allowfullscreen></iframe>`;
    }
    return '<div class="cb-quiz-preview">📹 Không có video URL</div>';
  } else if (lesson.Type === 'reading') {
    if (lesson.ContentHtml) {
      return `<div class="cb-reading-content">${lesson.ContentHtml}</div>`;
    }
    if (url) {
      return `<div class="cb-reading-content"><a href="${escHtml(url)}" target="_blank" style="color: #5b7be8;">📄 Mở tài liệu</a></div>`;
    }
    return '<div class="cb-quiz-preview">📖 Không có nội dung</div>';
  }
  
  return '<div class="cb-quiz-preview">Không có nội dung</div>';
}

function renderQuizPreview(lesson) {
  const quizzes = lesson.quizzes || [];
  
  if (quizzes.length === 0) {
    return '<div class="cb-quiz-preview">🧠 Chưa có câu hỏi trắc nghiệm</div>';
  }
  
  let html = '<div class="cb-quiz-container">';
  
  quizzes.forEach((quiz, qIdx) => {
    html += `
      <div class="cb-quiz-block">
        <h4 class="cb-quiz-title">Trắc nghiệm ${qIdx + 1}: ${escHtml(quiz.Title || 'Chưa có tiêu đề')}</h4>
    `;
    
    const questions = quiz.questions || [];
    if (questions.length === 0) {
      html += '<p class="cb-no-questions">Chưa có câu hỏi</p>';
    } else {
      questions.forEach((q, pIdx) => {
        html += `
          <div class="cb-question-block">
            <p class="cb-question-text"><strong>Câu ${pIdx + 1}:</strong> ${escHtml(q.QuestionText || q.questiontext)}</p>
        `;
        
        const answers = q.answers || [];
        if (answers.length === 0) {
          html += '<p class="cb-no-answers">Chưa có đáp án</p>';
        } else {
          html += '<div class="cb-answers-list">';
          answers.forEach((a, aIdx) => {
            const isCorrect = a.IsCorrect || a.iscorrect;
            html += `
              <div class="cb-answer-item ${isCorrect ? 'cb-answer--correct' : ''}">
                <span class="cb-answer-label">${String.fromCharCode(65 + aIdx)}.</span>
                <span class="cb-answer-text">${escHtml(a.AnswerText || a.answertext)}</span>
                ${isCorrect ? '<span class="cb-correct-badge">✓ Đúng</span>' : ''}
              </div>
            `;
          });
          html += '</div>';
        }
        
        html += '</div>';
      });
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  return html;
}
