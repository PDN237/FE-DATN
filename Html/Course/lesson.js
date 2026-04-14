
// LMS Lesson Player - Full Dynamic API Integration
// Handles video, reading, quiz with progress tracking

let courseModules = [];
let currentLessonId = null;
let currentCourseId = null;
let quizData = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];
let quizSubmitted = false;
let expandedModules = [];
let videoProgressTracked = false;
let readingProgressTracked = false;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentCourseId = urlParams.get('courseId');
  currentLessonId = urlParams.get('lessonId');
  
  if (!currentCourseId || !currentLessonId) {
    document.body.innerHTML = '<h1 style="text-align:center;padding:4rem">❌ Missing courseId or lessonId</h1>';
    return;
  }
  
  document.querySelector('.sidebar-header p').textContent = 'Loading...';
  
  try {
    // Get logged user ID
    const userId = getLoggedUser();
    console.log('Loading course for user:', userId);
    
    // 1. Load course structure for sidebar with user completion data
    const modulesRes = await window.apiFetch(`/api/courses/courses/${currentCourseId}/modules-lessons?userId=${userId}`);
    courseModules = modulesRes;
    
    // Log completion data for verification
    console.log('Course modules loaded:', courseModules);
    courseModules.forEach((module, mIdx) => {
      module.lessons.forEach((lesson, lIdx) => {
        if (lesson.completed) {
          console.log(`✅ Completed: Module ${mIdx}, Lesson ${lIdx} - ${lesson.title || lesson.Title}`);
        }
      });
    });
    
    // Update sidebar header
    const totalLessons = courseModules.reduce((sum, m) => sum + m.lessons.length, 0);
    const totalDuration = courseModules.reduce((sum, m) => sum + (m.lessons.reduce((s, l) => s + parseFloat(l.duration || 0), 0)), 0);
    document.querySelector('.sidebar-header p').textContent = `${totalLessons} bài học • ${Math.round(totalDuration/60)}h ${totalDuration%60}m`;
    
    updateLessonUI();
    loadLesson(currentLessonId);
    
  } catch (error) {
    console.error('Error loading course:', error);
    document.getElementById('modulesList').innerHTML = `<p style="padding:1rem;color:#ef4444">❌ Lỗi tải khóa học: ${error.message}</p>`;
  }
});

function updateLessonUI() {
  const container = document.getElementById('modulesList');
  container.innerHTML = '';
  
  courseModules.forEach(module => {
    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'module';
    
    // Handle different field naming conventions from API
    const moduleId = module.id || module.ModuleID || module.moduleid;
    const isExpanded = expandedModules.includes(moduleId);
    const hasActiveLesson = module.lessons.some(l => {
      const lessonId = l.id || l.LessonID || l.lessonid;
      return lessonId == currentLessonId;
    });
    
    moduleDiv.innerHTML = `
      <button class="module-header ${hasActiveLesson ? 'active' : ''} ${module.lessons.every(l => l.completed) ? 'completed-module' : ''}" onclick="toggleModule(${moduleId})">
        <span style="${module.lessons.length > 0 && module.lessons.every(l => l.completed) ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${module.title || module.Title}</span>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="module-arrow" style="transform: rotate(${isExpanded ? '180deg' : '0deg'});">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div class="module-lessons ${isExpanded ? 'active' : ''}">
        ${module.lessons.map(lesson => {
          const lessonId = lesson.id || lesson.LessonID || lesson.lessonid;
          return `
          <button class="lesson-item ${lessonId == currentLessonId ? 'active' : ''} ${lesson.completed ? 'completed' : ''}" 
                  onclick="loadLesson(${lessonId})" 
                  title="${lesson.status || ''}">
            <div class="lesson-icon ${lesson.completed ? 'completed' : (lesson.type || lesson.Type)}">
              ${lesson.completed ? '✓' : 
                (lesson.type || lesson.Type) === 'video' ? '▶' : 
                (lesson.type || lesson.Type) === 'reading' ? '📄' : '❓'}
            </div>
            <div class="lesson-info">
              <p class="lesson-title">${lesson.title || lesson.Title}</p>
              <p class="lesson-meta">
                ${(lesson.type || lesson.Type) === 'video' ? 'Video •' : 
                  (lesson.type || lesson.Type) === 'reading' ? 'Đọc •' : 'Quiz •'} 
                ${lesson.duration || lesson.Duration || 'N/A'}
              </p>
            </div>
          </button>
          `;
        }).join('')}
      </div>
    `;
    
    container.appendChild(moduleDiv);
  });
}

