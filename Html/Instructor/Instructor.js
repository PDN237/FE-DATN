document.addEventListener('DOMContentLoaded', () => {
    const API = 'https://be-datn-6gb6.onrender.com/api/instructor';

    // ---- Get userId & courseId ----
    let userId = 1;
    try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u && u.id) userId = u.id;
    } catch (e) {}

    const params = new URLSearchParams(window.location.search);
    const courseId = parseInt(params.get('courseId'));

    if (!courseId) {
        document.getElementById('moduleTree').innerHTML = '<p style="padding:40px;text-align:center;color:#94a3b8;">Không tìm thấy courseId trong URL.</p>';
        return;
    }

    // ---- State ----
    let courseData = null;
    let modulesData = [];
    let activeLesson = null;
    let deleteTarget = null;

    // ---- Toast ----
    function showToast(msg, type = 'success') {
        const t = document.getElementById('insToast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'ins-toast ' + type + ' show';
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.className = 'ins-toast'; }, 3200);
    }

    // ---- Helpers ----
    function escHtml(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    function formatVideoUrl(url) {
        if (!url) return '';
        const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&#?]+)/);
        if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
        const dr = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        if (dr) return `https://drive.google.com/file/d/${dr[1]}/preview`;
        return url;
    }

    function openModal(id) { document.getElementById(id).classList.add('active'); }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }

    // Close modals on backdrop click
    document.querySelectorAll('.ins-modal-backdrop').forEach(el => {
        el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
    });

    // ============================================================
    // LOAD COURSE TREE
    // ============================================================
    async function loadCourseTree() {
        try {
            const res = await fetch(`${API}/course/${courseId}?userId=${userId}`);
            const data = await res.json();

            if (!data.success) {
                document.getElementById('moduleTree').innerHTML = `<p style="padding:40px;text-align:center;color:#ee5a6f;">${data.message || 'Lỗi tải khóa học'}</p>`;
                return;
            }

            courseData = data.course;
            modulesData = data.modules || [];

            document.getElementById('courseTitle').textContent = courseData.Title;
            document.getElementById('courseLevel').textContent = courseData.Level || 'Cơ bản';
            document.getElementById('moduleCount').textContent = `${modulesData.length} module`;
            document.title = `${courseData.Title} – Quản lý | Teen Lab`;

            updateStatusUI(courseData);
            renderTree();
        } catch (err) {
            console.error('loadCourseTree:', err);
            document.getElementById('moduleTree').innerHTML = '<p style="padding:40px;text-align:center;color:#94a3b8;">Không thể kết nối đến máy chủ.</p>';
        }
    }

    function updateStatusUI(course) {
        const statusEl = document.getElementById('courseStatus');
        const btn = document.getElementById('btnSubmitReview');
        const label = document.getElementById('submitLabel');
        const banner = document.getElementById('feedbackBanner');
        const feedbackText = document.getElementById('feedbackText');
        const updateBtn = document.getElementById('btnSendUpdate');

        // Status badge
        if (course.Accept && course.IsCompleted) {
            statusEl.textContent = '✓ Đã xuất bản';
            statusEl.className = 'ins-status-badge ins-status--published';
            btn.disabled = true;
            btn.classList.add('ins-btn--disabled');
            label.textContent = 'Đã xuất bản';
            // Show update button for published courses
            updateBtn.style.display = 'inline-flex';
        } else if (course.Accept && !course.IsCompleted) {
            statusEl.textContent = '⏳ Đang chờ duyệt';
            statusEl.className = 'ins-status-badge ins-status--pending';
            btn.disabled = true;
            btn.classList.add('ins-btn--disabled');
            label.textContent = 'Đang chờ duyệt...';
            // Hide update button for pending courses
            updateBtn.style.display = 'none';
        } else if (!course.Accept && course.Feedback) {
            statusEl.textContent = '✕ Bị từ chối';
            statusEl.className = 'ins-status-badge ins-status--rejected';
            btn.disabled = false;
            btn.classList.remove('ins-btn--disabled');
            label.textContent = 'Gửi lại yêu cầu';
            // Hide update button for rejected courses
            updateBtn.style.display = 'none';
        } else {
            statusEl.textContent = 'Đang soạn';
            statusEl.className = 'ins-status-badge ins-status--draft';
            btn.disabled = false;
            btn.classList.remove('ins-btn--disabled');
            label.textContent = 'Gửi yêu cầu xuất bản';
            // Hide update button for draft courses
            updateBtn.style.display = 'none';
        }

        // Feedback banner
        if (!course.Accept && course.Feedback) {
            banner.style.display = 'block';
            feedbackText.textContent = course.Feedback;
        } else {
            banner.style.display = 'none';
        }
    }

    // ============================================================
    // RENDER MODULE TREE
    // ============================================================
    function renderTree() {
        const container = document.getElementById('moduleTree');

        if (modulesData.length === 0) {
            container.innerHTML = `
                <div class="ins-tree-empty">
                    <div class="ins-tree-empty-icon">📦</div>
                    <h4>Chưa có module nào</h4>
                    <p>Nhấn "Thêm Module" ở trên để bắt đầu xây dựng khóa học.</p>
                </div>`;
            return;
        }

        container.innerHTML = modulesData.map((mod, idx) => {
            const lessonsHtml = (mod.lessons || []).map(lesson => {
                const icon = lesson.Type === 'video' ? '📹' : lesson.Type === 'reading' ? '📖' : '🧠';
                const isActive = activeLesson && activeLesson.LessonID === lesson.LessonID;
                return `
                    <div class="ins-lesson-node ${isActive ? 'active' : ''}" data-lid="${lesson.LessonID}">
                        <div class="ins-lesson-info" onclick="window.__selectLesson(${lesson.LessonID})">
                            <span class="ins-lesson-icon">${icon}</span>
                            <span class="ins-lesson-title">${escHtml(lesson.Title)}</span>
                            <span class="ins-lesson-type-badge ins-lesson-type--${lesson.Type}">${lesson.Type}</span>
                        </div>
                        <div class="ins-lesson-actions">
                            <button class="ins-action-sm ins-action-sm--danger" title="Xóa bài học"
                                onclick="event.stopPropagation(); window.__confirmDel('lesson', ${lesson.LessonID}, '${escHtml(lesson.Title).replace(/'/g, "\\'")}')">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            </button>
                        </div>
                    </div>`;
            }).join('');

            return `
                <div class="ins-module-block">
                    <div class="ins-module-header">
                        <div class="ins-module-left">
                            <span class="ins-module-number">${idx + 1}</span>
                            <h3 class="ins-module-name">${escHtml(mod.Title)}</h3>
                            <span class="ins-module-count">${(mod.lessons || []).length} bài</span>
                        </div>
                        <div class="ins-module-actions">
                            <button class="ins-action-sm ins-action-sm--add" title="Thêm bài học"
                                onclick="window.__openAddLesson(${mod.ModuleID})">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            </button>
                            <button class="ins-action-sm ins-action-sm--edit" title="Sửa module"
                                onclick="window.__openEditModule(${mod.ModuleID}, '${escHtml(mod.Title).replace(/'/g, "\\'")}')">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2"/></svg>
                            </button>
                            <button class="ins-action-sm ins-action-sm--danger" title="Xóa module"
                                onclick="window.__confirmDel('module', ${mod.ModuleID}, '${escHtml(mod.Title).replace(/'/g, "\\'")}')">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="ins-lessons-list">
                        ${lessonsHtml || '<div class="ins-no-lessons">Chưa có bài học</div>'}
                    </div>
                </div>`;
        }).join('');
    }

    // ============================================================
    // LESSON EDITOR (right panel)
    // ============================================================
    window.__selectLesson = async function (lessonId) {
        try {
            const res = await fetch(`${API}/lessons/${lessonId}`);
            const data = await res.json();
            if (!data.success) { showToast(data.message || 'Lỗi tải bài học', 'error'); return; }

            activeLesson = data.lesson;
            renderEditor(data.lesson);
            renderTree(); // update active state
        } catch (err) {
            showToast('Không thể tải bài học', 'error');
        }
    };

    function renderEditor(lesson) {
        document.getElementById('editorEmpty').style.display = 'none';
        const el = document.getElementById('lessonEditorContent');
        el.style.display = 'block';

        const icon = lesson.Type === 'video' ? '📹' : lesson.Type === 'reading' ? '📖' : '🧠';

        el.innerHTML = `
            <div class="ins-editor-header">
                <h2>${icon} <span id="edTitleDisplay">${escHtml(lesson.Title)}</span></h2>
                <div class="ins-editor-actions">
                    <button class="ins-btn ins-btn--primary" id="btnSaveLesson">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Lưu thay đổi
                    </button>
                </div>
            </div>

            <div class="ins-editor-form">
                <!-- Row 1: Title + Type -->
                <div class="ins-editor-row">
                    <div class="ins-form-group ins-fg-flex">
                        <label class="ins-label">Tiêu đề bài học</label>
                        <input type="text" class="ins-input" id="edTitle" value="${escHtml(lesson.Title)}" />
                    </div>
                    <div class="ins-form-group">
                        <label class="ins-label">Loại</label>
                        <select class="ins-input ins-select" id="edType">
                            <option value="video" ${lesson.Type === 'video' ? 'selected' : ''}>📹 Video</option>
                            <option value="reading" ${lesson.Type === 'reading' ? 'selected' : ''}>📖 Bài đọc</option>
                            <option value="quiz" ${lesson.Type === 'quiz' ? 'selected' : ''}>🧠 Quiz</option>
                        </select>
                    </div>
                </div>

                <!-- Row 2: Duration + Order -->
                <div class="ins-editor-row">
                    <div class="ins-form-group">
                        <label class="ins-label">Thời lượng (giây)</label>
                        <input type="number" class="ins-input" id="edDuration" value="${lesson.Duration || 0}" min="0" />
                    </div>
                    <div class="ins-form-group">
                        <label class="ins-label">Thứ tự hiển thị</label>
                        <input type="number" class="ins-input" id="edOrder" value="${lesson.OrderIndex || 0}" min="0" />
                    </div>
                </div>
                <div class="ins-editor-row">
                    <div class="ins-form-group">
                        <label class="ins-label">Điểm số</label>
                        <input type="number" class="ins-input" id="edScore" value="${lesson.score || 0}" min="0" />
                    </div>
                </div>

                <!-- Content URL (hidden for quiz) -->
                <div class="ins-form-group" id="urlGroup" style="display:${lesson.Type === 'quiz' ? 'none' : 'block'}">
                    <label class="ins-label">🔗 URL nội dung (YouTube / PDF / Google Drive)</label>
                    <input type="url" class="ins-input" id="edContentUrl" value="${escHtml(lesson.ContentUrl)}"
                        placeholder="https://youtube.com/watch?v=... hoặc link PDF" />
                </div>

                <!-- Preview (hidden for quiz) -->
                <div class="ins-preview-box" id="previewBox" style="display:${lesson.Type === 'quiz' ? 'none' : 'block'}">${getPreview(lesson)}</div>

                <!-- Content HTML (reading only) -->
                <div class="ins-form-group" id="htmlGroup" style="display:${lesson.Type === 'reading' ? 'block' : 'none'}">
                    <label class="ins-label">📝 Nội dung HTML (dùng khi không có URL)</label>
                    <textarea class="ins-input ins-textarea" id="edContentHtml" rows="5" placeholder="<h3>Tiêu đề</h3><p>Nội dung...</p>">${escHtml(lesson.ContentHtml)}</textarea>
                </div>

                <!-- Describe -->
                <div class="ins-form-group">
                    <label class="ins-label">📋 Mô tả chi tiết</label>
                    <textarea class="ins-input ins-textarea" id="edDescribe" rows="10" placeholder="Mô tả chi tiết bài học...">${escHtml(lesson.Describe)}</textarea>
                </div>

                <!-- Summary -->
                <div class="ins-form-group">
                    <label class="ins-label">📌 Tóm tắt nội dung</label>
                    <textarea class="ins-input ins-textarea" id="edSummary" rows="6" placeholder="Tóm tắt ngắn gọn...">${escHtml(lesson.Summary)}</textarea>
                </div>

                <!-- Quiz Section -->
                <div class="ins-quiz-section" id="quizSection">
                    <div class="ins-quiz-header">
                        <h3>🧠 Quản lý câu hỏi trắc nghiệm</h3>
                        <button class="ins-quiz-add-btn" id="btnAddQuestion">+ Thêm câu hỏi</button>
                    </div>
                    <div id="questionsContainer">
                        <div class="ins-loading"><div class="ins-spinner"></div><span>Tải quiz...</span></div>
                    </div>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById('edTitle').oninput = function () {
            document.getElementById('edTitleDisplay').textContent = this.value || 'Bài học';
        };
        document.getElementById('edType').onchange = function () {
            const type = this.value;
            document.getElementById('urlGroup').style.display = type === 'quiz' ? 'none' : 'block';
            document.getElementById('previewBox').style.display = type === 'quiz' ? 'none' : 'block';
            document.getElementById('htmlGroup').style.display = type === 'reading' ? 'block' : 'none';
            // Update icon
            const icon = type === 'video' ? '📹' : type === 'reading' ? '📖' : '🧠';
            document.querySelector('.ins-editor-header h2').innerHTML = `${icon} <span id="edTitleDisplay">${document.getElementById('edTitle').value || 'Bài học'}</span>`;
        };
        document.getElementById('edContentUrl').oninput = function () {
            document.getElementById('previewBox').innerHTML = getPreview({
                Type: document.getElementById('edType').value,
                ContentUrl: this.value,
                ContentHtml: document.getElementById('edContentHtml')?.value || ''
            });
        };
        document.getElementById('btnSaveLesson').onclick = () => saveLesson(lesson.LessonID);

        // Load Quiz
        loadQuiz(lesson.LessonID);
    }

    function getPreview(lesson) {
        const url = formatVideoUrl(lesson.ContentUrl);
        if (url) return `<iframe src="${escHtml(url)}" width="100%" style="aspect-ratio:16/9;min-height:280px;border:none;border-radius:10px;" allowfullscreen></iframe>`;
        if (lesson.Type === 'reading' && lesson.ContentHtml) return `<div class="ins-reading-preview">${lesson.ContentHtml}</div>`;
        return '<div class="ins-preview-placeholder">Nhập URL để xem trước nội dung</div>';
    }

    async function saveLesson(lessonId) {
        const fd = {
            Title: document.getElementById('edTitle').value.trim(),
            Type: document.getElementById('edType').value,
            Duration: parseInt(document.getElementById('edDuration').value) || 0,
            OrderIndex: parseInt(document.getElementById('edOrder').value) || 0,
            ContentUrl: document.getElementById('edContentUrl').value.trim(),
            ContentHtml: document.getElementById('edContentHtml')?.value || '',
            Describe: document.getElementById('edDescribe').value.trim(),
            Summary: document.getElementById('edSummary').value.trim(),
            score: parseInt(document.getElementById('edScore').value) || 0
        };
        if (!fd.Title) { showToast('Tiêu đề không được để trống', 'error'); return; }

        const btn = document.getElementById('btnSaveLesson');
        btn.disabled = true; btn.textContent = 'Đang lưu...';
        try {
            const res = await fetch(`${API}/lessons/${lessonId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd) });
            const data = await res.json();
            if (data.success) { 
                showToast('✅ Lưu bài học thành công!'); 
                loadCourseTree(); 
            }
            else showToast(data.message || 'Lỗi', 'error');
        } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
        finally {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Lưu thay đổi';
        }
    }

    // ============================================================
    // QUIZ EDITOR (embedded in lesson editor)
    // ============================================================
    let currentQuiz = null;
    let currentQuestions = [];

    async function loadQuiz(lessonId) {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        try {
            // Get or create quiz
            const qRes = await fetch(`${API}/quizzes/${lessonId}`);
            let quizzes = qRes.ok ? await qRes.json() : [];
            let quiz = quizzes.length > 0 ? quizzes[0] : null;

            if (!quiz) {
                const createRes = await fetch(`${API}/quizzes`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ LessonID: lessonId, Title: 'Quiz' })
                });
                if (createRes.ok) { const d = await createRes.json(); quiz = d.quiz || d; }
                else { container.innerHTML = '<div class="ins-quiz-empty">Không thể tạo trắc nghiệm.</div>'; return; }
            }

            currentQuiz = quiz;
            const quizId = quiz.QuizID || quiz.quizid;

            // Get questions
            const qsRes = await fetch(`${API}/questions/${quizId}`);
            let questions = qsRes.ok ? await qsRes.json() : [];

            // Get answers for each question
            for (let q of questions) {
                const qId = q.QuestionID || q.questionid;
                const aRes = await fetch(`${API}/answers/${qId}`);
                q.answers = aRes.ok ? await aRes.json() : [];
            }

            currentQuestions = questions;
            renderQuiz(lessonId);
        } catch (err) {
            console.error('loadQuiz:', err);
            container.innerHTML = '<div class="ins-quiz-empty">Lỗi tải trắc nghiệm.</div>';
        }
    }

    function renderQuiz(lessonId) {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        if (currentQuestions.length === 0) {
            container.innerHTML = '<div class="ins-quiz-empty">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu!</div>';
        } else {
            container.innerHTML = currentQuestions.map((q, idx) => buildQuestionCard(q, idx)).join('');
        }

        // Bind add question
        const addBtn = document.getElementById('btnAddQuestion');
        if (addBtn) {
            addBtn.onclick = async () => {
                const quizId = currentQuiz.QuizID || currentQuiz.quizid;
                try {
                    const res = await fetch(`${API}/questions`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ QuizID: quizId, QuestionText: 'Câu hỏi mới', Explanation: '' })
                    });
                    if (res.ok) { showToast('✅ Đã thêm câu hỏi!'); loadQuiz(lessonId); }
                } catch (err) { showToast('Lỗi thêm câu hỏi', 'error'); }
            };
        }

        // Bind question events
        bindQuizEvents(lessonId);
    }

    function buildQuestionCard(q, idx) {
        const qId = q.QuestionID || q.questionid;
        const answersHtml = (q.answers || []).map(a => {
            const aId = a.AnswerID || a.answerid;
            const isCorrect = a.IsCorrect || a.iscorrect;
            return `
                <div class="ins-answer-row">
                    <input type="radio" name="correct_q${qId}" data-qid="${qId}" data-aid="${aId}" ${isCorrect ? 'checked' : ''} />
                    <input type="text" class="ins-answer-text" data-qid="${qId}" data-aid="${aId}" value="${escHtml(a.AnswerText || a.answertext)}" placeholder="Nhập câu trả lời..." />
                    <button class="ins-answer-delete" data-aid="${aId}" title="Xóa đáp án">✕</button>
                </div>`;
        }).join('');

        return `
            <div class="ins-question-card" data-qid="${qId}">
                <div class="ins-question-top">
                    <h4><span class="ins-question-number">${idx + 1}</span> Câu hỏi</h4>
                    <button class="ins-question-delete" data-qid="${qId}">Xóa câu hỏi</button>
                </div>
                <div class="ins-form-group">
                    <label class="ins-label">Nội dung câu hỏi</label>
                    <input type="text" class="ins-input ins-q-text" data-qid="${qId}" value="${escHtml(q.QuestionText || q.questiontext)}" placeholder="Nhập nội dung câu hỏi..." />
                </div>
                <div class="ins-form-group">
                    <label class="ins-label">Giải thích (tùy chọn)</label>
                    <input type="text" class="ins-input ins-q-expl" data-qid="${qId}" value="${escHtml(q.Explanation || q.explanation || '')}" placeholder="Giải thích đáp án đúng..." />
                </div>
                <div class="ins-form-group">
                    <label class="ins-label">Các đáp án (chọn radio = đáp án đúng)</label>
                    <div class="ins-answers-list">${answersHtml}</div>
                    <button class="ins-add-answer-btn" data-qid="${qId}">+ Thêm đáp án</button>
                </div>
            </div>`;
    }

    function bindQuizEvents(lessonId) {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        // Delete question
        container.querySelectorAll('.ins-question-delete').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Xóa câu hỏi này và tất cả đáp án?')) return;
                const qid = btn.dataset.qid;
                // Delete answers first
                const qObj = currentQuestions.find(q => (q.QuestionID || q.questionid) == qid);
                if (qObj && qObj.answers) {
                    for (const a of qObj.answers) {
                        await fetch(`${API}/answers/${a.AnswerID || a.answerid}`, { method: 'DELETE' });
                    }
                }
                const res = await fetch(`${API}/questions/${qid}`, { method: 'DELETE' });
                if (res.ok) { showToast('✅ Đã xóa câu hỏi!'); loadQuiz(lessonId); }
            };
        });

        // Add answer
        container.querySelectorAll('.ins-add-answer-btn').forEach(btn => {
            btn.onclick = async () => {
                const res = await fetch(`${API}/answers`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ QuestionID: parseInt(btn.dataset.qid), AnswerText: 'Đáp án mới', IsCorrect: false })
                });
                if (res.ok) { showToast('✅ Đã thêm đáp án!'); loadQuiz(lessonId); }
            };
        });

        // Delete answer
        container.querySelectorAll('.ins-answer-delete').forEach(btn => {
            btn.onclick = async () => {
                const res = await fetch(`${API}/answers/${btn.dataset.aid}`, { method: 'DELETE' });
                if (res.ok) loadQuiz(lessonId);
            };
        });

        // Auto-save question text/explanation on blur
        container.querySelectorAll('.ins-q-text, .ins-q-expl').forEach(input => {
            input.onblur = async () => {
                const qid = input.dataset.qid;
                const card = input.closest('.ins-question-card');
                const txt = card.querySelector('.ins-q-text').value;
                const expl = card.querySelector('.ins-q-expl').value;
                await fetch(`${API}/questions/${qid}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ QuestionText: txt, Explanation: expl })
                });
            };
        });

        // Auto-save answer text on blur
        container.querySelectorAll('.ins-answer-text').forEach(input => {
            input.onblur = async () => {
                const aid = input.dataset.aid;
                const isCorrect = container.querySelector(`input[type="radio"][data-aid="${aid}"]`)?.checked || false;
                await fetch(`${API}/answers/${aid}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ AnswerText: input.value, IsCorrect: isCorrect })
                });
            };
        });

        // Auto-save correct answer on radio change
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.onchange = async () => {
                const aid = radio.dataset.aid;
                const txt = container.querySelector(`.ins-answer-text[data-aid="${aid}"]`)?.value || '';
                await fetch(`${API}/answers/${aid}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ AnswerText: txt, IsCorrect: true })
                });
                showToast('✅ Đã cập nhật đáp án đúng!');
            };
        });
    }

    // ============================================================
    // MODULE MODAL
    // ============================================================
    document.getElementById('btnAddModule').onclick = () => {
        document.getElementById('editModuleId').value = '';
        document.getElementById('moduleTitle').value = '';
        document.getElementById('moduleModalTitle').textContent = 'Thêm Module mới';
        openModal('moduleModal');
    };

    window.__openEditModule = function (modId, title) {
        document.getElementById('editModuleId').value = modId;
        document.getElementById('moduleTitle').value = title;
        document.getElementById('moduleModalTitle').textContent = 'Chỉnh sửa Module';
        openModal('moduleModal');
    };

    document.getElementById('saveModule').onclick = async () => {
        const title = document.getElementById('moduleTitle').value.trim();
        if (!title) { showToast('Tên module không được để trống', 'error'); return; }

        const editId = document.getElementById('editModuleId').value;
        const isEdit = !!editId;

        try {
            const url = isEdit ? `${API}/modules/${editId}` : `${API}/modules`;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ CourseID: courseId, Title: title, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast(isEdit ? '✅ Cập nhật module!' : '✅ Thêm module!');
                if (data.wasUnpublished) {
                    showToast('⚠️ Khóa học đã hủy xuất bản và gửi lên Admin duyệt lại!', 'warning');
                }
                closeModal('moduleModal');
                loadCourseTree();
            } else showToast(data.message || 'Lỗi', 'error');
        } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
    };

    // ============================================================
    // LESSON MODAL
    // ============================================================
    window.__openAddLesson = function (modId) {
        document.getElementById('lessonParentModuleId').value = modId;
        document.getElementById('newLessonTitle').value = '';
        document.getElementById('newLessonType').value = 'video';
        openModal('lessonModal');
    };

    document.getElementById('saveLesson').onclick = async () => {
        const title = document.getElementById('newLessonTitle').value.trim();
        const type = document.getElementById('newLessonType').value;
        const modId = document.getElementById('lessonParentModuleId').value;
        if (!title) { showToast('Tên bài học không được để trống', 'error'); return; }

        try {
            const res = await fetch(`${API}/lessons`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ModuleID: parseInt(modId), Title: title, Type: type, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Thêm bài học thành công!');
                if (data.wasUnpublished) {
                    showToast('⚠️ Khóa học đã hủy xuất bản và gửi lên Admin duyệt lại!', 'warning');
                }
                closeModal('lessonModal');
                loadCourseTree();
            } else showToast(data.message || 'Lỗi', 'error');
        } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
    };

    // ============================================================
    // DELETE CONFIRM
    // ============================================================
    window.__confirmDel = function (type, id, name) {
        deleteTarget = { type, id, name };
        document.getElementById('deleteItemName').textContent = name;
        openModal('deleteConfirmModal');
    };

    document.getElementById('confirmDelete').onclick = async () => {
        if (!deleteTarget) return;
        const url = deleteTarget.type === 'module' ? `${API}/modules/${deleteTarget.id}` : `${API}/lessons/${deleteTarget.id}`;
        try {
            const res = await fetch(url, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Xóa thành công!');
                if (data.wasUnpublished) {
                    showToast('⚠️ Khóa học đã hủy xuất bản và gửi lên Admin duyệt lại!', 'warning');
                }
                closeModal('deleteConfirmModal');
                if (deleteTarget.type === 'lesson' && activeLesson && activeLesson.LessonID === deleteTarget.id) {
                    activeLesson = null;
                    document.getElementById('editorEmpty').style.display = '';
                    document.getElementById('lessonEditorContent').style.display = 'none';
                }
                loadCourseTree();
            } else showToast(data.message || 'Xóa thất bại', 'error');
        } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
        deleteTarget = null;
    };

    // ============================================================
    // SUBMIT FOR REVIEW
    // ============================================================
    document.getElementById('btnSubmitReview').onclick = async () => {
        if (!courseData) return;
        if (courseData.Accept && courseData.IsCompleted) {
            showToast('Khóa học đã được xuất bản!', 'error');
            return;
        }
        if (courseData.Accept && !courseData.IsCompleted) {
            showToast('Khóa học đang chờ duyệt!', 'error');
            return;
        }
        if (!confirm('Gửi khóa học này để Admin xem xét và phê duyệt xuất bản?')) return;
        try {
            const res = await fetch(`${API}/course/${courseId}/submit`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ ' + data.message);
                loadCourseTree();
            } else showToast(data.message || 'Lỗi', 'error');
        } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
    };

    // ============================================================
    // SEND UPDATE
    // ============================================================
    document.getElementById('btnSendUpdate').onclick = async () => {
        if (!courseData) return;
        if (!confirm('Gửi bản cập nhật này để Admin xem xét và phê duyệt? Khóa học sẽ tạm thời hủy xuất bản cho đến khi Admin duyệt.')) return;
        try {
            const res = await fetch(`${API}/course/${courseId}/send-update`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ ' + data.message);
                loadCourseTree();
            } else showToast(data.message || 'Lỗi', 'error');
        } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
    };

    // ---- INIT ----
    loadCourseTree();
});
