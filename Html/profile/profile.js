document.addEventListener("DOMContentLoaded", () => {
    // Check if user is logged in
    const currentUserId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUserId || currentUserId === 'null' || currentUserId === '' || !authToken) {
        // Not logged in, redirect to login page
        alert('Bạn cần đăng nhập để xem thông tin cá nhân!');
        window.location.href = '/FrondEnd/Html/Login/login.html';
        return;
    }

    const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
    const API_BASE = 'https://be-datn-6gb6.onrender.com/api/profile';

    // ---- Toast helper ----
    function showToast(msg, type = 'success') {
        const toast = document.getElementById('toastNotif');
        if (!toast) { alert(msg); return; }
        toast.textContent = msg;
        toast.className = 'pf-toast ' + type + ' show';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.className = 'pf-toast'; }, 3200);
    }

    // ======== TAB SWITCHING ========
    const tabBtns = document.querySelectorAll('.pf-tab-btn');
    const tabContents = {
        userInfo: document.getElementById('tabContentUserInfo'),
        courses: document.getElementById('tabContentCourses')
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content visibility
            Object.values(tabContents).forEach(tc => {
                if (tc) tc.classList.remove('active');
            });
            if (tabContents[targetTab]) {
                tabContents[targetTab].classList.add('active');
            }

            // Load my courses on first click
            if (targetTab === 'courses' && !myCoursesLoaded) {
                loadMyCourses();
            }
        });
    });

    // 1. Fetch user ID from localStorage
    let userStr = localStorage.getItem("user");
    let userId = 1;
    let currentTitle = null; // Store current title to detect changes
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            if (userObj && userObj.id) {
                userId = userObj.id;
            }
        } catch(e) {}
    }

    // 2. Load Profile Data
    async function loadProfileData() {
        try {
            const response = await fetch(`${API_BASE}?userId=${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success) {
                const user = data.data.user;
                const stats = data.data.stats;
                const courses = data.data.courses;

                // Check if title has changed and show congratulations
                // Also show congratulations if title is newly achieved (not "Chưa có")
                if (user.title && user.title !== 'Chưa có') {
                    if (currentTitle !== null && currentTitle !== user.title) {
                        showToast(`🎉 Chúc mừng! Bạn đã đạt danh hiệu ${user.title}!`, 'success');
                    } else if (currentTitle === null) {
                        // First time loading, show congratulations if user has a title
                        showToast(`🎉 Danh hiệu của bạn: ${user.title}!`, 'success');
                    }
                }
                currentTitle = user.title;

                // Cập nhật DOM
                const avatarUrl = user.AvatarUrl && user.AvatarUrl !== 'default-avatar.png'
                                  ? user.AvatarUrl : defaultAvatar;
                
                document.getElementById("avatarPreview").src = avatarUrl;
                document.getElementById("headerAvatar").src = avatarUrl;

                // Hero info
                const heroName = document.getElementById("heroName");
                const heroEmail = document.getElementById("heroEmail");
                const heroTitleBadge = document.getElementById("heroTitleBadge");
                if (heroName) heroName.textContent = user.FullName || "Chưa có tên";
                if (heroEmail) heroEmail.textContent = user.Email || "";
                if (heroTitleBadge) {
                    heroTitleBadge.textContent = user.title || "Chưa có";
                    // Add title class based on title value for styling
                    heroTitleBadge.className = 'title-badge';
                    if (user.title === 'Kim Cương') heroTitleBadge.classList.add('title-diamond');
                    else if (user.title === 'Bạch Kim') heroTitleBadge.classList.add('title-platinum');
                    else if (user.title === 'Vàng') heroTitleBadge.classList.add('title-gold');
                    else if (user.title === 'Bạc') heroTitleBadge.classList.add('title-silver');
                    else if (user.title === 'Đồng') heroTitleBadge.classList.add('title-bronze');
                }

                // Hero stats
                document.getElementById("statProblems").textContent = stats.solvedProblems;
                document.getElementById("statCourses").textContent = stats.completedCourses;

                // Overview stats
                document.getElementById("overviewProblems").textContent = stats.solvedProblems;
                document.getElementById("overviewCourses").textContent = stats.completedCourses;
                document.getElementById("overviewScore").textContent = user.score || 0;
                document.getElementById("overviewTitle").textContent = user.title || '-';

                // Form values
                document.getElementById("inputName").value = user.FullName || "";
                document.getElementById("inputEmail").value = user.Email || "";
                document.getElementById("inputPhone").value = user.Phone || "";
                document.getElementById("inputLocation").value = user.Location || "";
                document.getElementById("inputGender").value = user.Gender || "";
                document.getElementById("inputBirthYear").value = user.BirthYear || "";

                // Describe / Bio field
                const describeEl = document.getElementById("inputDescribe");
                if (describeEl) {
                    describeEl.value = user.Describe || "";
                    updateCharCount();
                }

                // ---- Role-based UI logic ----
                const tabCoursesBtn = document.getElementById('tabCourses');
                const instructorActionArea = document.getElementById('instructorActionArea');
                const becomeInstructorArea = document.getElementById('becomeInstructorArea');
                const myCoursesToolbar = document.querySelector('.mc-toolbar');

                // RoleID 4 is Instructor, RoleID 3 is Student, RoleID 1 is Admin
                if (user.RoleID === 4) {
                    // Instructor: show courses tab, show instructor action area, show my courses toolbar
                    if (tabCoursesBtn) tabCoursesBtn.style.display = 'flex';
                    if (instructorActionArea) instructorActionArea.style.display = 'block';
                    if (becomeInstructorArea) becomeInstructorArea.style.display = 'none';
                    if (myCoursesToolbar) myCoursesToolbar.style.display = 'flex';
                } else if (user.RoleID === 1) {
                    // Admin: hide courses tab, hide instructor action area, hide "Become Instructor", hide my courses toolbar
                    if (tabCoursesBtn) tabCoursesBtn.style.display = 'none';
                    if (instructorActionArea) instructorActionArea.style.display = 'none';
                    if (becomeInstructorArea) becomeInstructorArea.style.display = 'none';
                    if (myCoursesToolbar) myCoursesToolbar.style.display = 'none';
                } else {
                    // Student: hide courses tab, hide instructor action area, show "Become Instructor" invite, hide my courses toolbar
                    if (tabCoursesBtn) tabCoursesBtn.style.display = 'none';
                    if (instructorActionArea) instructorActionArea.style.display = 'none';
                    if (becomeInstructorArea) becomeInstructorArea.style.display = 'block';
                    if (myCoursesToolbar) myCoursesToolbar.style.display = 'none';
                }

                // Render Enrolled Courses
                const coursesContainer = document.getElementById("coursesContainer");
                coursesContainer.innerHTML = "";

                if (courses.length === 0) {
                    coursesContainer.innerHTML = '<p class="pf-empty">Bạn chưa tham gia khóa học nào.</p>';
                } else {
                    courses.forEach(course => {
                        const isCompleted = course.status === 'completed';
                        const badgeClass = isCompleted ? 'pf-badge--complete' : 'pf-badge--learning';
                        const badgeText = isCompleted ? 'Hoàn thành' : 'Đang học';

                        const courseHtml = `
                            <div class="pf-course-card">
                                <div class="pf-course-header">
                                    <h4 class="pf-course-title">${course.title}</h4>
                                    <span class="pf-badge ${badgeClass}">${badgeText}</span>
                                </div>
                                <p class="pf-course-progress-text">Hoàn thành: ${course.progress}%</p>
                                <div class="pf-progress-bar-container">
                                    <div class="pf-progress-bar" style="width: ${course.progress}%;"></div>
                                </div>
                            </div>
                        `;
                        coursesContainer.insertAdjacentHTML('beforeend', courseHtml);
                    });
                }

                // Render Solved Problems
                const problemsContainer = document.getElementById("problemsContainer");
                if (problemsContainer) {
                    problemsContainer.innerHTML = "";
                    const solvedProblemsList = data.data.solvedProblemsList || [];

                    if (solvedProblemsList.length === 0) {
                        problemsContainer.innerHTML = '<p class="pf-empty">Bạn chưa giải bài tập nào.</p>';
                    } else {
                        const diffColors = { Easy: { bg: '#e8f5e9', color: '#48c78e', border: '#a5d6a7' }, Medium: { bg: '#fff8e1', color: '#f7b731', border: '#ffe082' }, Hard: { bg: '#fce4ec', color: '#ee5a6f', border: '#f48fb1' } };
                        solvedProblemsList.forEach(prob => {
                            const dc = diffColors[prob.difficulty] || { bg: '#f3f4f6', color: '#718096', border: '#cbd5e0' };
                            const date = new Date(prob.solvedAt).toLocaleDateString('vi-VN');
                            const problemHtml = `
                                <div class="pf-problem-row">
                                    <div>
                                        <a href="/FrondEnd/Html/Practice/ProblemsDetail.html?id=${prob.id}" class="pf-problem-title">${prob.title}</a>
                                        <span class="pf-problem-date">Đã giải: ${date}</span>
                                    </div>
                                    <span class="pf-diff-badge" style="background:${dc.bg};color:${dc.color};border:1px solid ${dc.border};">${prob.difficulty || 'N/A'}</span>
                                </div>
                            `;
                            problemsContainer.insertAdjacentHTML('beforeend', problemHtml);
                        });
                    }
                }

            } else {
                console.error("Lỗi tải profile:", data.message);
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    loadProfileData();

    // ---- Char counter for bio textarea ----
    function updateCharCount() {
        const el = document.getElementById("inputDescribe");
        const counter = document.getElementById("describeCharCount");
        if (el && counter) counter.textContent = el.value.length;
    }
    const describeEl = document.getElementById("inputDescribe");
    if (describeEl) describeEl.addEventListener("input", updateCharCount);

    // 3. Handle Form Submit
    const form = document.getElementById("profileForm");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const updateData = {
            userId: userId,
            FullName: document.getElementById("inputName").value,
            Phone: document.getElementById("inputPhone").value,
            Location: document.getElementById("inputLocation").value,
            Gender: document.getElementById("inputGender").value,
            BirthYear: document.getElementById("inputBirthYear").value,
            Describe: (document.getElementById("inputDescribe") || {}).value || ''
        };

        const updateBtn = document.getElementById('updateBtn');
        const oldHTML = updateBtn.innerHTML;
        updateBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;animation:pfSpin 0.7s linear infinite"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28 8"/></svg> Đang cập nhật...';
        updateBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (data.success) {
                showToast("✅ Cập nhật thông tin thành công!", 'success');
                const heroName = document.getElementById("heroName");
                if (heroName) heroName.textContent = updateData.FullName;
            } else {
                showToast("❌ Cập nhật thất bại: " + data.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("❌ Đã xảy ra lỗi khi cập nhật!", 'error');
        } finally {
            updateBtn.innerHTML = oldHTML;
            updateBtn.disabled = false;
        }
    });

    // ================================================================
    // 5. MY COURSES — Course Management in "Các khóa học" tab
    // ================================================================

    let myCoursesLoaded = false;
    let myCoursesData = [];
    let deleteCourseId = null;

    // DOM references
    const myCoursesGrid = document.getElementById('myCoursesGrid');
    const courseModal = document.getElementById('myCourseModal');
    const deleteModal = document.getElementById('deleteCourseModal');
    const courseForm = document.getElementById('myCourseForm');
    const courseIdInput = document.getElementById('myCourseId');
    const modalTitle = document.getElementById('myCourseModalTitle');
    const thumbInput = document.getElementById('myCourseThumbnail');
    const thumbPreview = document.getElementById('myCourseThumbnailPreview');

    // ---- Load my courses ----
    async function loadMyCourses() {
        myCoursesGrid.innerHTML = `
            <div class="pf-loading">
                <div class="pf-spinner"></div>
                <span>Đang tải khóa học...</span>
            </div>`;

        try {
            const response = await fetch(`${API_BASE}/my-courses?userId=${userId}`);
            const data = await response.json();

            if (data.success) {
                myCoursesData = data.courses || [];
                myCoursesLoaded = true;
                renderMyCourses();
            } else {
                myCoursesGrid.innerHTML = `<p class="pf-empty">Lỗi tải khóa học: ${data.message}</p>`;
            }
        } catch (err) {
            console.error('loadMyCourses error:', err);
            myCoursesGrid.innerHTML = '<p class="pf-empty">Không thể kết nối đến máy chủ.</p>';
        }
    }

    // ---- Filter courses by status ----
    document.getElementById('courseStatusFilter').addEventListener('change', () => {
        renderMyCourses();
    });

    // ---- Render course cards ----
    function renderMyCourses() {
        if (myCoursesData.length === 0) {
            myCoursesGrid.innerHTML = `
                <div class="mc-empty">
                    <div class="mc-empty-icon">📚</div>
                    <h3>Chưa có khóa học nào</h3>
                    <p>Bạn chưa tạo khóa học nào. Hãy bắt đầu bằng cách nhấn nút "Tạo khóa học" ở trên.</p>
                </div>`;
            return;
        }

        const levelColors = {
            'Cơ bản': { bg: '#e8f5e9', color: '#48c78e', border: '#a5d6a7' },
            'Trung cấp': { bg: '#fff8e1', color: '#f7b731', border: '#ffe082' },
            'Nâng cao': { bg: '#fce4ec', color: '#ee5a6f', border: '#f48fb1' }
        };

        // Sort courses: Rejected (priority 0) -> Pending (priority 1) -> Published (priority 2)
        // Within each status, sort by creation date descending (newest first)
        const sortedCourses = [...myCoursesData].sort((a, b) => {
            const getStatusPriority = (course) => {
                if (!course.Accept && course.Feedback) return 0; // Rejected - highest priority
                if (course.Accept && !course.IsCompleted) return 1; // Pending
                if (course.Accept && course.IsCompleted) return 2; // Published - lowest priority
                return 3; // Draft
            };
            
            const priorityA = getStatusPriority(a);
            const priorityB = getStatusPriority(b);
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            // Same status, sort by creation date descending (newest first)
            const dateA = new Date(a.CreatedAt || 0);
            const dateB = new Date(b.CreatedAt || 0);
            return dateB - dateA;
        });

        // Apply filter
        const filterValue = document.getElementById('courseStatusFilter').value;
        const filteredCourses = sortedCourses.filter(course => {
            if (filterValue === 'all') return true;
            if (filterValue === 'rejected') return !course.Accept && course.Feedback;
            if (filterValue === 'pending') return course.Accept && !course.IsCompleted;
            if (filterValue === 'published') return course.Accept && course.IsCompleted;
            if (filterValue === 'draft') return !course.Accept && !course.Feedback;
            return true;
        });

        if (filteredCourses.length === 0) {
            myCoursesGrid.innerHTML = `
                <div class="mc-empty">
                    <div class="mc-empty-icon">📚</div>
                    <h3>Không có khóa học nào</h3>
                    <p>Không tìm thấy khóa học theo bộ lọc đã chọn.</p>
                </div>`;
            return;
        }

        myCoursesGrid.innerHTML = filteredCourses.map(course => {
            const lc = levelColors[course.Level] || levelColors['Cơ bản'];
            const date = course.CreatedAt ? new Date(course.CreatedAt).toLocaleDateString('vi-VN') : '—';
            const thumbUrl = course.Thumbnail || '';
            const escapedTitle = (course.Title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const escapedDesc = (course.Description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

            // Determine status
            let statusLabel = 'Đang soạn';
            let statusClass = 'mc-status--draft';
            if (course.Accept && course.IsCompleted) {
                statusLabel = '✓ Đã xuất bản';
                statusClass = 'mc-status--published';
            } else if (course.Accept && !course.IsCompleted) {
                statusLabel = '⏳ Chờ duyệt';
                statusClass = 'mc-status--pending';
            } else if (!course.Accept && course.Feedback) {
                statusLabel = '✕ Bị từ chối';
                statusClass = 'mc-status--rejected';
            }

            const feedbackHtml = (!course.Accept && course.Feedback)
                ? `<div class="mc-card-feedback">
                    <span class="mc-feedback-icon">💬</span>
                    <span class="mc-feedback-text">Admin: ${(course.Feedback || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                   </div>`
                : '';

            return `
                <div class="mc-card" data-id="${course.CourseID}">
                    ${thumbUrl
                        ? `<div class="mc-card-thumb" style="background-image:url('${thumbUrl}');"></div>`
                        : `<div class="mc-card-thumb mc-card-thumb--placeholder">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2"/></svg>
                          </div>`
                    }
                    <div class="mc-card-body">
                        <div class="mc-card-meta">
                            <span class="mc-card-level" style="background:${lc.bg};color:${lc.color};border:1px solid ${lc.border};">${course.Level || 'Cơ bản'}</span>
                            <span class="mc-card-status ${statusClass}">${statusLabel}</span>
                            <span class="mc-card-modules">${course.moduleCount || 0} module</span>
                        <span class="mc-card-score">Score: ${course.score || 0}</span>
                        </div>
                        <h3 class="mc-card-title">${course.Title}</h3>
                        <p class="mc-card-desc">${(course.Description || '').substring(0, 100)}${(course.Description || '').length > 100 ? '...' : ''}</p>
                        ${feedbackHtml}
                        <div class="mc-card-footer">
                            <span class="mc-card-date">📅 ${date}</span>
                            <div class="mc-card-actions">
                                <button class="mc-action-btn mc-action-btn--edit" title="Chỉnh sửa"
                                    onclick="window._editMyCourse(${course.CourseID})">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2"/></svg>
                                </button>
                                <button class="mc-action-btn mc-action-btn--view" title="Quản lý nội dung"
                                    onclick="window.location.href='/FrondEnd/Html/Instructor/Instructor.html?courseId=${course.CourseID}'">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/></svg>
                                </button>
                                <button class="mc-action-btn mc-action-btn--delete" title="Xóa"
                                    onclick="window._deleteMyCourse(${course.CourseID}, '${escapedTitle}')">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ---- Modal helpers ----
    function openCourseModal(editCourse = null) {
        courseForm.reset();
        courseIdInput.value = '';
        thumbPreview.innerHTML = '';

        if (editCourse) {
            modalTitle.textContent = 'Chỉnh sửa khóa học';
            courseIdInput.value = editCourse.CourseID;
            document.getElementById('myCourseTitle').value = editCourse.Title || '';
            document.getElementById('myCourseDesc').value = editCourse.Description || '';
            document.getElementById('myCourseLevel').value = editCourse.Level || 'Cơ bản';
            thumbInput.value = editCourse.Thumbnail || '';
            document.getElementById('myCourseScore').value = editCourse.score || 0;
            previewThumb();
        } else {
            modalTitle.textContent = 'Tạo khóa học mới';
        }

        courseModal.classList.add('active');
    }

    function closeCourseModalFn() {
        courseModal.classList.remove('active');
    }

    function previewThumb() {
        const url = thumbInput.value;
        if (url) {
            thumbPreview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<span style=\\'color:var(--color-danger);font-size:0.82rem\\'>URL ảnh không hợp lệ</span>'" />`;
        } else {
            thumbPreview.innerHTML = '';
        }
    }

    // ---- Event listeners ----
    // Add course button
    document.getElementById('btnAddMyCourse').addEventListener('click', () => openCourseModal(null));

    // Modal close/cancel
    document.getElementById('closeMyCourseModal').addEventListener('click', closeCourseModalFn);
    document.getElementById('cancelMyCourse').addEventListener('click', closeCourseModalFn);

    // Thumbnail preview
    thumbInput.addEventListener('input', previewThumb);

    // Save course
    document.getElementById('saveMyCourse').addEventListener('click', async () => {
        if (!courseForm.checkValidity()) {
            courseForm.reportValidity();
            return;
        }

        const courseData = {
            userId: userId,
            Title: document.getElementById('myCourseTitle').value.trim(),
            Description: document.getElementById('myCourseDesc').value.trim(),
            Level: document.getElementById('myCourseLevel').value,
            Thumbnail: thumbInput.value.trim(),
            score: parseInt(document.getElementById('myCourseScore').value) || 0
        };

        const saveBtn = document.getElementById('saveMyCourse');
        const oldHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;animation:pfSpin 0.7s linear infinite"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28 8"/></svg> Đang lưu...';
        saveBtn.disabled = true;

        try {
            const isEdit = !!courseIdInput.value;
            const url = isEdit
                ? `${API_BASE}/my-courses/${courseIdInput.value}`
                : `${API_BASE}/my-courses`;

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            });

            const data = await response.json();

            if (data.success) {
                showToast(isEdit ? '✅ Cập nhật khóa học thành công!' : '✅ Tạo khóa học mới thành công!', 'success');
                closeCourseModalFn();
                loadMyCourses();
            } else {
                showToast('❌ ' + (data.message || 'Lỗi không xác định'), 'error');
            }
        } catch (err) {
            console.error('Save course error:', err);
            showToast('❌ Không thể kết nối đến máy chủ!', 'error');
        } finally {
            saveBtn.innerHTML = oldHTML;
            saveBtn.disabled = false;
        }
    });

    // ---- Edit course (global function for onclick) ----
    window._editMyCourse = function(courseId) {
        const course = myCoursesData.find(c => c.CourseID === courseId);
        if (course) {
            openCourseModal(course);
        }
    };

    // ---- Delete course ----
    window._deleteMyCourse = function(courseId, title) {
        deleteCourseId = courseId;
        document.getElementById('deleteCourseName').textContent = title;
        deleteModal.classList.add('active');
    };

    document.getElementById('closeDeleteModal').addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });
    document.getElementById('cancelDeleteCourse').addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });

    document.getElementById('confirmDeleteCourse').addEventListener('click', async () => {
        if (!deleteCourseId) return;

        const deleteBtn = document.getElementById('confirmDeleteCourse');
        const oldHTML = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;animation:pfSpin 0.7s linear infinite"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28 8"/></svg> Đang xóa...';
        deleteBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/my-courses/${deleteCourseId}?userId=${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showToast('✅ Xóa khóa học thành công!', 'success');
                deleteModal.classList.remove('active');
                loadMyCourses();
            } else {
                showToast('❌ ' + (data.message || 'Không thể xóa'), 'error');
            }
        } catch (err) {
            console.error('Delete course error:', err);
            showToast('❌ Không thể kết nối đến máy chủ!', 'error');
        } finally {
            deleteBtn.innerHTML = oldHTML;
            deleteBtn.disabled = false;
            deleteCourseId = null;
        }
    });

    // Close modals on backdrop click
    courseModal.addEventListener('click', (e) => {
        if (e.target === courseModal) closeCourseModalFn();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) deleteModal.classList.remove('active');
    });
});
