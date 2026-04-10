import { adminApi } from './admin-api.js';

let currentPage = 1;
let searchTerm = '';
let coursesData = [];

// DOM elements
const searchInput = document.getElementById('courseSearch');
const addBtn = document.getElementById('btnAddCourse');
const tableBody = document.getElementById('coursesTableBody');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');

// Modals
const courseModal = document.getElementById('courseModal');
const deleteModal = document.getElementById('deleteConfirmModal');
const closeModal = document.getElementById('closeCourseModal');
const cancelCourse = document.getElementById('cancelCourse');
const saveCourseBtn = document.getElementById('saveCourse');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// Form elements
const courseForm = document.getElementById('courseForm');
const courseIdInput = document.getElementById('courseId');
const courseTitle = document.getElementById('courseTitle');
const courseDesc = document.getElementById('courseDescription');
const courseLevel = document.getElementById('courseLevel');
const courseThumb = document.getElementById('courseThumbnail');
const thumbPreview = document.getElementById('thumbnailPreview');
const modalTitle = document.getElementById('courseModalTitle');

// Delete elements
const deleteTitle = document.getElementById('deleteCourseTitle');
const deleteWarning = document.getElementById('deleteWarning');

class CourseManager {
  static async loadCourses(page = 1, search = '') {
    try {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
      
      const data = await adminApi.getCourses(page, 10, search);
      coursesData = data.courses || [];
      
      this.renderTable(data.courses);
      this.renderPagination(data.pagination);
    } catch (error) {
      console.error('Load courses error:', error);
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading courses</td></tr>';
    }
  }

  static renderTable(courses) {
    if (!courses.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No courses found</td></tr>';
      return;
    }
    
    tableBody.innerHTML = courses.map(course => `
      <tr>
        <td>
          <div class="course-title">
            ${course.Thumbnail ? `<img src="${course.Thumbnail}" class="course-thumb" alt="Thumbnail">` : ''}
            <div>
              <div class="font-semibold">${course.Title}</div>
              <div class="text-sm text-gray-400">${course.Description.substring(0, 80)}...</div>
            </div>
          </div>
        </td>
        <td><span class="badge ${course.Level === 'Nâng cao' ? 'badge-warning' : ''}">${course.Level}</span></td>
        <td>${course.moduleCount || 0}</td>
        <td>${new Date(course.CreatedAt).toLocaleDateString()}</td>
        <td class="actions">
          <button class="btn btn-sm" onclick="CourseManager.editCourse(${course.CourseID}, '${course.Title.replace(/'/g, "\\'")}', '${course.Description.replace(/'/g, "\\'")}', '${course.Level}', '${course.Thumbnail || ''}')">
            Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="CourseManager.confirmDelete(${course.CourseID}, '${course.Title.replace(/'/g, "\\'")}')">
            Delete
          </button>
 <a href="#" class="btn btn-sm" onclick="window.location.href='/FrondEnd/Html/Admin/course-builder.html?courseId=${course.CourseID}'; return false;">View</a>
         </td>
      </tr>
    `).join('');
  }

  static renderPagination(pag) {
    pageInfo.textContent = `Page ${pag.page} of ${pag.totalPages} (${pag.total} total)`;
    prevBtn.disabled = pag.page <= 1;
    nextBtn.disabled = pag.page >= pag.totalPages;
    pagination.style.display = 'flex';
  }

  static async editCourse(id, title, desc, level, thumb) {
    courseIdInput.value = id;
    courseTitle.value = title;
    courseDesc.value = desc;
    courseLevel.value = level;
    courseThumb.value = thumb;
    CourseManager.previewThumbnail();
    modalTitle.textContent = 'Edit Course';
    courseModal.classList.add('active');
  }

  static confirmDelete(id, title) {
    courseIdInput.value = id; // reuse for delete
    deleteTitle.textContent = title;
    deleteWarning.style.display = 'none';
    deleteModal.classList.add('active');
  }

  static async viewDetails(id) {
    try {
      const course = await adminApi.getCourse(id);
      alert(`Course details:\nModules: ${course.modules?.length || 0}\nLessons: ${course.lessonCount}`);
      // TODO: Navigate to course details page
    } catch (error) {
      alert('Error loading details');
    }
  }

  static previewThumbnail() {
    const url = courseThumb.value;
    if (url) {
      thumbPreview.innerHTML = `<img src="${url}" alt="Preview" style="max-width: 100%; max-height: 120px; border-radius: 8px;">`;
    } else {
      thumbPreview.innerHTML = '';
    }
  }

  static resetForm() {
    courseForm.reset();
    courseIdInput.value = '';
    modalTitle.textContent = 'Add New Course';
    thumbPreview.innerHTML = '';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  CourseManager.loadCourses();
  
  // Search
  searchInput.addEventListener('input', debounce((e) => {
    searchTerm = e.target.value;
    CourseManager.loadCourses(1, searchTerm);
  }, 300));
  
  // Add course
  addBtn.addEventListener('click', () => {
    CourseManager.resetForm();
    courseModal.classList.add('active');
  });
  
  // Modal controls
  closeModal.addEventListener('click', () => courseModal.classList.remove('active'));
  cancelCourse.addEventListener('click', () => courseModal.classList.remove('active'));
  cancelDelete.addEventListener('click', () => deleteModal.classList.remove('active'));
  
  // Form submit
  saveCourseBtn.addEventListener('click', async () => {
    if (!courseForm.checkValidity()) {
      courseForm.reportValidity();
      return;
    }
    
    try {
      const data = {
        Title: courseTitle.value.trim(),
        Description: courseDesc.value.trim(),
        Level: courseLevel.value,
        Thumbnail: courseThumb.value.trim()
      };
      
      if (courseIdInput.value) {
        await adminApi.updateCourse(courseIdInput.value, data);
      } else {
        await adminApi.createCourse(data);
      }
      
      courseModal.classList.remove('active');
      CourseManager.loadCourses(currentPage, searchTerm);
    } catch (error) {
      alert('Error saving course: ' + error.message);
    }
  });
  
  // Delete confirm
  confirmDelete.addEventListener('click', async () => {
    try {
      await adminApi.deleteCourse(courseIdInput.value);
      deleteModal.classList.remove('active');
      CourseManager.loadCourses(currentPage, searchTerm);
    } catch (error) {
      alert('Delete error: ' + error.message);
    }
  });
  
  // Pagination
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) CourseManager.loadCourses(--currentPage, searchTerm);
  });
  nextBtn.addEventListener('click', () => {
    CourseManager.loadCourses(++currentPage, searchTerm);
  });
  
  // Thumbnail preview
  courseThumb.addEventListener('input', () => CourseManager.previewThumbnail());
});

// Utils
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

// Expose to onclick handlers
window.CourseManager = CourseManager;

