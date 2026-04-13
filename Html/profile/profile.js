document.addEventListener("DOMContentLoaded", () => {
    const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

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
        });
    });

    // 1. Fetch user ID from localStorage (giả sử có lưu user ID lúa login)
    let userStr = localStorage.getItem("user");
    let userId = 1; // Default
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
            const response = await fetch(`https://be-datn-6gb6.onrender.com/api/profile?userId=${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success) {
                const user = data.data.user;
                const stats = data.data.stats;
                const courses = data.data.courses;

                // Cập nhật DOM
                const avatarUrl = user.AvatarUrl && user.AvatarUrl !== 'default-avatar.png'
                                  ? user.AvatarUrl : defaultAvatar;
                
                document.getElementById("avatarPreview").src = avatarUrl;
                document.getElementById("headerAvatar").src = avatarUrl;

                // Hero / sidebar info
                const heroName = document.getElementById("heroName");
                const heroEmail = document.getElementById("heroEmail");
                if (heroName) heroName.textContent = user.FullName || "Chưa có tên";
                if (heroEmail) heroEmail.textContent = user.Email || "";

                document.getElementById("statProblems").textContent = stats.solvedProblems;
                document.getElementById("statCourses").textContent = stats.completedCourses;
                document.getElementById("overviewProblems").textContent = stats.solvedProblems;
                document.getElementById("overviewCourses").textContent = stats.completedCourses;

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

                // Render Courses
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
            const response = await fetch(`https://be-datn-6gb6.onrender.com/api/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (data.success) {
                showToast("✅ Cập nhật thông tin thành công!", 'success');
                // Update hero name
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

    // 4. Handle Avatar preview
    const avatarInput = document.getElementById("avatarInput");
    const avatarPreview = document.getElementById("avatarPreview");
    const headerAvatar = document.getElementById("headerAvatar");

    avatarInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                avatarPreview.src = e.target.result;
                headerAvatar.src = e.target.result;
                // Nếu muốn lưu avatar vào DB thì thêm code upload file ở đây.
            };
            reader.readAsDataURL(file);
        }
    });
});
