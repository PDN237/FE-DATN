import { courseBuilderApi } from './course-builder-api.js';
import { adminApi } from './admin-api.js';

let currentCourse = null;
let currentNode = null;
let unsavedChanges = [];
let isDemoMode = false;


const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');

// Global fallback for legacy onclick (now unused)
window.CourseBuilder = {
  ready: false,
  init: () => {},
  showAddModal: () => alert('Loading...'),
  editNode: () => {},
  deleteNode: () => {}
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


  class CourseBuilder {
    static setReady() {
      window.CourseBuilder.ready = true;
      Object.values(elements).forEach(el => el.disabled = false);
      console.log('CourseBuilder ready - Event Delegation Active');
    }

    static async loadCourse(id) {
      try {
        currentCourse = await courseBuilderApi.loadCourseTree(id);
        isDemoMode = false;
      } catch (error) {
        console.warn('API failed, demo mode:', error);
        currentCourse = {
          Title: `Demo Course ${id}`,
          modules: [{ ModuleID: 1, Title: 'Introduction Module', lessons: [] }]
        };
        isDemoMode = true;
      }

      elements.courseName.textContent = currentCourse.Title + (isDemoMode ? ' [Demo]' : '');
      elements.courseTitleHeader.textContent = currentCourse.Title + ' - Course Builder';
      elements.courseModulesCount.textContent = `${currentCourse.modules.length} modules`;
      this.renderTree(currentCourse.modules);
    }

    static renderTree(modules) {
      let html = modules.map(module => {
        const lessonsHtml = (module.lessons || []).map(lesson => `
          <div class="tree-node lesson-node" data-id="${lesson.LessonID}" data-type="lesson" data-module-id="${module.ModuleID}">
            <span>📖 ${lesson.Title} (${lesson.Type || 'unknown'})</span>
          </div>
        `).join('');
        return `
          <div class="tree-node module-node" data-id="${module.ModuleID}" data-type="module" draggable="true" style="cursor: grab;">
            <span class="tree-node-title">📁 ${module.Title}</span>
            <div class="tree-node-actions">
              <button class="add-btn btn-primary add-lesson" data-module-id="${module.ModuleID}">+ Lesson</button>
              <button class="add-btn btn-secondary edit-module" data-module-id="${module.ModuleID}">Edit</button>
              <button class="add-btn btn-danger delete-module" data-module-id="${module.ModuleID}">Delete</button>
            </div>
            <div class="tree-children" draggable="false">${lessonsHtml}</div>
          </div>
        `;
      }).join('');

      elements.courseTree.innerHTML = html || `
        <div style="padding:20px;text-align:center;color:#94a3b8;">
          No modules yet. 
          <button class="add-btn btn-primary add-first-module" style="margin-top:10px;" 
                  data-parent-id="${courseId}" data-parent-type="course">
            ➕ Thêm Module đầu tiên
          </button>
        </div>
      `;
      
      if (html) this.bindDragAndDrop();
    }

    static bindDragAndDrop() {
      const treeContainer = elements.courseTree.querySelector('.tree-container') || elements.courseTree;
      const draggables = treeContainer.querySelectorAll('.module-node');
      
      draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
          draggable.classList.add('dragging');
          draggable.style.opacity = '0.5';
        });

        draggable.addEventListener('dragend', async () => {
          draggable.classList.remove('dragging');
          draggable.style.opacity = '1';
          
          // Collect new order and save to backend
          if (isDemoMode) return;
          const currentNodes = [...treeContainer.querySelectorAll('.module-node')];
          const newOrder = currentNodes.map((node, index) => ({
            moduleId: parseInt(node.dataset.id),
            orderIndex: index
          }));
          
          try {
            await courseBuilderApi.reorderModules({ courseId: courseId, order: newOrder });
            console.log('✅ Modules reordered successfully', newOrder);
          } catch (e) {
            console.error('Failed to reorder modules', e);
            alert('Lỗi khi lưu thứ tự module');
          }
        });
      });

      treeContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(treeContainer, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;
        
        if (afterElement == null) {
          treeContainer.appendChild(draggable);
        } else {
          treeContainer.insertBefore(draggable, afterElement);
        }
      });
    }

    static getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.module-node:not(.dragging)')];

      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    static showAddModal(parentId, parentType) {
      elements.parentIdInput.value = parentId;
      elements.parentTypeInput.value = parentType;
      elements.itemTitleInput.value = '';
      elements.lessonTypeGroup.style.display = parentType === 'module' ? 'block' : 'none';
      elements.addModalTitle.textContent = parentType === 'module' ? 'Thêm Lesson' : 'Thêm Module';
      elements.addModal.dataset.mode = 'add';
      elements.saveAdd.textContent = 'Thêm';
      elements.addModal.classList.add('active');
    }

    static async editNode(moduleId) {
      let module;
      try {
        if (!isDemoMode) module = await courseBuilderApi.getModule(moduleId);
        else module = currentCourse.modules.find(m => m.ModuleID == moduleId);
      } catch (error) {
        return alert('Load failed');
      }
      if (!module) return alert('Module not found');

      elements.parentIdInput.value = moduleId;
      elements.parentTypeInput.value = 'module';
      elements.itemTitleInput.value = module.Title || '';
      elements.lessonTypeGroup.style.display = 'none';
      elements.addModalTitle.textContent = 'Sửa Module';
      elements.addModal.dataset.mode = 'edit';
      elements.addModal.dataset.editId = moduleId;
      elements.saveAdd.textContent = 'Lưu';
      elements.addModal.classList.add('active');
    }

    static escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    static renderPreviewContent(lesson) {
      const type = lesson.Type;
      if (type === 'video') {
        return `<iframe src="${this.escapeHtml(lesson.ContentUrl || '')}" allowfullscreen></iframe>`;
      } else if (type === 'reading') {
        return `<div class="reading-preview">${this.escapeHtml(lesson.ContentHtml || 'No content')}</div>`;
      }
      return '<div class="text-center p-8 text-gray-400">Select type to see preview</div>';
    }

    static renderContentEditor(lesson) {
      const type = lesson.Type;
      if (type === 'video') {
        return `
          <h3 class="text-lg font-semibold mb-4 text-white">Video URL</h3>
          <input type="url" id="videoUrlInput" value="${this.escapeHtml(lesson.ContentUrl || '')}" placeholder="https://youtube.com/embed/..." class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 mb-4">
          <p class="text-sm text-gray-400">Paste YouTube embed URL. Preview updates live.</p>
        `;
      } else if (type === 'reading') {
        return `
          <h3 class="text-lg font-semibold mb-4 text-white">Reading Content</h3>
          <textarea id="readingContentInput" placeholder="Enter reading content...">${this.escapeHtml(lesson.ContentHtml || '')}</textarea>
          <p class="text-sm text-gray-400 mt-2">HTML supported. Preview updates live.</p>
        `;
      }
      return '<div class="text-center p-8 text-gray-400">Select lesson type</div>';
    }

    static renderEditorScript(lessonId) {
      return `
        // Live preview update
        function updatePreview() {
          const type = document.getElementById('lessonTypeSelect').value;
          const preview = document.getElementById('lessonPreview');
          const contentSection = document.getElementById('contentEditorSection');
          
          // Update title in header
          document.getElementById('editorTitle').textContent = document.getElementById('lessonTitleInput').value;
          
          if (type === 'video') {
            const url = document.getElementById('videoUrlInput')?.value || '';
            preview.innerHTML = url ? \`<iframe src="\${url}" allowfullscreen></iframe>\` : '<div class="text-center p-8 text-gray-400">Enter video URL</div>';
          } else if (type === 'reading') {
            const content = document.getElementById('readingContentInput')?.value || '';
            preview.innerHTML = \`<div class="reading-preview">\${content}</div>\`;
          }
          
          // Switch content editor
          contentSection.innerHTML = type === 'video' ? 
            \`<h3 class="text-lg font-semibold mb-4 text-white">Video URL</h3>
             <input type="url" id="videoUrlInput" value="\${preview.querySelector('iframe')?.src || ''}" placeholder="https://youtube.com/embed/..." class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 mb-4">
             <p class="text-sm text-gray-400">Live preview above</p>\` :
            type === 'reading' ? 
            \`<h3 class="text-lg font-semibold mb-4 text-white">Reading Content</h3>
             <textarea id="readingContentInput" placeholder="Reading content...">\${preview.innerHTML}</textarea>
             <p class="text-sm text-gray-400 mt-2">Live preview above</p>\` :
            \`<div class="text-center p-8 text-gray-400">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🧠</div>
              <h4>Quiz Editor Coming Soon</h4>
            </div>\`;
        }

        // Bind events
        document.getElementById('lessonTitleInput').addEventListener('input', updatePreview);
        document.getElementById('lessonTypeSelect').addEventListener('change', updatePreview);
        document.querySelector('#contentEditorSection input, #contentEditorSection textarea')?.addEventListener('input', updatePreview);
        
        document.getElementById('saveLessonBtn').addEventListener('click', async () => {
          const lessonId = '${lessonId}';
          const formData = {
            Title: document.getElementById('lessonTitleInput').value,
            Type: document.getElementById('lessonTypeSelect').value,
            Duration: parseInt(document.getElementById('lessonDurationInput').value) || 0,
            OrderIndex: parseInt(document.getElementById('lessonOrderInput').value) || 0
          };
          
          if (formData.Type === 'video') {
            formData.ContentUrl = document.getElementById('videoUrlInput')?.value || '';
          } else if (formData.Type === 'reading') {
            formData.ContentHtml = document.getElementById('readingContentInput')?.value || '';
          }
          
          try {
            await adminApi.updateLesson(lessonId, formData);
            alert('Lesson saved successfully!');
          } catch (error) {
            alert('Save failed: ' + error.message);
          }
        });
        
        document.getElementById('deleteLessonBtn').addEventListener('click', async () => {
          if (!confirm('Delete this lesson? This cannot be undone.')) return;
          
          try {
            await adminApi.deleteLesson('${lessonId}');
            alert('Lesson deleted!');
            // Reload tree
            window.CourseBuilder.loadCourse('${courseId}');
          } catch (error) {
            alert('Delete failed: ' + error.message);
          }
        });

        // Initial preview
        updatePreview();
      `;
    }

    static async deleteNode(moduleId) {
      if (!confirm('Delete module and all lessons?')) return;
      try {
        if (!isDemoMode) await courseBuilderApi.deleteModule(moduleId);
        else currentCourse.modules = currentCourse.modules.filter(m => m.ModuleID != moduleId);
        this.loadCourse(courseId);
        alert('Deleted!');
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    }

    static async selectLesson(lessonId) {
      try {
        const lesson = await adminApi.getLesson(lessonId);
        this.renderLessonEditor(lesson);
      } catch (error) {
        console.error('Load lesson failed:', error);
        document.getElementById('contentPanel').innerHTML = '<div class="text-center p-8 text-gray-400">Failed to load lesson</div>';
      }
    }

    static renderLessonEditor(lesson) {
      const contentPanel = document.getElementById('contentPanel');
      contentPanel.dataset.currentLessonId = lesson.LessonID;
      
      const html = `
        <div class="lesson-editor p-6 space-y-6">
          <div class="lesson-header flex justify-between items-center pb-4 border-b border-gray-700">
            <h2 class="text-2xl font-bold text-white">Edit Lesson: <span id="editorTitle">${this.escapeHtml(lesson.Title)}</span></h2>
            <div class="space-x-2">
              <button id="saveLessonBtn" class="btn btn-primary px-4 py-2">Save Changes</button>
              <button id="deleteLessonBtn" class="btn btn-danger px-4 py-2">Delete Lesson</button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Lesson Details Form -->
            <div class="lesson-form bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <h3 class="text-lg font-semibold mb-4 text-white">Lesson Details</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input type="text" id="lessonTitleInput" value="${this.escapeHtml(lesson.Title)}" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select id="lessonTypeSelect" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500">
                    <option value="video" ${lesson.Type === 'video' ? 'selected' : ''}>Video</option>
                    <option value="reading" ${lesson.Type === 'reading' ? 'selected' : ''}>Reading</option>
                    <option value="quiz" ${lesson.Type === 'quiz' ? 'selected' : ''}>Quiz</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Duration (seconds)</label>
                  <input type="number" id="lessonDurationInput" value="${lesson.Duration || 0}" min="0" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Order Index</label>
                  <input type="number" id="lessonOrderInput" value="${lesson.OrderIndex || 0}" min="0" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div class="lesson-preview bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <h3 class="text-lg font-semibold mb-4 text-white">Live Preview</h3>
              <div id="lessonPreview" class="preview-container min-h-[300px] bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600">
                ${this.renderPreviewContent(lesson)}
              </div>
            </div>
          </div>

          <!-- Content Editor (Video URL or Reading HTML) -->
          <div id="contentEditorSection" class="content-editor bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-700">
            ${this.renderContentEditor(lesson)}
          </div>
        </div>
      `;
      contentPanel.innerHTML = html;
      
      // Bind inline script
      const script = contentPanel.querySelector('script');
      if (script) {
        eval(script.textContent);
      }
    }



    static bindEvents() {
      // Toolbar
      elements.addFirstModule.onclick = () => this.showAddModal(courseId, 'course');
      elements.saveAllChanges.onclick = () => alert(isDemoMode ? 'Demo mode' : 'Saved!');
      elements.exportCourse.onclick = () => {
        const blob = new Blob([JSON.stringify(currentCourse, null, 2)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${currentCourse.Title}.json`;
        a.click();
      };

      // Modal
      elements.closeAddModal.onclick = elements.cancelAdd.onclick = () => elements.addModal.classList.remove('active');
      elements.saveAdd.onclick = () => {
        const isEdit = elements.addModal.dataset.mode === 'edit';
        const editId = elements.addModal.dataset.editId;
        this.saveItem(isEdit, editId);
      };

      // CORE: Event Delegation for Tree Buttons (NO onclick needed)
      elements.courseTree.addEventListener('click', (e) => {
        console.log('🖱️ CLICK:', e.target, 'on', e.target.className);
        const target = e.target.closest('button, .tree-node');
        if (!target || !target.closest('.tree-node')) return;

        const node = target.closest('.tree-node');
        const nodeType = node.dataset.type;
        const nodeId = node.dataset.id;
        const moduleId = target.dataset.moduleId || node.dataset.moduleId;
        const parentId = target.dataset.parentId;
        const parentType = target.dataset.parentType;

        // Select node
        document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
        node.classList.add('active');
        currentNode = {id: nodeId, type: nodeType};

        // Lesson selection - main feature!
        if (nodeType === 'lesson' && nodeId) {
          console.log('📖 Lesson clicked:', nodeId);
          console.log('LessonEditor available:', !!window.LessonEditor);
          if (window.LessonEditor && window.LessonEditor.show) {
            window.LessonEditor.show(nodeId);
          } else {
            console.error('❌ LessonEditor not ready!');
            document.getElementById('contentPanel').innerHTML = '<div class="text-center p-8 text-red-400">LessonEditor not loaded. Check console.</div>';
          }
          return;
        }

        // Button actions only
        if (target.classList.contains('add-first-module')) {
          this.showAddModal(parentId, parentType);
        } else if (target.classList.contains('add-lesson') && moduleId) {
          this.showAddModal(moduleId, 'module');
        } else if (target.classList.contains('edit-module') && moduleId) {
          this.editNode(moduleId);
        } else if (target.classList.contains('delete-module') && moduleId) {
          this.deleteNode(moduleId);
        }
      });
    }

    static async saveItem(isEdit = false, editId = null) {
      const parentType = elements.parentTypeInput.value;
      const parentId = elements.parentIdInput.value;
      const title = elements.itemTitleInput.value.trim();
      const lessonType = elements.lessonTypeSelect.value;
      if (!title) return alert('Title required');

      try {
        if (!isDemoMode) {
          if (isEdit && parentType === 'module') await courseBuilderApi.updateModule({ModuleID: editId, Title: title});
          else if (parentType === 'course') await courseBuilderApi.addModule({CourseID: parseInt(parentId), Title: title});
          else {
            const result = await courseBuilderApi.addLesson({ModuleID: parseInt(parentId), Title: title, Type: lessonType});
            setTimeout(() => {
              if (result && result.lesson && window.LessonEditor) {
                window.LessonEditor.show(result.lesson.LessonID);
              }
            }, 500); // Wait for tree reload
          }
        } else {
          // Demo logic...
          if (isEdit && parentType === 'module') {
            const m = currentCourse.modules.find(m => m.ModuleID == editId);
            if (m) m.Title = title;
          } else if (parentType === 'course') {
            currentCourse.modules.push({ModuleID: Date.now(), Title: title, lessons: []});
          } else {
            const modIdx = currentCourse.modules.findIndex(m => m.ModuleID == parentId);
            if (modIdx >= 0) {
              if (!currentCourse.modules[modIdx].lessons) currentCourse.modules[modIdx].lessons = [];
              currentCourse.modules[modIdx].lessons.push({
                LessonID: Date.now(), Title: title, Type: lessonType
              });
            }
          }
        }
        elements.addModal.classList.remove('active');
        this.loadCourse(courseId);
        alert(isEdit ? 'Updated!' : 'Added!');
      } catch (error) {
        alert('Failed: ' + error.message);
      }
    }
  }

  CourseBuilder.bindEvents();
  await CourseBuilder.loadCourse(courseId);
  CourseBuilder.setReady();
  window.CourseBuilder = CourseBuilder;
});
