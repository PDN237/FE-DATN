import { adminApi } from './admin-api.js';

let currentPage = 1;
let searchTerm = '';
let currentTab = 'pending'; // 'pending' or 'published'
let allCourses = [];
let actionTargetId = null;

// DOM
const coursesGrid = document.getElementById('coursesGrid');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');

// Helpers
function escHtml(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

function showToast(msg, type = 'success') {
    const t = document.getElementById('acToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'ac-toast ' + type + ' show';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'ac-toast'; }, 3200);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModalFn(id) { document.getElementById(id).classList.remove('active'); }

function getLevelClass(level) {
    if (!level) return 'ac-level--basic';
    const l = level.toLowerCase();
    if (l.includes('nâng cao') || l.includes('advanced')) return 'ac-level--advanced';
    if (l.includes('trung') || l.includes('medium')) return 'ac-level--medium';
    return 'ac-level--basic';
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// =========================================
// LOAD & FILTER
// =========================================
async function loadCourses(page = 1, search = '') {
    try {
        coursesGrid.innerHTML = '<div class="ac-loading"><div class="ac-spinner"></div><span>Đang tải khóa học...</span></div>';

        const data = await adminApi.getCourses(page, 50, search);
        allCourses = data.courses || [];

        // Split by status
        const pending = allCourses.filter(c => c.Accept && !c.IsCompleted);
        const published = allCourses.filter(c => c.Accept && c.IsCompleted);

        // Update counts
        document.getElementById('pendingCount').textContent = pending.length;
        document.getElementById('publishedCount').textContent = published.length;
        document.getElementById('tabPendingCount').textContent = pending.length;
        document.getElementById('tabPublishedCount').textContent = published.length;

        renderGrid();
    } catch (error) {
        console.error('Load courses error:', error);
        coursesGrid.innerHTML = '<div class="ac-empty">❌ Lỗi tải danh sách khóa học</div>';
    }
}

function getFilteredCourses() {
    let filtered;
    if (currentTab === 'pending') {
        filtered = allCourses.filter(c => c.Accept && !c.IsCompleted);
    } else {
        filtered = allCourses.filter(c => c.Accept && c.IsCompleted);
    }

    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(c => (c.Title || '').toLowerCase().includes(q));
    }

    return filtered;
}

function renderGrid() {
    const courses = getFilteredCourses();

    if (courses.length === 0) {
        const emptyMsg = currentTab === 'pending'
            ? '📭 Không có khóa học nào đang chờ phê duyệt'
            : '📭 Chưa có khóa học nào đã xuất bản';
        coursesGrid.innerHTML = `<div class="ac-empty">${emptyMsg}</div>`;
        pagination.style.display = 'none';
        return;
    }

    coursesGrid.innerHTML = courses.map(course => {
        const thumbHtml = course.Thumbnail
            ? `<img class="ac-card-thumb" src="${escHtml(course.Thumbnail)}" alt="${escHtml(course.Title)}" onerror="this.outerHTML='<div class=\\'ac-card-thumb-placeholder\\'>📚</div>'">`
            : '<div class="ac-card-thumb-placeholder">📚</div>';

        const safeTitle = escHtml(course.Title).replace(/'/g, "\\'");

        // Different action buttons based on tab
        let actionsHtml;
        if (currentTab === 'pending') {
            actionsHtml = `
                <button class="ac-card-action ac-card-action--approve"
                    onclick="window.__approveCourse(${course.CourseID}, '${safeTitle}')">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Phê duyệt
                </button>
                <button class="ac-card-action ac-card-action--view"
                    onclick="window.location.href='/FrondEnd/Html/Admin/course-builder.html?courseId=${course.CourseID}'">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/></svg>
                    Xem
                </button>
                <button class="ac-card-action ac-card-action--reject"
                    onclick="window.__rejectCourse(${course.CourseID}, '${safeTitle}')">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    Từ chối
                </button>`;
        } else {
            actionsHtml = `
                <button class="ac-card-action ac-card-action--view"
                    onclick="window.location.href='/FrondEnd/Html/Admin/course-builder.html?courseId=${course.CourseID}'">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/></svg>
                    Xem chi tiết
                </button>
                <button class="ac-card-action ac-card-action--reject"
                    onclick="window.__rejectCourse(${course.CourseID}, '${safeTitle}')">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    Hủy xuất bản
                </button>`;
        }

        return `
            <div class="ac-card ${currentTab === 'pending' ? 'ac-card--pending' : ''}">
                ${thumbHtml}
                <div class="ac-card-body">
                    <h3 class="ac-card-title">${escHtml(course.Title)}</h3>
                    <p class="ac-card-desc">${escHtml(course.Description || '')}</p>
                    <div class="ac-card-meta">
                        <span class="ac-level-badge ${getLevelClass(course.Level)}">${escHtml(course.Level || 'Cơ bản')}</span>
                        <span class="ac-card-score">Score: ${course.score || 0}</span>
                        <span class="ac-card-modules">📦 ${course.moduleCount || 0} module</span>
                        <span class="ac-card-date">${formatDate(course.CreatedAt)}</span>
                    </div>
                    <div class="ac-card-actions">${actionsHtml}</div>
                </div>
            </div>`;
    }).join('');

    pagination.style.display = 'none'; // client-side filtering, no pagination needed
}

// =========================================
// APPROVE / REJECT
// =========================================
window.__approveCourse = function (id, title) {
    actionTargetId = id;
    document.getElementById('approveCourseName').textContent = title;
    openModal('approveModal');
};

window.__rejectCourse = function (id, title) {
    actionTargetId = id;
    document.getElementById('rejectCourseName').textContent = title;
    document.getElementById('rejectFeedback').value = '';
    openModal('rejectModal');
};

// =========================================
// EVENTS
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();

    // Tab switching
    document.querySelectorAll('.ac-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.ac-tab').forEach(t => t.classList.remove('ac-tab--active'));
            tab.classList.add('ac-tab--active');
            currentTab = tab.dataset.tab;
            renderGrid();
        });
    });

    // Search
    const searchInput = document.getElementById('courseSearch');
    searchInput.addEventListener('input', debounce(e => {
        searchTerm = e.target.value.trim();
        renderGrid();
    }, 300));

    // Backdrop click to close
    document.querySelectorAll('.ac-modal-backdrop').forEach(el => {
        el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
    });

    // Approve confirm
    document.getElementById('confirmApprove').addEventListener('click', async () => {
        if (!actionTargetId) return;
        try {
            await adminApi.approveCourse(actionTargetId);
            showToast('✅ Khóa học đã được phê duyệt!');
            closeModalFn('approveModal');
            loadCourses(1, '');
        } catch (error) {
            showToast('❌ Lỗi: ' + error.message, 'error');
        }
        actionTargetId = null;
    });

    // Reject confirm
    document.getElementById('confirmReject').addEventListener('click', async () => {
        if (!actionTargetId) return;
        const feedback = document.getElementById('rejectFeedback').value.trim();
        if (!feedback) {
            showToast('Vui lòng nhập lý do từ chối!', 'error');
            return;
        }
        try {
            await adminApi.rejectCourse(actionTargetId, feedback);
            showToast('✅ Đã từ chối và gửi feedback!');
            closeModalFn('rejectModal');
            loadCourses(1, '');
        } catch (error) {
            showToast('❌ Lỗi: ' + error.message, 'error');
        }
        actionTargetId = null;
    });

    // Pagination
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; loadCourses(currentPage, searchTerm); }
    });
    nextBtn.addEventListener('click', () => {
        currentPage++; loadCourses(currentPage, searchTerm);
    });
});

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
