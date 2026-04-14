class LessonEditor {
  static escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static formatVideoUrl(url) {
    if (!url) return '';
    // Auto convert youtube watch links to embed links
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      return 'https://www.youtube.com/embed/' + ytMatch[2];
    }
    
    // Auto convert Google Drive links to preview links
    const driveRegex = /(?:drive\.google\.com\/)(?:file\/d\/|open\?id=)([a-zA-Z0-9_\-]+)/;
    const driveMatch = url.match(driveRegex);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    
    return url;
  }

  static async show(lessonId) {
    console.log('✅ LessonEditor.show called:', lessonId);
    const contentPanel = document.getElementById('contentPanel');
    
    // Show loading
    contentPanel.innerHTML = '<div class="text-center p-8"><div style="font-size:48px;">⏳</div>Loading lesson...</div>';
    
    try {
      // Fetch lesson
      const response = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/lessons/${lessonId}`);
      let lesson;
      if (response.ok) {
        lesson = await response.json();
      } else {
        // Demo fallback data
        lesson = {
          LessonID: lessonId,
          Title: 'Bubble Sort Introduction',
          Type: 'video',
          ContentUrl: 'https://www.youtube.com/embed/kPRA0W1kECg',
          ContentHtml: '<h3>Bubble Sort Algorithm</h3><p>Bubble sort is a simple sorting algorithm...</p>',
          Duration: 600,
          ModuleID: 1,
          OrderIndex: 1
        };
        console.log('Using demo lesson data');
      }
      
      LessonEditor.render(lesson);
    } catch (error) {
      console.error('Lesson load failed:', error);
      LessonEditor.render(LessonEditor.demoLesson);
    }
  }

  static render(lesson) {
    console.log('🎨 Rendering lesson:', lesson.LessonID, lesson.Title);
    const contentPanel = document.getElementById('contentPanel');
    
    const typeClass = lesson.Type === 'video' ? 'video-type' : lesson.Type === 'reading' ? 'reading-type' : 'quiz-type';
    
    const html = `
      <div class="lesson-editor">
        <div class="lesson-header">
          <h2>✏️ Chỉnh sửa Lesson: <span id="lesson-title-display">${this.escapeHtml(lesson.Title)}</span></h2>
          <div class="lesson-actions">
            <button id="save-lesson-btn" class="btn btn-primary lesson-btn">💾 Lưu thay đổi</button>
            <button id="delete-lesson-btn" class="btn btn-danger lesson-btn">🗑️ Xóa Lesson</button>
          </div>
        </div>
        
        <div class="lesson-main">
          <div class="lesson-details">
            <h3>📋 Thông tin Lesson</h3>
            <div class="form-group">
              <label>Tiêu đề Lesson</label>
              <input type="text" id="lesson-title" value="${this.escapeHtml(lesson.Title)}">
            </div>
            <div class="form-group">
              <label>Loại Lesson</label>
              <select id="lesson-type">
                <option value="video" ${lesson.Type === 'video' ? 'selected' : ''}>📹 Video</option>
                <option value="reading" ${lesson.Type === 'reading' ? 'selected' : ''}>📖 Reading</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Thời lượng (giây)</label>
                <input type="number" id="lesson-duration" value="${lesson.Duration || 0}" min="0">
              </div>
              <div class="form-group">
                <label>Thứ tự</label>
                <input type="number" id="lesson-order" value="${lesson.OrderIndex || 0}" min="0">
              </div>
            </div>
            <div class="form-group" style="margin-top: 12px;">
              <label>Mô tả chi tiết (Describe)</label>
              <textarea id="lesson-describe" style="width: 100%; min-height: 80px;" placeholder="Mô tả chi tiết bài học...">${this.escapeHtml(lesson.Describe || '')}</textarea>
            </div>
            <div class="form-group" style="margin-top: 12px; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="margin-bottom: 0;">Tóm tắt nội dung (Summary)</label>
                <button type="button" id="ai-generate-summary-btn" style="background-color: #8b5cf6; color: white; border: none; border-radius: 4px; padding: 4px 10px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);">✨ AI Generate</button>
              </div>
              <textarea id="lesson-summary" style="width: 100%; min-height: 80px;" placeholder="Tóm tắt nội dung...">${this.escapeHtml(lesson.Summary || '')}</textarea>
            </div>
          </div>
          
          <div class="lesson-preview">
            <h3>👀 Xem trước</h3>
            <div id="preview-container" class="preview-container ${typeClass}">
              ${this.getPreviewContent(lesson)}
            </div>
          </div>
        </div>
        
        <div class="lesson-content-editor" id="content-editor">
          ${this.getContentEditor(lesson)}
        </div>
      </div>
    `;
    
    contentPanel.innerHTML = html;
    
    // 🔥 CRITICAL FIX: Bind events AFTER render (scripts in innerHTML never run)
    LessonEditor.bindEventsAfterRender(lesson.LessonID);
  }

  static getPreviewContent(lesson) {
    if (lesson.Type === 'video') {
      const videoSrc = this.formatVideoUrl(lesson.ContentUrl);
      return `<iframe src="${this.escapeHtml(videoSrc || '')}" width="100%" style="aspect-ratio: 16/9; min-height: 350px; border-radius: 8px;" frameborder="0" allowfullscreen></iframe>`;
    } else if (lesson.Type === 'reading') {
      if (lesson.ContentUrl) {
        const formattedUrl = this.formatVideoUrl(lesson.ContentUrl);
        return `<iframe src="${this.escapeHtml(formattedUrl)}" width="100%" height="100%" style="min-height:500px; border:none; border-radius: 8px;" allowfullscreen></iframe>`;
      }
      return `<div class="reading-preview">${lesson.ContentHtml || '<p>Chưa có nội dung...</p>'}</div>`;
    } else {
      return `<div class="quiz-preview">
        <div style="font-size:3rem;">🧠</div>
        <h4>Quiz Preview</h4>
        <p>Câu hỏi quiz sẽ hiển thị ở đây</p>
      </div>`;
    }
  }

  static getContentEditor(lesson) {
    let html = '';
    if (lesson.Type === 'video') {
      html = `
        <h3>🔗 Video URL</h3>
        <input type="url" id="video-url" value="${this.escapeHtml(lesson.ContentUrl || '')}" placeholder="https://youtube.com/embed/xxx">
        <p class="help-text">Paste YouTube embed URL để preview ngay</p>
      `;
    } else if (lesson.Type === 'reading') {
      html = `
        <div class="mb-4">
          <h3>🔗 Link Tài liệu (PDF/Document)</h3>
          <input type="url" id="reading-url" value="${this.escapeHtml(lesson.ContentUrl || '')}" placeholder="https://example.com/document.pdf">
          <p class="help-text">Nếu cung cấp link, hệ thống sẽ ưu tiên hiển thị file PDF.</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>📝 Hoặc nhập nội dung Text/HTML</h3>
          <textarea id="reading-content" placeholder="Viết nội dung reading..." style="width: 100%; min-height: 150px;">${this.escapeHtml(lesson.ContentHtml || '')}</textarea>
          <p class="help-text">Hỗ trợ HTML, preview live. Sẽ được hiển thị nếu trống Link ở trên.</p>
        </div>
      `;
    }
    
    html += `
      <div id="quiz-builder-container" class="mt-4 border-t border-gray-700 pt-4" style="margin-top: 30px; border-top: 1px solid #475569; padding-top: 20px;">
        <h3 style="color:#2dd4bf; margin-bottom: 12px;">🧠 Quản lý câu hỏi (Quiz)</h3>
        <div id="quiz-builder-inner"></div>
      </div>
    `;
    return html;
  }

  static onTypeChange() {
    const type = document.getElementById('lesson-type').value;
    const preview = document.getElementById('preview-container');
    const editor = document.getElementById('content-editor');
    
    // Update preview
    const title = document.getElementById('lesson-title').value;
    document.getElementById('lesson-title-display').textContent = title || 'Lesson mới';
    
    // Reset HTML to matching format from getContentEditor
    let html = '';
    
    // Demo content based on type
    if (type === 'video') {
      preview.innerHTML = '<iframe src="https://www.youtube.com/embed/kPRA0W1kECg" width="100%" style="aspect-ratio: 16/9; min-height: 350px; border-radius: 8px;" frameborder="0" allowfullscreen></iframe>';
      html = `
        <h3>🔗 Video URL</h3>
        <input type="url" id="video-url" value="https://www.youtube.com/embed/kPRA0W1kECg" placeholder="YouTube embed URL">
      `;
    } else if (type === 'reading') {
      preview.innerHTML = '<div class="reading-preview"><h3>Bài đọc mẫu</h3><p>Đây là nội dung bài đọc demo. Bạn có thể chỉnh sửa trực tiếp...</p></div>';
      html = `
        <div class="mb-4">
          <h3>🔗 Link Tài liệu (PDF/Document)</h3>
          <input type="url" id="reading-url" value="" placeholder="https://example.com/document.pdf">
          <p class="help-text">Nếu cung cấp link, hệ thống sẽ ưu tiên hiển thị file PDF.</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>📝 Hoặc nhập nội dung Text/HTML</h3>
          <textarea id="reading-content" style="width: 100%; min-height: 150px;"><h3>Bài đọc mẫu</h3><p>Đây là nội dung bài đọc demo...</p></textarea>
          <p class="help-text">Hỗ trợ HTML, preview live. Sẽ được hiển thị nếu trống Link ở trên.</p>
        </div>
      `;
    }
    
    html += `
      <div id="quiz-builder-container" class="mt-4 border-t border-gray-700 pt-4" style="margin-top: 30px; border-top: 1px solid #475569; padding-top: 20px;">
        <h3 style="color:#2dd4bf; margin-bottom: 12px;">🧠 Quản lý câu hỏi (Quiz)</h3>
        <div id="quiz-builder-inner"></div>
      </div>
    `;
    editor.innerHTML = html;
    
    const container = document.getElementById('quiz-builder-inner');
    const lessonId = document.getElementById('contentPanel').dataset.currentLessonId;
    if (window.QuizEditor && lessonId && container) {
      window.QuizEditor.render(lessonId, container);
    }
    
    LessonEditor.bindContentEditor();
  }

  static onTitleChange() {
    const title = document.getElementById('lesson-title').value;
    document.getElementById('lesson-title-display').textContent = title || 'Lesson mới';
  }

  static bindContentEditor() {
    const videoInput = document.getElementById('video-url');
    const readingUrl = document.getElementById('reading-url');
    const readingTextarea = document.getElementById('reading-content');
    
    if (videoInput) videoInput.oninput = LessonEditor.updateVideoPreview;
    if (readingUrl) readingUrl.oninput = LessonEditor.updateReadingPreview;
    if (readingTextarea) readingTextarea.oninput = LessonEditor.updateReadingPreview;
  }

  static updateVideoPreview() {
    const preview = document.getElementById('preview-container');
    const url = document.getElementById('video-url')?.value;
    const formattedUrl = LessonEditor.formatVideoUrl(url);
    preview.innerHTML = formattedUrl ? `<iframe src="${LessonEditor.escapeHtml(formattedUrl)}" width="100%" style="aspect-ratio: 16/9; min-height: 350px; border-radius: 8px;" frameborder="0" allowfullscreen></iframe>` : '<p>Nhập video URL để xem trước</p>';
  }

  static updateReadingPreview() {
    const preview = document.getElementById('preview-container');
    const url = document.getElementById('reading-url')?.value;
    const content = document.getElementById('reading-content')?.value;
    
    if (url) {
      const formattedUrl = LessonEditor.formatVideoUrl(url);
      preview.innerHTML = `<iframe src="${LessonEditor.escapeHtml(formattedUrl)}" width="100%" height="100%" style="min-height:500px; border:none; border-radius: 8px;" allowfullscreen></iframe>`;
    } else {
      preview.innerHTML = `<div class="reading-preview">${content || '<p>Chưa có nội dung...</p>'}</div>`;
    }
  }

  static bindButtons(lessonId) {
    document.getElementById('save-lesson-btn').onclick = () => LessonEditor.saveLesson(lessonId);
    document.getElementById('delete-lesson-btn').onclick = () => LessonEditor.deleteLesson(lessonId);
  }

  static async saveLesson(lessonId) {
    const formData = {
      Title: document.getElementById('lesson-title').value,
      Type: document.getElementById('lesson-type').value,
      Duration: parseInt(document.getElementById('lesson-duration').value) || 0,
      OrderIndex: parseInt(document.getElementById('lesson-order').value) || 0,
      Describe: document.getElementById('lesson-describe')?.value || '',
      Summary: document.getElementById('lesson-summary')?.value || ''
    };

    if (formData.Type === 'video') {
      const rawUrl = document.getElementById('video-url')?.value || '';
      formData.ContentUrl = LessonEditor.formatVideoUrl(rawUrl).trim();
    }
    if (formData.Type === 'reading') {
      const rawUrl = document.getElementById('reading-url')?.value || '';
      formData.ContentUrl = LessonEditor.formatVideoUrl(rawUrl).trim();
      formData.ContentHtml = document.getElementById('reading-content')?.value || '';
    }

    try {
      const response = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('✅ Lưu thành công!');
      } else {
        alert('❌ Lưu thất bại');
      }
    } catch (error) {
      alert('❌ Lỗi kết nối server');
    }
  }

  static async deleteLesson(lessonId) {
    if (!confirm('Xóa lesson này? Không thể khôi phục!')) return;
    
    try {
      const response = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/lessons/${lessonId}`, {method: 'DELETE'});
      if (response.ok) {
        alert('✅ Xóa thành công!');
        window.CourseBuilder.loadCourse(window.courseId || 1);
      }
    } catch {
      alert('❌ Xóa thất bại');
    }
  }

  static get demoLesson() {
    return {
      LessonID: 999,
      Title: 'Demo Lesson',
      Type: 'video',
      ContentUrl: 'https://www.youtube.com/embed/kPRA0W1kECg',
      ContentHtml: '<h3>Demo Reading</h3><p>Nội dung demo...</p>',
      Duration: 600,
      ModuleID: 1,
      OrderIndex: 1
    };
  }

  static bindEventsAfterRender(lessonId) {
    console.log('🔌 Binding events after render for lesson:', lessonId);
    
    // Bind core events
    const typeSelect = document.getElementById('lesson-type');
    const titleInput = document.getElementById('lesson-title');
    
    if (typeSelect) typeSelect.onchange = LessonEditor.onTypeChange;
    if (titleInput) titleInput.oninput = LessonEditor.onTitleChange;
    
    // Bind content editors
    LessonEditor.bindContentEditor();
    
    // Bind save/delete buttons
    LessonEditor.bindButtons(lessonId);
    
    // AI Generate Summary
    const aiBtn = document.getElementById('ai-generate-summary-btn');
    if (aiBtn) {
      aiBtn.onclick = async () => {
        const describeText = document.getElementById('lesson-describe').value;
        if (!describeText || !describeText.trim()) {
          alert('Vui lòng nhập "Mô tả chi tiết" trước khi dùng AI tạo tóm tắt.');
          return;
        }
        try {
          aiBtn.disabled = true;
          aiBtn.innerHTML = '⏳ Đang phân tích...';
          const apiUrl = window.API_BASE_URL || 'http://localhost:5000'; // fallback test local
          const baseUrl = window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1') ? apiUrl : 'https://be-datn-6gb6.onrender.com';
          
          const res = await fetch(`${baseUrl}/api/admin/ai-summary`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content: describeText })
          });
          const data = await res.json();
          if (res.ok && data.summary) {
            document.getElementById('lesson-summary').value = data.summary;
          } else {
            alert('Lỗi xử lý AI: ' + (data.error || 'Unknown server error'));
          }
        } catch (err) {
          alert('Lỗi kết nối API AI Generator: ' + err.message);
        } finally {
          aiBtn.disabled = false;
          aiBtn.innerHTML = '✨ AI Generate';
        }
      };
    }
    
    // Auto-render quiz for all types since we now allow quizzes everywhere
    const container = document.getElementById('quiz-builder-inner');
    if (window.QuizEditor && container) {
      window.QuizEditor.render(lessonId, container);
    }
    
    console.log('✅ All events bound successfully');
  }
}

window.LessonEditor = LessonEditor;
console.log('🌐 LessonEditor exposed to window');