function toggleModule(moduleId) {
  const index = expandedModules.indexOf(moduleId);
  if (index > -1) {
    expandedModules.splice(index, 1);
  } else {
    expandedModules.push(moduleId);
  }
  updateLessonUI();
}

async function loadLesson(lessonId) {
  currentLessonId = lessonId;
  
  // Update sidebar active state
  updateLessonUI();
  
  try {
    // Load lesson details
    const lessonRes = await window.apiFetch(`/api/courses/lessons/${lessonId}`);
    const lesson = lessonRes;
    
    // Safe header updates
    const courseNameEl = document.querySelector('.course-name');
    const lessonTitleEl = document.getElementById('lessonTitle');
    const lessonDescEl = document.getElementById('lessonDescription');
    
    if (courseNameEl) courseNameEl.textContent = lesson.Title?.split(' - ')[0] || 'Lesson';
    if (lessonTitleEl) lessonTitleEl.textContent = lesson.Title || 'Loading...';
    
    // Set Describe and Summary
    const descEl = document.getElementById('describeContent');
    if (descEl) descEl.innerHTML = lesson.Describe || '<p style="color:#94a3b8">Chưa có mô tả chi tiết.</p>';
    
    const sumEl = document.getElementById('summaryContent');
    if (sumEl) sumEl.innerHTML = lesson.Summary || '<p style="color:#94a3b8">Chưa có tóm tắt nội dung.</p>';
    
    // Always load quiz data (even for video/reading)
    await loadQuiz(lessonId);
    
    // Handle lesson rendering
    document.getElementById('videoSection').classList.remove('hidden');
    renderMediaContent(lesson);
    switchTab('describe');
    
  } catch (error) {
    console.error('Error loading lesson:', error);
    const lessonTitleEl = document.getElementById('lessonTitle');
    if (lessonTitleEl) lessonTitleEl.textContent = '❌ Lỗi tải bài học';
  }
}

async function loadQuiz(lessonId) {
  const res = await window.apiFetch(`/api/courses/quizzes/${lessonId}`);
  const quiz = res;
  
  // Store for quiz logic
  quizData = quiz;
  currentQuestionIndex = 0;
  selectedAnswers = new Array(quiz.questions.length).fill(null);
  quizSubmitted = false;
  
  showQuiz();
  renderQuestion();
}

function formatMediaUrl(url) {
  if (!url) return '';
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch && ytMatch[2].length === 11) {
    return 'https://www.youtube.com/embed/' + ytMatch[2];
  }
  const driveRegex = /(?:drive\.google\.com\/)(?:file\/d\/|open\?id=)([a-zA-Z0-9_\-]+)/;
  const driveMatch = url.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return url;
}

function safeRenderIframe(url, fallbackText = 'Nội dung không khả dụng') {
  try {
    const formattedUrl = formatMediaUrl(url);
    // Always try iframe first, let browser handle blocking
    return `<iframe src="${formattedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:8px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"></iframe>`;
  } catch (e) {
    console.warn('Invalid URL for iframe:', url);
    return `<div style="padding:2rem;text-align:center;color:#64748b;display:none;">Iframe error fallback</div>`;
  }
}

