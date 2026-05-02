import { adminApi } from './admin-api.js';

class AdminProblemManager {
  constructor() {
    this.currentPage = 1;
    this.currentProblemId = null;
    this.pendingDelete = null;
    this.allProblems = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadProblems();
  }

  bindEvents() {
    // Problem list
    document.getElementById('btnAddProblem').addEventListener('click', () => this.openProblemModal());
    document.getElementById('problemSearch').addEventListener('input', debounce(this.filterProblems.bind(this), 300));
    document.getElementById('difficultyFilter').addEventListener('change', () => this.filterProblems());
    document.getElementById('statusFilter').addEventListener('change', () => this.filterProblems());
    document.getElementById('prevProblemPage').addEventListener('click', () => this.changePage(-1));
    document.getElementById('nextProblemPage').addEventListener('click', () => this.changePage(1));

    // Table event delegation
    document.getElementById('problemsTable').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        if (action === 'edit') this.editProblem(id);
        if (action === 'delete') this.deleteProblem(id, title);
        return; // Dừng lại ở đây, không chọn row
      }
      const row = e.target.closest('tr[data-problem-id]');
      if (row) {
        this.selectProblem(row.dataset.problemId);
      }
    });

    // Problem modal
    document.getElementById('saveProblem').addEventListener('click', () => this.saveProblem());
    document.getElementById('cancelProblem').addEventListener('click', () => this.closeProblemModal());
    document.getElementById('closeProblemModal').addEventListener('click', () => this.closeProblemModal());
    document.getElementById('problemModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('problemModal')) {
        this.closeProblemModal();
      }
    });

    // Testcase modal
    document.getElementById('btnAddTestCase').addEventListener('click', () => this.openTestcaseModal());
    document.getElementById('saveTestcase').addEventListener('click', () => this.saveTestcase());
    document.getElementById('cancelTestcase').addEventListener('click', () => this.closeTestcaseModal());
    document.getElementById('closeTestcaseModal').addEventListener('click', () => this.closeTestcaseModal());
    document.getElementById('testcaseModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('testcaseModal')) {
        this.closeTestcaseModal();
      }
    });

    // Testcase drawer
    const closeDrawerBtn = document.getElementById('closeTestcaseDrawer');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => this.closeTestcaseDrawer());
    }
    const drawerOverlay = document.getElementById('testcaseDrawerOverlay');
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', () => this.closeTestcaseDrawer());
    }

    // Delete modal
    document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('closeDeleteModal').addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());
    document.getElementById('deleteConfirmModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('deleteConfirmModal')) {
        this.closeDeleteModal();
      }
    });
  }

  async loadProblems(page = 1, search = '') {
    try {
      this.currentPage = page;
      document.getElementById('problemsTableBody').innerHTML = '<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 3rem;"><i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Đang tải...</td></tr>';
      
      const data = await adminApi.getProblems(page, 50, search);
      this.allProblems = data.problems;
      this.renderProblems(data.problems);
      this.updateStats(data.problems);
      this.renderPagination(data.pagination, 'problem');
      
      document.getElementById('problemSearch').value = search;
  } catch (error) {
      console.error('Load problems error:', error);
      document.getElementById('problemsTableBody').innerHTML = '<tr><td colspan="9" style="text-align: center; color: #ef4444; padding: 3rem;"><i class="fas fa-exclamation-circle" style="margin-right: 0.5rem;"></i> Lỗi tải dữ liệu</td></tr>';
    }
  }

  updateStats(problems) {
    const total = problems.length;
    const easy = problems.filter(p => p.difficulty === 'Easy').length;
    const medium = problems.filter(p => p.difficulty === 'Medium').length;
    const hard = problems.filter(p => p.difficulty === 'Hard').length;
    const active = problems.filter(p => p.accept !== false).length;
    const hidden = total - active;

    animateValue(document.getElementById('totalProblems'), 0, total, 1000);
    animateValue(document.getElementById('easyProblems'), 0, easy, 1000);
    animateValue(document.getElementById('mediumProblems'), 0, medium, 1000);
    animateValue(document.getElementById('hardProblems'), 0, hard, 1000);
    animateValue(document.getElementById('activeProblems'), 0, active, 1000);
    animateValue(document.getElementById('hiddenProblems'), 0, hidden, 1000);
  }

  renderProblems(problems) {
    const tbody = document.getElementById('problemsTableBody');
    if (problems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 3rem;"><i class="fas fa-code" style="margin-right: 0.5rem;"></i> Không có bài tập nào</td></tr>';
      return;
    }

    tbody.innerHTML = problems.map(problem => `
      <tr data-problem-id="${problem.id}" class="${problem.accept === false ? 'problem-hidden' : ''} ${this.currentProblemId == problem.id ? 'selected' : ''}">
        ${this.renderProblemRow(problem).innerHTML}
      </tr>
    `).join('');
  }

  renderProblemRow(problem) {
    const tr = document.createElement('tr');
    tr.dataset.id = problem.id;
    const difficultyClass = problem.difficulty || 'Medium';
    const statusClass = problem.accept ? 'active' : 'hidden';
    const statusText = problem.accept ? 'Đang hiện' : 'Đang ẩn';
    tr.innerHTML = `
      <td>${problem.id}</td>
      <td class="problem-title-cell">${escapeHtml(problem.title)}</td>
      <td><span class="difficulty-badge ${difficultyClass}">${escapeHtml(problem.difficulty)}</span></td>
      <td>${problem.time_limit}</td>
      <td>${problem.score || 0}</td>
      <td>${problem.testcase_count}</td>
      <td>${problem.submission_count}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit" data-action="edit" data-id="${problem.id}" title="Sửa">
            <i class="fas fa-edit"></i> Sửa
          </button>
          <button class="action-btn delete" data-action="delete" data-id="${problem.id}" data-title="${escapeHtml(problem.title)}" title="Xóa">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      </td>
    `;
    return tr;
  }

  filterProblems() {
    const search = document.getElementById('problemSearch').value.toLowerCase();
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = this.allProblems.filter(problem => {
      const matchesSearch = (problem.title || '').toLowerCase().includes(search);
      const matchesDifficulty = !difficultyFilter || problem.difficulty === difficultyFilter;
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && problem.accept !== false) ||
        (statusFilter === 'hidden' && problem.accept === false);
      return matchesSearch && matchesDifficulty && matchesStatus;
    });

    this.renderProblems(filtered);
  }

  selectProblem(id) {
    this.currentProblemId = id;
    this.renderProblems(this.allProblems); // Re-render to update selected state
    this.loadTestCases(id);
  }

  renderPagination(pagination, type) {
    const prefix = type === 'problem' ? 'problem' : 'testcase';
    const el = document.getElementById(`${prefix}Pagination`);
    const infoEl = document.getElementById(`${prefix}PageInfo`);
    
    if (pagination.totalPages <= 1) {
      el.style.display = 'none';
      return;
    }
    
    el.style.display = 'flex';
    infoEl.textContent = `Trang ${pagination.page} / ${pagination.totalPages}`;
  }

  async searchProblems() {
    const search = document.getElementById('problemSearch').value;
    await this.loadProblems(1, search);
  }

  changePage(delta) {
    const newPage = this.currentPage + delta;
    if (newPage < 1) return;
    this.loadProblems(newPage, document.getElementById('problemSearch').value);
  }

  openProblemModal(problem = null) {
    const modal = document.getElementById('problemModal');
    const form = document.getElementById('problemForm');
    form.reset();

    if (problem) {
      document.getElementById('problemModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa bài tập';
      document.getElementById('problemId').value = problem.id;
      document.getElementById('problemTitle').value = problem.title;
      document.getElementById('problemDifficulty').value = problem.difficulty;
      document.getElementById('problemTimeLimit').value = problem.time_limit;
      document.getElementById('problemDescription').value = problem.description;
      document.getElementById('problemHints').value = problem.hints || '';
      document.getElementById('problemExamples').value = problem.examples || '';
      document.getElementById('problemAccept').checked = problem.accept !== false;
      document.getElementById('problemScore').value = problem.score || 0;
    } else {
      document.getElementById('problemModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Tạo Bài tập';
      document.getElementById('problemId').value = '';
      document.getElementById('problemAccept').checked = true;
    }

    modal.classList.add('active');
  }

  closeProblemModal() {
    document.getElementById('problemModal').classList.remove('active');
  }

  async saveProblem() {
    const form = document.getElementById('problemForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const problemId = document.getElementById('problemId').value;
    const data = {
      title: document.getElementById('problemTitle').value,
      description: document.getElementById('problemDescription').value,
      difficulty: document.getElementById('problemDifficulty').value,
      time_limit: parseInt(document.getElementById('problemTimeLimit').value),
      hints: document.getElementById('problemHints').value,
      examples: document.getElementById('problemExamples').value,
      accept: document.getElementById('problemAccept').checked,
      score: parseInt(document.getElementById('problemScore').value) || 0
    };

    try {
      if (problemId) {
        await adminApi.updateProblem(problemId, data);
        alert('Cập nhật bài tập thành công!');
      } else {
        await adminApi.createProblem(data);
        alert('Tạo bài tập thành công! Thêm test cases bên dưới.');
      }
      this.closeProblemModal();
      this.loadProblems();
      this.loadTestCases(problemId || (await this.getLastProblemId()));
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  }

  async getLastProblemId() {
    try {
      const data = await adminApi.getProblems(1, 1, '');
      return data.problems[0]?.id;
    } catch {
      return null;
    }
  }

  async editProblem(id) {
    try {
      const problem = await adminApi.getProblem(id);
      this.currentProblemId = id;
      this.openProblemModal(problem);
    } catch (error) {
      alert('Lỗi tải bài tập: ' + error.message);
    }
  }

  async deleteProblem(id, title) {
    document.getElementById('deleteItemName').textContent = title;
    document.getElementById('deleteWarning').textContent = 'Hành động này sẽ xóa tất cả test cases và submissions liên quan.';
    this.pendingDelete = { type: 'problem', id };
    document.getElementById('deleteConfirmModal').classList.add('active');
  }

  // Test Cases
  async loadTestCases(problemId) {
    if (!problemId) {
      this.closeTestcaseDrawer();
      return;
    }

    try {
      this.currentProblemId = problemId;
      document.getElementById('selectedProblemInfo').textContent = `Bài tập #${problemId}`;
      document.getElementById('testcaseSection').classList.add('active');
      document.getElementById('testcaseDrawerOverlay').classList.add('active');
      
      const testcases = await adminApi.getTestCases(problemId);
      this.renderTestCases(testcases, problemId);
      
      const totalTC = testcases.length;
      const publicTC = testcases.filter(tc => !tc.is_hidden).length;
      
      document.getElementById('tcWarning').style.display = totalTC < 2 || publicTC < 1 ? 'flex' : 'none';
    } catch (error) {
      console.error('Load testcases error:', error);
    }
  }

  renderTestCases(testcases, problemId) {
    const tbody = document.getElementById('testcasesTableBody');
    if (testcases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 3rem;"><i class="fas fa-vial" style="margin-right: 0.5rem;"></i> Không có test case. <button class="action-btn edit" onclick="adminProblems.openTestcaseModal()">Thêm test case đầu tiên</button></td></tr>';
      return;
    }

    tbody.innerHTML = testcases.map(tc => `
      <tr data-tcid="${tc.id}" class="${tc.is_hidden ? 'hidden' : ''}">
        <td><div class="testcase-preview">${escapeHtml(tc.input_data)}</div></td>
        <td><div class="testcase-preview">${escapeHtml(tc.expected_output)}</div></td>
        <td>${tc.time_limit}ms</td>
        <td>${tc.is_hidden ? '<i class="fas fa-eye-slash" style="color: #ef4444;"></i>' : '<i class="fas fa-eye" style="color: #10b981;"></i>'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="adminProblems.editTestcase(${problemId}, ${tc.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn edit" onclick="adminProblems.duplicateTestcase(${problemId}, ${tc.id})">
              <i class="fas fa-copy"></i>
            </button>
            <button class="action-btn delete" onclick="adminProblems.deleteTestcase(${problemId}, ${tc.id}, 'Test Case #${tc.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  openTestcaseModal(testcase = null) {
    const modal = document.getElementById('testcaseModal');
    const form = document.getElementById('testcaseForm');
    form.reset();
    
    if (testcase) {
      document.getElementById('testcaseModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa Test Case';
      document.getElementById('testcaseId').value = testcase.id;
      document.getElementById('testcaseInput').value = testcase.input_data;
      document.getElementById('testcaseOutput').value = testcase.expected_output;
      document.getElementById('testcaseTimeLimit').value = testcase.time_limit;
      document.getElementById('testcaseHidden').checked = testcase.is_hidden;
    } else {
      document.getElementById('testcaseModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Thêm Test Case';
      document.getElementById('testcaseId').value = '';
    }
    
    modal.classList.add('active');
  }

  closeTestcaseModal() {
    document.getElementById('testcaseModal').classList.remove('active');
  }

  closeTestcaseDrawer() {
    document.getElementById('testcaseSection').classList.remove('active');
    const overlay = document.getElementById('testcaseDrawerOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  async saveTestcase() {
    const form = document.getElementById('testcaseForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const tcid = document.getElementById('testcaseId').value;
    const data = {
      input_data: document.getElementById('testcaseInput').value,
      expected_output: document.getElementById('testcaseOutput').value,
      time_limit: parseInt(document.getElementById('testcaseTimeLimit').value),
      is_hidden: document.getElementById('testcaseHidden').checked
    };

    try {
      if (tcid) {
        await adminApi.updateTestCase(this.currentProblemId, tcid, data);
      } else {
        await adminApi.createTestCase(this.currentProblemId, data);
      }
      this.closeTestcaseModal();
      await this.loadTestCases(this.currentProblemId);
      await this.loadProblems(); // Refresh problem list counts
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  }

  async editTestcase(problemId, tcid) {
    try {
      this.currentProblemId = problemId;
      const testcases = await adminApi.getTestCases(problemId);
      const testcase = testcases.find(tc => tc.id === tcid || tc.id === String(tcid));
      if (testcase) {
        this.openTestcaseModal(testcase);
      } else {
        throw new Error("Test case not found");
      }
    } catch (error) {
      alert('Lỗi tải testcase: ' + error.message);
    }
  }

  async duplicateTestcase(problemId, tcid) {
    if (confirm('Sao chép test case này?')) {
      try {
        await adminApi.duplicateTestCase(problemId, tcid);
        await this.loadTestCases(problemId);
        await this.loadProblems();
      } catch (error) {
        alert('Lỗi sao chép: ' + error.message);
      }
    }
  }

  async deleteTestcase(problemId, tcid, name) {
    document.getElementById('deleteItemName').textContent = name;
    document.getElementById('deleteWarning').textContent = 'Hành động này sẽ không ảnh hưởng đến các submissions đã tồn tại.';
    this.pendingDelete = { type: 'testcase', problemId, tcid };
    document.getElementById('deleteConfirmModal').classList.add('active');
  }

  async confirmDelete() {
    const { type, id, problemId, tcid } = this.pendingDelete;
    
    try {
      if (type === 'problem') {
        await adminApi.deleteProblem(id);
      } else {
        await adminApi.deleteTestCase(problemId, tcid);
      }
      this.closeDeleteModal();
      this.loadProblems();
      if (type === 'testcase') {
        this.loadTestCases(problemId);
      }
      alert('Đã xóa thành công!');
    } catch (error) {
      alert('Lỗi xóa: ' + error.message);
    }
  }

  closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    this.pendingDelete = null;
  }
}

// Utilities
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Global instance
const adminProblems = new AdminProblemManager();

window.adminProblems = adminProblems;

