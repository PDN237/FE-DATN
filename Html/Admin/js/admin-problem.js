import { adminApi } from './admin-api.js';

class AdminProblemManager {
  constructor() {
    this.currentPage = 1;
    this.currentProblemId = null;
    this.pendingDelete = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadProblems();
  }

  bindEvents() {
    // Problem list
    document.getElementById('btnAddProblem').addEventListener('click', () => this.openProblemModal());
    document.getElementById('problemSearch').addEventListener('input', debounce(this.searchProblems.bind(this), 300));
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
      }
      const row = e.target.closest('tr[data-action]');
      if (row && row.dataset.action === 'select') {
        this.selectProblem(row.dataset.id);
      }
    });

    // Problem modal
    document.getElementById('saveProblem').addEventListener('click', () => this.saveProblem());
    document.getElementById('cancelProblem').addEventListener('click', () => this.closeProblemModal());
    document.getElementById('closeProblemModal').addEventListener('click', () => this.closeProblemModal());

    // Testcase modal
    document.getElementById('btnAddTestCase').addEventListener('click', () => this.openTestcaseModal());
    document.getElementById('saveTestcase').addEventListener('click', () => this.saveTestcase());
    document.getElementById('cancelTestcase').addEventListener('click', () => this.closeTestcaseModal());
    document.getElementById('closeTestcaseModal').addEventListener('click', () => this.closeTestcaseModal());

    // Delete modal
    document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('closeDeleteModal').addEventListener('click', () => this.closeDeleteModal());
    document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());
  }

  async loadProblems(page = 1, search = '') {
    try {
      this.currentPage = page;
      document.getElementById('problemsTableBody').innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
      
      const data = await adminApi.getProblems(page, 10, search);
      this.renderProblems(data.problems);
      this.renderPagination(data.pagination, 'problem');
      
      document.getElementById('problemSearch').value = search;
  } catch (error) {
      console.error('Load problems error:', error);
      document.getElementById('problemsTableBody').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load problems</td></tr>';
    }
  }

  renderProblems(problems) {
    const tbody = document.getElementById('problemsTableBody');
    if (problems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No problems found</td></tr>';
      return;
    }

    tbody.innerHTML = problems.map(problem => `
      <tr data-problem-id="${problem.id}" class="problem-row ${problem.accept === false ? 'problem-hidden' : ''}" data-action="select" data-id="${problem.id}" style="cursor: pointer;" onmouseover="this.style.background=\'rgba(139, 92, 246, 0.1)\'" onmouseout="this.style.background=\'transparent\'">
        <td>${escapeHtml(problem.title)}</td>
        <td><span class="difficulty-badge difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span></td>
        <td>${problem.time_limit}ms</td>
        <td><span class="testcase-count ${this.getTestcaseStatusClass(problem.testcase_count)}">${problem.testcase_count}</span></td>
        <td><span class="count-badge">${problem.submission_count}</span></td>
        <td><span class="accept-badge ${problem.accept ? 'accept-active' : 'accept-hidden'}">${problem.accept ? 'Active' : 'Hidden'}</span></td>
        <td class="actions">
          <button class="btn btn-edit btn-sm" data-action="edit" data-id="${problem.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${problem.id}" data-title="${escapeHtml(problem.title)}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  selectProblem(id) {
    this.currentProblemId = id;
    this.loadTestCases(id);
  }

  getTestcaseStatusClass(count) {
    if (count >= 2) return 'good';
    if (count === 1) return 'warning';
    return 'danger';
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
    infoEl.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
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

    document.getElementById('problemModalTitle').textContent = problem ? 'Edit Problem' : 'Create New Problem';
    document.getElementById('problemId').value = problem ? problem.id : '';

    if (problem) {
      document.getElementById('problemTitle').value = problem.title;
      document.getElementById('problemDifficulty').value = problem.difficulty;
      document.getElementById('problemTimeLimit').value = problem.time_limit;
      document.getElementById('problemDescription').value = problem.description;
      document.getElementById('problemHints').value = problem.hints || '';
      document.getElementById('problemExamples').value = problem.examples || '';
      document.getElementById('problemAccept').checked = problem.accept !== false;
    } else {
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
      accept: document.getElementById('problemAccept').checked
    };

    try {
      if (problemId) {
        await adminApi.updateProblem(problemId, data);
        alert('Problem updated successfully!');
      } else {
        await adminApi.createProblem(data);
        alert('Problem created successfully! Add test cases below.');
      }
      this.closeProblemModal();
      this.loadProblems();
      this.loadTestCases(problemId || (await this.getLastProblemId()));
    } catch (error) {
      alert('Error: ' + error.message);
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
      await this.loadTestCases(id);
    } catch (error) {
      alert('Error loading problem: ' + error.message);
    }
  }

  async deleteProblem(id, title) {
    document.getElementById('deleteItemName').textContent = title;
    document.getElementById('deleteWarning').textContent = '';
    this.pendingDelete = { type: 'problem', id };
    document.getElementById('deleteConfirmModal').classList.add('active');
  }

  // Test Cases
  async loadTestCases(problemId) {
    if (!problemId) {
      document.getElementById('testcasesTableWrap').style.display = 'none';
      document.getElementById('testcaseToolbar').style.display = 'none';
      document.getElementById('tcWarning').style.display = 'none';
      return;
    }

    try {
      this.currentProblemId = problemId;
      document.getElementById('selectedProblemInfo').innerHTML = `<span class="selected-problem">Problem #${problemId}</span> selected`;
      
      const testcases = await adminApi.getTestCases(problemId);
      this.renderTestCases(testcases, problemId);
      
      const totalTC = testcases.length;
      const publicTC = testcases.filter(tc => !tc.is_hidden).length;
      
      document.getElementById('tcWarning').style.display = totalTC < 2 || publicTC < 1 ? 'inline' : 'none';
      
      document.getElementById('testcasesTableWrap').style.display = 'block';
      document.getElementById('testcaseToolbar').style.display = 'flex';
    } catch (error) {
      console.error('Load testcases error:', error);
    }
  }

  renderTestCases(testcases, problemId) {
    const tbody = document.getElementById('testcasesTableBody');
    if (testcases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No test cases. <button class="btn btn-primary btn-sm" onclick="adminProblems.openTestcaseModal()">Add first test case</button></td></tr>';
      return;
    }

    tbody.innerHTML = testcases.map(tc => `
      <tr data-tcid="${tc.id}" class="${tc.is_hidden ? 'hidden' : ''}">
        <td><div class="input-preview">${escapeHtml(tc.input_data)}</div></td>
        <td><div class="output-preview">${escapeHtml(tc.expected_output)}</div></td>
        <td>${tc.time_limit}ms</td>
        <td>${tc.is_hidden ? '<i class="fas fa-eye-slash text-danger"></i>' : '<i class="fas fa-eye text-success"></i>'}</td>
        <td class="actions">
          <button class="btn btn-edit btn-sm" onclick="adminProblems.editTestcase(${problemId}, ${tc.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-duplicate btn-sm" onclick="adminProblems.duplicateTestcase(${problemId}, ${tc.id})">
            <i class="fas fa-copy"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="adminProblems.deleteTestcase(${problemId}, ${tc.id}, 'Test Case #${tc.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  openTestcaseModal(testcase = null) {
    const modal = document.getElementById('testcaseModal');
    const form = document.getElementById('testcaseForm');
    form.reset();
    
    document.getElementById('testcaseModalTitle').textContent = testcase ? 'Edit Test Case' : 'Add Test Case';
    document.getElementById('testcaseId').value = testcase ? testcase.id : '';
    
    if (testcase) {
      document.getElementById('testcaseInput').value = testcase.input_data;
      document.getElementById('testcaseOutput').value = testcase.expected_output;
      document.getElementById('testcaseTimeLimit').value = testcase.time_limit;
      document.getElementById('testcaseHidden').checked = testcase.is_hidden;
    }
    
    modal.classList.add('active');
  }

  closeTestcaseModal() {
    document.getElementById('testcaseModal').classList.remove('active');
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
      alert('Error: ' + error.message);
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
      alert('Error loading testcase: ' + error.message);
    }
  }

  async duplicateTestcase(problemId, tcid) {
    if (confirm('Duplicate this test case?')) {
      try {
        await adminApi.duplicateTestCase(problemId, tcid);
        await this.loadTestCases(problemId);
        await this.loadProblems();
      } catch (error) {
        alert('Error duplicating: ' + error.message);
      }
    }
  }

  async deleteTestcase(problemId, tcid, name) {
    document.getElementById('deleteItemName').textContent = name;
    document.getElementById('deleteWarning').innerHTML = 'This will not affect existing submissions.';
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
      alert('Deleted successfully!');
    } catch (error) {
      alert('Delete failed: ' + error.message);
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

// Global instance
const adminProblems = new AdminProblemManager();

window.adminProblems = adminProblems;