async function renderMediaContent(lesson) {
  try {
    videoProgressTracked = false;
    readingProgressTracked = false;
    
    // Safe section toggles
    const videoSection = document.getElementById('videoSection');
    if (videoSection) videoSection.classList.remove('hidden');
    
    const player = document.querySelector('.video-player');
    const placeholder = document.querySelector('.video-placeholder');
    
    if (!player) {
      console.warn('Video player element not found');
      return;
    }
    
    // Clear existing content
    player.innerHTML = '';
    
    // Video handling with progress tracking
    if (lesson.Type === 'video' && lesson.embedUrl) {
      player.innerHTML = safeRenderIframe(lesson.embedUrl, 'Video không khả dụng');
      if (placeholder) placeholder.style.display = 'none';
      trackVideoProgress(player.querySelector('iframe'));
    } else if (lesson.Type === 'video' && lesson.ContentUrl) {
      player.innerHTML = safeRenderIframe(lesson.ContentUrl, 'Video URL không hợp lệ');
      trackVideoProgress(player.querySelector('iframe'));
    } else {
      // Default placeholder
      if (placeholder) {
        placeholder.innerHTML = '<div class="play-button"><svg class="play-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div><p style="color:#64748b;">Chưa có video</p>';
      }
    }
    
    // Reading/PDF handling with smart display
    if (lesson.Type === 'reading') {
      let contentHtml = '';
      
      // Check if both content types exist
      const hasHtml = lesson.ContentHtml && lesson.ContentHtml.trim();
      const hasUrl = lesson.ContentUrl && lesson.ContentUrl.trim;
      
      if (hasHtml && hasUrl) {
        // Both exist - show tabbed interface
        contentHtml = `
          <div class="reading-tabs">
            <div class="reading-tab-buttons">
              <button class="reading-tab-btn active" onclick="switchReadingTab('html')">Nội dung HTML</button>
              <button class="reading-tab-btn" onclick="switchReadingTab('url')">Tài liệu (${lesson.ContentUrl.split('/').pop()})</button>
            </div>
            <div class="reading-tab-content">
              <div id="readingHtmlTab" class="reading-tab-panel active">
                <div class="reading-container">
                  <div class="reading-content">${lesson.ContentHtml}</div>
                </div>
              </div>
              <div id="readingUrlTab" class="reading-tab-panel">
                ${lesson.ContentUrl.includes('.pdf') 
                  ? safeRenderIframe(lesson.ContentUrl + '#toolbar=0&navpanes=0', 'PDF không tải được')
                  : safeRenderIframe(lesson.ContentUrl, 'Tài liệu không khả dụng')}
              </div>
            </div>
          </div>
        `;
      } else if (hasHtml) {
        // Only HTML content
        contentHtml = `
          <div class="reading-container">
            <div class="reading-content">${lesson.ContentHtml}</div>
          </div>
        `;
      } else if (hasUrl) {
        // Only URL content
        contentHtml = lesson.ContentUrl.includes('.pdf') 
          ? safeRenderIframe(lesson.ContentUrl + '#toolbar=0&navpanes=0', 'PDF không tải được')
          : safeRenderIframe(lesson.ContentUrl, 'Tài liệu không khả dụng');
      } else {
        // No content
        contentHtml = '<div class="no-content"><p>Chưa có nội dung cho bài học này.</p></div>';
      }
      
      player.innerHTML = `<div class="reading-wrapper">${contentHtml}</div>`;
      
      // Track progress on the wrapper
      trackReadingProgress(player.querySelector('.reading-wrapper'));
    }
    
    // Transcript and other legacy content removal
    
  } catch (error) {
    console.error('Error in renderMediaContent:', error);
    const player = document.querySelector('.video-player');
    if (player) {
      player.innerHTML = '<div style="padding:3rem;text-align:center;color:#ef4444;">❌ Lỗi hiển thị nội dung</div>';
    }
  }
}

function showQuiz() {
  document.getElementById('videoSection').classList.add('hidden');
  switchTab('quiz');
}

function renderQuestion() {
  if (!quizData || !quizData.questions[currentQuestionIndex]) return;
  
  const question = quizData.questions[currentQuestionIndex];
  
  document.getElementById('quizProgress').textContent = `Câu ${currentQuestionIndex + 1}/${quizData.questions.length}`;
  document.getElementById('quizProgressBar').style.width = `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`;
  document.getElementById('questionText').textContent = question.question;
  
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = question.options.map((optionText, optionIndex) => {
    const isSelected = selectedAnswers[currentQuestionIndex] === optionIndex;
    const isCorrect = optionIndex === question.correctAnswer;
    const showResult = quizSubmitted;
    
    let className = 'option';
    if (showResult && isCorrect) className += ' correct';
    else if (showResult && isSelected && !isCorrect) className += ' wrong';
    else if (isSelected) className += ' selected';
    
    if (showResult) className += ' disabled';
    
    return `
      <div class="${className}" onclick="${showResult ? '' : `selectAnswer(${optionIndex})`}"> 
        <div class="option-radio">
          ${showResult && (isCorrect || (isSelected && !isCorrect)) ? (isCorrect ? '✓' : '✗') : ''}
        </div>
        <span>${optionText}</span>
      </div>
    `;
  }).join('');
  
  // Explanation
  const explanationContainer = document.getElementById('explanationContainer');
  if (quizSubmitted && question.explanation) {
    explanationContainer.classList.remove('hidden');
    explanationContainer.innerHTML = `
      <div class="explanation">
        <div class="explanation-title">Giải thích:</div> 
        <div class="explanation-text">${question.explanation}</div>
      </div>
    `;
  } else {
    explanationContainer.classList.add('hidden');
  }
  
  // Navigation buttons
  document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
  
  const nextBtn = document.getElementById('nextBtn');
  if (currentQuestionIndex === quizData.questions.length - 1) {
    if (quizSubmitted) {
      nextBtn.textContent = 'Xem lại';
      nextBtn.onclick = showResults;
    } else {
      nextBtn.textContent = 'Nộp bài';
      nextBtn.onclick = submitQuiz;
      nextBtn.disabled = selectedAnswers[currentQuestionIndex] === null;
    }
  } else {
    nextBtn.textContent = 'Câu sau';
    nextBtn.onclick = nextQuestion;
    nextBtn.disabled = selectedAnswers[currentQuestionIndex] === null && !quizSubmitted;
  }
}

