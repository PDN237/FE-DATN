import { courseBuilderApi } from './course-builder-api.js';

let currentCourse = null;
let currentNode = null;
let unsavedChanges = [];
let isDemoMode = false;

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');

// Early global fallback
window.CourseBuilder = {
  ready: false,
  init: () => {},
  showAddModal: () => alert('Loading...'),
  editNode: () => {},
  deleteNode: () => {},
  saveNewItem: () => {}
};

document.addEventListener('DOMContentLoaded', async () => {

  const elements = {
    courseTitleHeader: document.getElementById('courseTitleHeader'),
    courseName: document.getElementById('courseName'),
    courseModulesCount: document.getElementById('courseModulesCount'),
    courseTree: document.getElementById('courseTree'),
    addFirstModule: document.getElementById('addFirstModule'),
    saveAllChanges: document.getElementById('saveAllChanges'),
    exportCourse: document.getElementById('exportCourse'),
    addModal: document.getElementById('addModal'),
    closeAddModal: document.getElementById('closeAddModal'),
    cancelAdd: document.getElementById('cancelAdd'),
    saveAdd: document.getElementById('saveAdd'),
    addModalTitle: document.getElementById('addModalTitle'),
    parentIdInput: document.getElementById('parentId'),
    parentTypeInput: document.getElementById('parentType'),
    itemTitleInput: document.getElementById('itemTitle'),
    lessonTypeGroup: document.getElementById('lessonTypeGroup'),
    lessonTypeSelect: document.getElementById('lessonType')
  };

  if (!courseId) {
    alert('No course ID');
    return;
  }

  Object.values(elements).forEach(el => {
    if (el) el.disabled = true;
  });

  class CourseBuilder {

    static setReady() {
      window.CourseBuilder.ready = true;
      Object.values(elements).forEach(el => {
        if (el) el.disabled = false;
      });
      console.log('CourseBuilder ready');
    }

    static async loadCourse(id) {

      try {
        currentCourse = await courseBuilderApi.loadCourseTree(id);
        isDemoMode = false;
      } catch (error) {

        console.warn('API load failed, using demo data:', error);

        currentCourse = {
          Title: `Demo Course ${id}`,
          modules: [
            {
              ModuleID: 1,
              Title: 'Introduction Module',
              lessons: []
            }
          ]
        };

        isDemoMode = true;
      }

      if (elements.courseName) {
        elements.courseName.textContent =
          currentCourse.Title + (isDemoMode ? ' [Demo]' : '');
      }

      if (elements.courseTitleHeader) {
        elements.courseTitleHeader.textContent =
          currentCourse.Title + ' - Course Builder';
      }

      if (elements.courseModulesCount) {
        elements.courseModulesCount.textContent =
          `${currentCourse.modules.length} modules`;
      }

      this.renderTree(currentCourse.modules);
    }

    static renderTree(modules) {

      let html = modules.map(module => {

        const lessonsHtml = (module.lessons || []).map(lesson => `
          <div class="tree-node lesson-node"
               data-id="${lesson.LessonID}"
               data-type="lesson"
               data-module-id="${module.ModuleID}">
            <span>📖 ${lesson.Title} (${lesson.Type || 'unknown'})</span>
          </div>
        `).join('');

        return `
          <div class="tree-node module-node"
               data-id="${module.ModuleID}"
               data-type="module">

            <span class="tree-node-title">📁 ${module.Title}</span>

            <div class="tree-node-actions">
              <button class="add-btn btn-primary add-lesson"
                data-module-id="${module.ModuleID}">
                Thêm Lesson
              </button>

              <button class="add-btn btn-secondary edit-module"
                data-module-id="${module.ModuleID}">
                Sửa Module
              </button>

              <button class="add-btn btn-danger delete-module"
                data-module-id="${module.ModuleID}">
                Xóa Module
              </button>
            </div>

            <div class="tree-children">
              ${lessonsHtml}
            </div>

          </div>
        `;

      }).join('');

      if (elements.courseTree) {

        elements.courseTree.innerHTML =
          html ||
          `<div style="padding:20px;text-align:center;color:#94a3b8;">
            No modules yet.
            <button class="add-btn btn-primary add-first-module"
                    style="margin-top:10px;"
                    data-parent-id="${courseId}"
                    data-parent-type="course">
              Thêm Module đầu tiên
            </button>
          </div>`;
      }
    }

    static async showAddModal(parentId, parentType) {

      if (elements.parentIdInput)
        elements.parentIdInput.value = parentId;

      if (elements.parentTypeInput)
        elements.parentTypeInput.value = parentType;

      if (elements.itemTitleInput)
        elements.itemTitleInput.value = '';

      if (elements.lessonTypeGroup) {
        elements.lessonTypeGroup.style.display =
          parentType === 'module' ? 'block' : 'none';
      }

      if (elements.addModalTitle) {
        elements.addModalTitle.textContent =
          parentType === 'module'
            ? 'Thêm Lesson'
            : 'Thêm Module';
      }

      elements.addModal.dataset.mode = 'add';

      if (elements.saveAdd)
        elements.saveAdd.textContent = 'Thêm';

      elements.addModal.classList.add('active');
    }

    static async editNode(moduleId) {

      let module;

      try {

        if (!isDemoMode) {
          module = await courseBuilderApi.getModule(moduleId);
        } else {
          module = currentCourse.modules.find(
            m => m.ModuleID == moduleId
          );
        }

      } catch (error) {
        alert('Module load failed');
        return;
      }

      if (!module) {
        alert('Module not found');
        return;
      }

      elements.parentIdInput.value = moduleId;
      elements.parentTypeInput.value = 'module';
      elements.itemTitleInput.value = module.Title;

      if (elements.lessonTypeGroup)
        elements.lessonTypeGroup.style.display = 'none';

      elements.addModalTitle.textContent = 'Sửa Module';

      elements.addModal.dataset.mode = 'edit';
      elements.addModal.dataset.editId = moduleId;

      elements.saveAdd.textContent = 'Lưu';

      elements.addModal.classList.add('active');
    }

    static async deleteNode(moduleId) {

      if (!confirm('Xóa module này?')) return;

      try {

        if (!isDemoMode) {
          await courseBuilderApi.deleteModule(moduleId);
        } else {
          currentCourse.modules =
            currentCourse.modules.filter(
              m => m.ModuleID != moduleId
            );
        }

        this.loadCourse(courseId);
        alert('Module đã xóa');

      } catch (error) {
        alert('Xóa thất bại');
      }
    }

    static bindEvents() {

      if (elements.addFirstModule) {
        elements.addFirstModule.onclick =
          () => this.showAddModal(courseId, 'course');
      }

      if (elements.saveAllChanges) {
        elements.saveAllChanges.onclick = () =>
          alert(isDemoMode
            ? 'Demo mode'
            : 'Saved!');
      }

      if (elements.exportCourse) {

        elements.exportCourse.onclick = () => {

          const blob = new Blob(
            [JSON.stringify(currentCourse, null, 2)],
            { type: 'application/json' }
          );

          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${currentCourse.Title}.json`;
          a.click();
        };
      }

      if (elements.closeAddModal)
        elements.closeAddModal.onclick =
          () => elements.addModal.classList.remove('active');

      if (elements.cancelAdd)
        elements.cancelAdd.onclick =
          () => elements.addModal.classList.remove('active');

      if (elements.saveAdd) {
        elements.saveAdd.onclick = () => {

          const isEdit =
            elements.addModal.dataset.mode === 'edit';

          const editId =
            elements.addModal.dataset.editId;

          this.saveItem(isEdit, editId);
        };
      }

      if (elements.courseTree) {

        elements.courseTree.addEventListener('click', (e) => {

          const node = e.target.closest('.tree-node');
          if (!node) return;

          const id =
            e.target.dataset.moduleId ||
            node.dataset.id;

          const parentId =
            e.target.dataset.parentId;

          const parentType =
            e.target.dataset.parentType;

          const type =
            node.dataset.type ||
            e.target.dataset.type;

          document
            .querySelectorAll('.tree-node')
            .forEach(n => n.classList.remove('active'));

          node.classList.add('active');

          currentNode = { id, type };

          if (e.target.classList.contains('add-first-module')) {
            this.showAddModal(parentId, parentType);
          }
          else if (e.target.classList.contains('add-lesson')) {
            this.showAddModal(id, 'module');
          }
          else if (e.target.classList.contains('edit-module')) {
            this.editNode(id);
          }
          else if (e.target.classList.contains('delete-module')) {
            this.deleteNode(id);
          }

        });

      }
    }

    static async saveItem(isEdit = false, editId = null) {

      const parentType = elements.parentTypeInput.value;
      const parentId = elements.parentIdInput.value;
      const title = elements.itemTitleInput.value.trim();
      const lessonType = elements.lessonTypeSelect.value;

      if (!title) return;

      try {

        if (!isDemoMode) {

          if (isEdit && parentType === 'module') {

            await courseBuilderApi.updateModule({
              ModuleID: editId,
              Title: title
            });

          }
          else if (parentType === 'course') {

            await courseBuilderApi.addModule({
              CourseID: parseInt(parentId),
              Title: title
            });

          }
          else {

            await courseBuilderApi.addLesson({
              ModuleID: parseInt(parentId),
              Title: title,
              Type: lessonType
            });

          }

        } else {

          if (isEdit && parentType === 'module') {

            const module =
              currentCourse.modules.find(
                m => m.ModuleID == editId
              );

            if (module) module.Title = title;

          }
          else if (parentType === 'course') {

            currentCourse.modules.push({
              ModuleID: Date.now(),
              Title: title,
              lessons: []
            });

          }
          else {

            const module =
              currentCourse.modules.find(
                m => m.ModuleID == parentId
              );

            if (module) {

              if (!module.lessons)
                module.lessons = [];

              module.lessons.push({
                LessonID: Date.now(),
                Title: title,
                Type: lessonType
              });

            }

          }
        }

        elements.addModal.classList.remove('active');
        this.loadCourse(courseId);

        alert(isEdit ? 'Updated!' : 'Added!');

      } catch (error) {
        alert('Operation failed');
      }
    }
  }

  CourseBuilder.bindEvents();
  await CourseBuilder.loadCourse(courseId);
  CourseBuilder.setReady();

  window.CourseBuilder = CourseBuilder;

});