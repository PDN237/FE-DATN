document.addEventListener('DOMContentLoaded', () => {
    const API = 'https://be-datn-6gb6.onrender.com/api/instructor';
    const CORRECT_ANSWERS = { q1: 'correct', q2: 'correct', q3: 'correct', q4: 'correct', q5: 'correct' };

    // ---- App State ----
    let currentStep = 1;
    const totalSteps = 9;
    let userId = null;
    let userRole = null;
    let fullName = "Học viên";

    // ---- Elements ----
    const slides = document.querySelectorAll('.bi-slide');
    const dots = document.querySelectorAll('.bi-step-dot');
    const progressLine = document.getElementById('stepperProgress');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const stepNumDisplay = document.getElementById('currentStepNum');
    const summaryName = document.getElementById('summaryName');
    const btnSubmit = document.getElementById('btnSubmitRegistration');
    const headerAvatar = document.getElementById('headerAvatar');

    // ---- 1. Authentication Check ----
    function checkAuth() {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u && u.id) {
                userId = u.id;
                userRole = u.roleId;
                fullName = u.fullName || u.fullname || "Học viên";
                if (summaryName) summaryName.textContent = fullName;
                if (u.avatarUrl && headerAvatar) headerAvatar.src = u.avatarUrl;
            }
        } catch (e) {}

        if (!userId) {
            renderError("Vui lòng đăng nhập", "Bạn cần đăng nhập để đăng ký làm Giảng viên.", "../login/login.html", "Đăng nhập ngay");
            return false;
        }
        if (userRole === 4) {
             renderError("Bạn đã là Instructor!", "Hãy bắt đầu tạo và quản lý khóa học của bạn.", "../profile/profile.html", "Về Profile");
             return false;
        }
        if (userRole === 1) {
             renderError("Bạn là Admin", "Admin có toàn quyền quản lý, không cần đăng ký thêm.", "../Admin/admin-dashboard.html", "Vào Dashboard");
             return false;
        }
        return true;
    }

    function renderError(title, desc, link, linkText) {
        document.querySelector('.bi-wizard-main').innerHTML = `
            <div class="bi-already-banner">
                <div class="bi-already-icon">🛡️</div>
                <h2>${title}</h2>
                <p>${desc}</p>
                <a href="${link}">${linkText}</a>
            </div>`;
    }

    if (!checkAuth()) return;

    // ---- 2. Stepper & Navigation ----
    function updateWizard() {
        // Toggle slides
        slides.forEach((s, idx) => {
            s.classList.remove('active', 'exit');
            if ((idx + 1) === currentStep) {
                s.classList.add('active');
            } else if ((idx + 1) < currentStep) {
                s.classList.add('exit');
            }
        });

        // Update dots
        dots.forEach((dot, idx) => {
            dot.classList.remove('active', 'completed');
            if ((idx + 1) === currentStep) {
                dot.classList.add('active');
            } else if ((idx + 1) < currentStep) {
                dot.classList.add('completed');
            }
        });

        // Progress line
        const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
        if (progressLine) {
            progressLine.style.setProperty('--progress-width', progressPercent + '%');
            // Adding a dynamic style for the pseudo-element via JS is tricky, so we use a CSS variable
            const style = document.createElement('style');
            style.innerHTML = `.bi-stepper-progress::after { width: ${progressPercent}%; }`;
            document.head.appendChild(style);
        }

        // Controls
        btnPrev.disabled = (currentStep === 1);
        btnNext.textContent = (currentStep === totalSteps) ? "Xác nhận" : "Tiếp tục";
        if (currentStep === totalSteps) btnNext.style.display = 'none'; // Use final button on slide instead
        else btnNext.style.display = 'block';

        if (stepNumDisplay) stepNumDisplay.textContent = currentStep;

        // Auto-scroll to top of card on step change
        document.querySelector('.bi-wizard-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    btnNext.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            // If it's a quiz slide, validate answer first
            if (isQuizStep(currentStep)) {
                if (!validateQuiz(currentStep)) return;
            }
            currentStep++;
            updateWizard();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizard();
        }
    });

    function isQuizStep(step) {
        // Steps 4-8 are Q1-Q5
        return step >= 4 && step <= 8;
    }

    function validateQuiz(step) {
        const qNum = step - 3; // Step 4 is Q1
        const selected = document.querySelector(`input[name="q${qNum}"]:checked`);
        
        if (!selected) {
            showToast("Vui lòng chọn một câu trả lời", "error");
            return false;
        }

        const isCorrect = selected.value === 'correct';
        const optBox = selected.closest('.bi-opt');
        
        // Remove old classes
        const slide = document.getElementById('step' + step);
        slide.querySelectorAll('.bi-opt').forEach(o => o.classList.remove('correct-answer', 'wrong-answer'));

        if (isCorrect) {
            optBox.classList.add('correct-answer');
            return true;
        } else {
            optBox.classList.add('wrong-answer');
            showToast("Câu trả lời chưa chính xác, vui lòng chọn lại", "error");
            return false;
        }
    }

    // ---- 3. Submit Registration ----
    btnSubmit.addEventListener('click', async () => {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Đang xử lý...";

        try {
            const res = await fetch(`${API}/become`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();

            if (data.success) {
                showToast("🎉 Chúc mừng! Bạn đã là Instructor.", "success");
                
                // Update local role
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                u.roleId = 4;
                localStorage.setItem('user', JSON.stringify(u));

                setTimeout(() => {
                    window.location.href = '../profile/profile.html';
                }, 2000);
            } else {
                showToast(data.message || "Lỗi cập nhật", "error");
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Xác nhận & Bắt đầu ngay";
            }
        } catch (err) {
            showToast("Mất kết nối server", "error");
            btnSubmit.disabled = false;
        }
    });

    // ---- Helper: Toast ----
    function showToast(msg, type = 'success') {
        const t = document.getElementById('biToast');
        if (!t) return;
        t.textContent = msg;
        t.className = `bi-toast ${type} show`;
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.className = 'bi-toast'; }, 3000);
    }

    // Init display
    updateWizard();
});