function selectAnswer(optionIndex) {
  if (quizSubmitted) return;
  selectedAnswers[currentQuestionIndex] = optionIndex;
  renderQuestion();
}

function nextQuestion() {
  if (currentQuestionIndex < quizData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

async function submitQuiz() {
  quizSubmitted = true;
  
  const score = selectedAnswers.filter((ans, idx) => ans === quizData.questions[idx].correctAnswer).length;
  const percentage = Math.round((score / quizData.questions.length) * 100);
  
  console.log('Quiz score:', percentage + '%');
  
  // Only mark lesson as complete if score >= 70%
  if (percentage >= 70) {
    await completeLesson();
  } else {
    // Show message that they need to retake the quiz
    showCompletionNotification(false, percentage);
  }
  
  renderQuestion();
}

function showResults() {
  document.getElementById('quizMain').classList.add('hidden');
  document.getElementById('resultsSection').classList.remove('hidden');
  
  const score = selectedAnswers.filter((ans, idx) => ans === quizData.questions[idx].correctAnswer).length;
  const percentage = Math.round((score / quizData.questions.length) * 100);
  
  document.getElementById('scoreNumber').textContent = `${score}/${quizData.questions.length}`;
  document.getElementById('scorePercentage').textContent = `Điểm: ${percentage}%`;
  
  // Check if passed (>= 70%)
  const passed = percentage >= 70;
  let message;
  if (passed) {
    message = percentage >= 90 ? '🎉 Xuất sắc!' : 
              percentage >= 80 ? '👍 Tốt!' : '✅ Đạt yêu cầu!';
  } else {
    message = '📚 Cần đạt 70% để hoàn thành bài học';
  }
  document.getElementById('scoreMessage').textContent = message;
  
  // Show completion badge
  const completionBadge = document.getElementById('completionBadge');
  const completionBadgeText = document.getElementById('completionBadgeText');
  completionBadge.classList.remove('hidden');
  completionBadge.classList.remove('passed', 'failed');
  if (passed) {
    completionBadge.classList.add('passed');
    completionBadgeText.textContent = '✓ Hoàn thành bài học';
  } else {
    completionBadge.classList.add('failed');
    completionBadgeText.textContent = '⚠️ Chưa hoàn thành';
  }
  
  // Update circle color based on pass/fail
  const scoreCircle = document.getElementById('scoreCircle');
  if (passed) {
    scoreCircle.style.stroke = '#22c55e';
  } else {
    scoreCircle.style.stroke = '#f59e0b';
  }
  
  // Circle animation
  const circumference = 2 * Math.PI * 88;
  document.getElementById('scoreCircle').style.strokeDashoffset = circumference - (percentage / 100 * circumference);
  
  // Review questions
  const reviewContent = document.getElementById('reviewContent');
  reviewContent.innerHTML = quizData.questions.map((q, idx) => {
    const userAns = selectedAnswers[idx];
    const isCorrect = userAns === q.correctAnswer;
    return `
      <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-header">
          <div class="review-icon ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? '✓' : '✗'}
          </div>
          <p class="review-question">Q${idx+1}: ${q.question}</p>
        </div>
        ${!isCorrect ? `
          <p class="review-answer user">Bạn chọn: ${q.options[userAns]}</p>
          <p class="review-answer correct">Đúng: ${q.options[q.correctAnswer]}</p>
        ` : ''}
      </div>
    `;
  }).join('');
}

function retryQuiz() {
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('quizMain').classList.remove('hidden');
  quizSubmitted = false;
  currentQuestionIndex = 0;
  selectedAnswers = new Array(quizData.questions.length).fill(null);
  renderQuestion();
}

function switchTab(tabId, targetBtn = event?.target) {
  // Update tabs
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  if (targetBtn) {
    targetBtn.classList.add('active');
  } else {
    // If called via code, find the button by its onclick function parameter
    const allBtns = document.querySelectorAll('.tab-btn');
    for (let btn of allBtns) {
      if (btn.getAttribute('onclick')?.includes(tabId)) {
        btn.classList.add('active');
        break;
      }
    }
  }
  
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  const targetPanel = document.getElementById(tabId + 'Tab');
  if (targetPanel) targetPanel.classList.add('active');
}

function switchReadingTab(tabType) {
  // Update reading tab buttons
  document.querySelectorAll('.reading-tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update reading tab panels
  document.querySelectorAll('.reading-tab-panel').forEach(panel => panel.classList.remove('active'));
  
  if (tabType === 'html') {
    document.getElementById('readingHtmlTab').classList.add('active');
  } else if (tabType === 'url') {
    document.getElementById('readingUrlTab').classList.add('active');
  }
}



function trackVideoProgress(iframe) {
  if (!iframe) return;
  
  const handleMessage = (event) => {
    // Listen for YouTube/Vimeo/other player events
    if (event.data && (event.data.playerState || event.data.event === 'timeupdate')) {
      const percent = event.data.percent || (event.data.time / event.data.duration * 100) || 0;
      if (percent >= 70 && !videoProgressTracked) {
    // Only track scroll, don't mark as complete (must complete quiz)
      }
    }
  };
  
  window.addEventListener('message', handleMessage);
  // Cleanup after 30s
  setTimeout(() => window.removeEventListener('message', handleMessage), 30000);
}

function trackReadingProgress(container) {
  if (!container) return;
  
  let scrollProgress = 0;
  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    scrollProgress = ((scrollTop + clientHeight) / scrollHeight) * 100;
    if (scrollProgress >= 70 && !readingProgressTracked) {
    // Only track scroll, don't mark as complete (must complete quiz)
    }
  };
  
  container.addEventListener('scroll', handleScroll, { passive: true });
  // Cleanup on lesson change
  container.addEventListener('transitionend', () => container.removeEventListener('scroll', handleScroll));
}

  // Do not complete lesson on video end, must pass quiz

function getLoggedUser() {
  try {
    // Try to get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Handle different user ID field names
      return user.id || user.UserID || user.userid || user.userId || 
             parseInt(localStorage.getItem('userId')) || 1;
    }
    // Fallback to userId in localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      return parseInt(userId);
    }
    // Default to user ID 1 for testing
    console.warn('No user ID found, using default ID 1');
    return 1;
  } catch (error) {
    console.error('Error getting logged user:', error);
    return 1;
  }
}

