document.addEventListener("DOMContentLoaded", () => {
    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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
                document.getElementById("sidebarName").textContent = "Không thể kết nối đến máy chủ";
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
                
                document.getElementById("sidebarName").textContent = user.FullName || "Chưa có tên";
                document.getElementById("sidebarEmail").textContent = user.Email || "";

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

                // Render Courses
                const coursesContainer = document.getElementById("coursesContainer");
                coursesContainer.innerHTML = "";

                if (courses.length === 0) {
                    coursesContainer.innerHTML = "<p style='color: #9ca3af; font-size: 0.9rem;'>Bạn chưa tham gia khóa học nào.</p>";
                } else {
                    courses.forEach(course => {
                        const isCompleted = course.status === 'completed';
                        const badgeClass = isCompleted ? 'badge-complete' : 'badge-learning';
                        const badgeText = isCompleted ? 'Hoàn thành' : 'Đang học';

                        const courseHtml = `
                            <div class="course-card">
                                <div class="course-header">
                                    <h4 class="course-title">${course.title}</h4>
                                    <span class="badge ${badgeClass}">${badgeText}</span>
                                </div>
                                <p class="course-progress">Hoàn thành: ${course.progress}%</p>
                                <div class="progress-bar-container">
                                    <div class="progress-bar" style="width: ${course.progress}%; background-color: #22d3ee;"></div>
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
                        problemsContainer.innerHTML = "<p style='color: #9ca3af; font-size: 0.9rem;'>Bạn chưa giải bài tập nào.</p>";
                    } else {
                        solvedProblemsList.forEach(prob => {
                            const difficultyColor = prob.difficulty === 'Easy' ? '#10b981' : (prob.difficulty === 'Medium' ? '#f59e0b' : '#ef4444');
                            const date = new Date(prob.solvedAt).toLocaleDateString('vi-VN');
                            const problemHtml = `
                                <div class="course-card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #1e3a52; border-radius: 0; background: transparent; margin-bottom: 0;">
                                    <div>
                                        <h4 class="course-title" style="margin-bottom: 0.25rem;"><a href="/FrondEnd/Html/Practice/ProblemsDetail.html?id=${prob.id}" style="color: #22d3ee; text-decoration: none;">${prob.title}</a></h4>
                                        <span style="font-size: 0.8rem; color: #9ca3af;">Đã giải: ${date}</span>
                                    </div>
                                    <span class="badge" style="background-color: ${difficultyColor}20; color: ${difficultyColor}; border: 1px solid ${difficultyColor}40;">${prob.difficulty || 'N/A'}</span>
                                </div>
                            `;
                            problemsContainer.insertAdjacentHTML('beforeend', problemHtml);
                        });
                    }
                }

            } else {
                console.error("Lỗi tải profile:", data.message);
                document.getElementById("sidebarName").textContent = "Không tìm thấy user";
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    loadProfileData();

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
            BirthYear: document.getElementById("inputBirthYear").value
        };

        const updateBtn = form.querySelector('.update-btn');
        const oldText = updateBtn.textContent;
        updateBtn.textContent = 'Đang cập nhật...';
        updateBtn.disabled = true;

        try {
            const response = await fetch(`https://be-datn-6gb6.onrender.com/api/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (data.success) {
                alert("Cập nhật thông tin thành công!");
                // Update sidebar name dynamically without reload
                document.getElementById("sidebarName").textContent = updateData.FullName;
            } else {
                alert("Cập nhật thất bại: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Đã xảy ra lỗi khi cập nhật!");
        } finally {
            updateBtn.textContent = oldText;
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