async function completeLesson() {
  try {
    const userId = getLoggedUser();
    await window.apiFetch('/api/courses/lesson/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        lessonId: currentLessonId
      })
    });

    // Update user score
    try {
      const scoreRes = await window.apiFetch('/api/profile/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lessonId: currentLessonId
        })
      });

      if (scoreRes.success && scoreRes.pointsEarned > 0) {
        showScoreNotification(scoreRes.pointsEarned);
      }
    } catch (scoreError) {
      console.error('Failed to update score:', scoreError);
    }

    // Show success notification
    showCompletionNotification();

    console.log('✅ Lesson marked complete:', currentLessonId, 'user:', userId);

    // Refresh data from backend with userId
    const modulesRes = await window.apiFetch(`/api/courses/courses/${currentCourseId}/modules-lessons?userId=${userId}`);
    courseModules = modulesRes;
    updateLessonUI();

    // Check if course is completed
    checkCourseCompletion();
  } catch (error) {
    console.error('❌ Failed to mark complete:', error);
  }
}

async function checkCourseCompletion() {
  try {
    const userId = getLoggedUser();
    const progressRes = await window.apiFetch(`/api/courses/courses/${currentCourseId}/progress?userId=${userId}`);
    
    if (progressRes.courseCompleted) {
      // Get course points and add to user account
      try {
        const pointsRes = await window.apiFetch('/api/profile/add-course-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            courseId: currentCourseId
          })
        });

        if (pointsRes.success) {
          showCourseCompletionNotification(pointsRes.pointsEarned);
        } else {
          showCourseCompletionNotification(0);
        }
      } catch (pointsError) {
        console.error('Failed to add course points:', pointsError);
        showCourseCompletionNotification(0);
      }
    }
  } catch (error) {
    console.error('Error checking course completion:', error);
  }
}

function showCourseCompletionNotification(pointsEarned = 0) {
  // Remove existing notification
  const existing = document.querySelector('.course-completion-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'course-completion-notification';
  
  let pointsMessage = '';
  if (pointsEarned > 0) {
    pointsMessage = `
      <div style="
        background: rgba(255, 255, 255, 0.2);
        padding: 16px 24px; border-radius: 12px;
        margin-bottom: 24px; display: inline-block;
      ">
        <div style="font-size: 36px; font-weight: 800; margin-bottom: 4px;">+${pointsEarned}</div>
        <div style="font-size: 14px; opacity: 0.9;">điểm đã được cộng vào tài khoản của bạn</div>
      </div>
    `;
  }

  notification.innerHTML = `
    <div style="
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #0891b2, #06b6d4);
      color: white; padding: 40px 48px; border-radius: 20px;
      box-shadow: 0 20px 60px rgba(8, 145, 178, 0.4);
      z-index: 10000; max-width: 500px; text-align: center;
      animation: slideIn 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
    ">
      <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
      <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 12px;">Chúc mừng!</h2>
      <p style="font-size: 16px; opacity: 0.95; line-height: 1.6; margin-bottom: 24px;">
        Bạn đã hoàn thành toàn bộ khóa học này.<br>
        Hãy tiếp tục nỗ lực để đạt được nhiều thành tựu hơn!
      </p>
      ${pointsMessage}
      <button onclick="window.location.href='../Course/course.html'" style="
        background: white; color: #0891b2; padding: 12px 32px;
        border: none; border-radius: 10px; font-size: 16px;
        font-weight: 700; cursor: pointer; transition: all 0.3s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        Quay về trang khóa học
      </button>
    </div>
    <style>
      @keyframes slideIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    </style>
  `;

  document.body.appendChild(notification);
}

function showScoreNotification(points) {
  // Remove existing score notification
  const existing = document.querySelector('.score-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'score-notification';
  notification.innerHTML = `
    <div style="
      position: fixed; top: 20px; right: 20px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white; padding: 16px 24px; border-radius: 12px;
      box-shadow: 0 10px 25px rgba(251, 191, 36, 0.4);
      z-index: 10001; max-width: 350px;
      font-weight: 600; font-size: 15px;
      transform: translateX(400px); transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
      display: flex; align-items: center; gap: 10px;
    ">
      <span style="font-size: 24px;">⭐</span>
      <div>
        <div>+${points} điểm</div>
        <small style="font-weight: 400; opacity: 0.9;">Đã cộng vào tài khoản của bạn</small>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Slide in animation
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });

  // Auto remove after 3s
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

function showCompletionNotification(isSuccess = true, score = 0) {
  // Remove existing notification
  const existing = document.querySelector('.completion-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'completion-notification';

  if (isSuccess) {
    notification.innerHTML = `
      <div style="
        position: fixed; top: 100px; right: 20px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white; padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 10px 25px rgba(34,197,94,0.4);
        z-index: 10000; max-width: 350px;
        font-weight: 600; font-size: 15px;
        transform: translateX(400px); transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
      ">
        🎉 Hoàn thành bài học!<br>
        <small style="font-weight: 400; opacity: 0.9;">Đã cập nhật tiến độ học tập</small>
      </div>
    `;
  } else {
    notification.innerHTML = `
      <div style="
        position: fixed; top: 100px; right: 20px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white; padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 10px 25px rgba(245,158,11,0.4);
        z-index: 10000; max-width: 350px;
        font-weight: 600; font-size: 15px;
        transform: translateX(400px); transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
      ">
        ⚠️ Chưa hoàn thành bài học<br>
        <small style="font-weight: 400; opacity: 0.9;">Điểm: ${score}% - Cần đạt 70% để hoàn thành</small>
      </div>
    `;
  }

  document.body.appendChild(notification);

  // Slide in animation
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });

  // Auto remove after 4s
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 400);
  }, 4000);
}

function togglePlay() {
  const iframe = document.querySelector('.video-player iframe');
  if (iframe) iframe.src = iframe.src; // restart
}

async function loadCourseProgress() {
  if (!currentCourseId) return null;
  try {
    const userId = getLoggedUser();
    const res = await window.apiFetch(`/api/courses/courses/${currentCourseId}/progress?userId=${userId}`);
    return res;
  } catch (error) {
    console.error('Failed to load course progress:', error);
    return null;
  }
}

