class QuizEditor {
  static escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static async render(lessonId, containerEl) {
    containerEl.innerHTML = '<div class="text-center p-8"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><h4>Loading Quiz Data...</h4></div>';
    
    try {
      // 1. Fetch Quiz for this lesson
      const qRes = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/quizzes/${lessonId}`);
      let quizzes = [];
      if (qRes.ok) quizzes = await qRes.json();
      
      let quiz = quizzes.length > 0 ? quizzes[0] : null;
      let questions = [];

      // 2. Fetch Questions and Answers if Quiz exists
      if (quiz) {
        const qsRes = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/questions/${quiz.QuizID}`);
        if (qsRes.ok) {
          questions = await qsRes.json();
          // Load answers for each question
          for (let q of questions) {
            const ansRes = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/answers/${q.QuestionID}`);
            q.answers = ansRes.ok ? await ansRes.json() : [];
          }
        }
      } else {
        // If no quiz, create a skeleton one immediately
        const createQRes = await fetch('https://be-datn-6gb6.onrender.com/api/admin/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ LessonID: lessonId, Title: 'New Quiz' })
        });
        if (createQRes.ok) {
          const createData = await createQRes.json();
          quiz = createData.quiz;
        } else {
          throw new Error('Could not initialize quiz');
        }
      }

      this.currentQuiz = quiz;
      this.currentQuestions = questions;
      this.buildUI(lessonId, containerEl);
    } catch (error) {
      console.error(error);
      containerEl.innerHTML = `<div class="text-center p-8 text-red-400">Failed to load quiz: ${error.message}</div>`;
    }
  }

  static buildUI(lessonId, containerEl) {
    let ht = `
      <div class="quiz-editor-panel">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-white">🧠 Quản lý Câu hỏi Quiz</h3>
          <button id="add-question-btn" class="btn btn-primary">+ Thêm câu hỏi mới</button>
        </div>
        <div class="space-y-6" id="questions-container">
    `;

    if (this.currentQuestions.length === 0) {
      ht += `<div class="text-center text-gray-400 p-8">Chưa có câu hỏi nào. Hãy thêm câu hỏi mới!</div>`;
    } else {
      this.currentQuestions.forEach((q, qIndex) => {
        ht += this.buildQuestionCard(q, qIndex);
      });
    }

    ht += `</div></div>`;
    containerEl.innerHTML = ht;
    this.bindEvents(lessonId, containerEl);
  }

  static buildQuestionCard(q, qIndex) {
    let answersHtml = '';
    (q.answers || []).forEach((a, aIndex) => {
      answersHtml += `
        <div class="flex items-center gap-2 mb-2 p-2 bg-gray-800 rounded border border-gray-700">
          <input type="radio" name="correct_q${q.QuestionID}" class="w-4 h-4 cursor-pointer" 
                 data-qid="${q.QuestionID}" data-aid="${a.AnswerID}" ${a.IsCorrect ? 'checked' : ''}>
          <input type="text" class="flex-1 bg-transparent text-white border-0 focus:ring-0 answer-input" 
                 data-qid="${q.QuestionID}" data-aid="${a.AnswerID}" value="${this.escapeHtml(a.AnswerText)}" placeholder="Nhập câu trả lời...">
          <button class="text-red-400 hover:text-red-300 delete-answer-btn" data-qid="${q.QuestionID}" data-aid="${a.AnswerID}">✕</button>
        </div>
      `;
    });

    return `
      <div class="bg-gray-800 p-5 rounded-lg border border-gray-700 relative">
        <button class="absolute top-4 right-4 text-red-400 hover:text-red-300 delete-question-btn" data-qid="${q.QuestionID}">Xóa Câu Hỏi</button>
        
        <h4 class="text-white font-semibold mb-3">Câu ${qIndex + 1}</h4>
        
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-1">Câu hỏi:</label>
          <input type="text" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white question-text-input" 
                 data-qid="${q.QuestionID}" value="${this.escapeHtml(q.QuestionText)}" placeholder="Nhập nội dung câu hỏi...">
        </div>
        
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-1">Giải thích (tùy chọn):</label>
          <input type="text" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white question-expl-input" 
                 data-qid="${q.QuestionID}" value="${this.escapeHtml(q.Explanation)}" placeholder="Giải thích đáp án...">
        </div>

        <div class="mt-4">
          <div class="flex justify-between items-center mb-2">
            <label class="text-sm text-gray-400">Các đáp án (Chọn đáp án đúng):</label>
          </div>
          <div class="answers-list mb-3">
            ${answersHtml}
          </div>
          <button class="text-sm text-blue-400 hover:text-blue-300 add-answer-btn" data-qid="${q.QuestionID}">+ Thêm đáp án</button>
        </div>
      </div>
    `;
  }

  static bindEvents(lessonId, containerEl) {
    // Add Question
    const btnAddQ = containerEl.querySelector('#add-question-btn');
    if (btnAddQ) {
      btnAddQ.onclick = async () => {
        const text = prompt('Nội dung câu hỏi mới:');
        if (!text) return;
        
        const res = await fetch('https://be-datn-6gb6.onrender.com/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ QuizID: this.currentQuiz.QuizID, QuestionText: text, Explanation: '' })
        });
        if (res.ok) this.render(lessonId, containerEl); // reload full quiz
      };
    }

    // Delete Question
    containerEl.querySelectorAll('.delete-question-btn').forEach(btn => {
      btn.onclick = async (e) => {
        if (!confirm('Xóa câu hỏi này? Các câu trả lời cũng sẽ bị xóa (nếu CSDL không chặn).')) return;
        const qid = e.target.dataset.qid;
        
        // Let's manually delete answers first to prevent foreign key errors just in case
        const qObj = this.currentQuestions.find(q => q.QuestionID == qid);
        if (qObj && qObj.answers) {
          for (let a of qObj.answers) {
            await fetch(`https://be-datn-6gb6.onrender.com/api/admin/answers/${a.AnswerID}`, { method: 'DELETE' });
          }
        }

        const res = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/questions/${qid}`, { method: 'DELETE' });
        if (res.ok) this.render(lessonId, containerEl);
      };
    });

    // Add Answer
    containerEl.querySelectorAll('.add-answer-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const qid = e.target.dataset.qid;
        const res = await fetch('https://be-datn-6gb6.onrender.com/api/admin/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ QuestionID: parseInt(qid), AnswerText: 'Đáp án mới', IsCorrect: false })
        });
        if (res.ok) this.render(lessonId, containerEl);
      };
    });

    // Delete Answer
    containerEl.querySelectorAll('.delete-answer-btn').forEach(btn => {
      btn.onclick = async (e) => {
        if (!confirm('Xóa đáp án này?')) return;
        const aid = e.target.dataset.aid;
        const res = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/answers/${aid}`, { method: 'DELETE' });
        if (res.ok) this.render(lessonId, containerEl);
      };
    });

    // We'll update the database dynamically on blur/change for seamless experience
    
    // Auto-save Question Text & Explanation on blur
    containerEl.querySelectorAll('.question-text-input, .question-expl-input').forEach(input => {
      input.onblur = async (e) => {
        const qid = e.target.dataset.qid;
        const card = e.target.closest('div.bg-gray-800');
        const txt = card.querySelector('.question-text-input').value;
        const expl = card.querySelector('.question-expl-input').value;
        
        await fetch(`https://be-datn-6gb6.onrender.com/api/admin/questions/${qid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ QuestionText: txt, Explanation: expl })
        });
      };
    });

    // Auto-save Answer text on blur
    containerEl.querySelectorAll('.answer-input').forEach(input => {
      input.onblur = async (e) => {
        const aid = e.target.dataset.aid;
        const qid = e.target.dataset.qid;
        const txt = e.target.value;
        const isCorrect = containerEl.querySelector(`input[type="radio"][data-aid="${aid}"]`).checked;
        
        await fetch(`https://be-datn-6gb6.onrender.com/api/admin/answers/${aid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ AnswerText: txt, IsCorrect: isCorrect })
        });
      };
    });

    // Auto-save Answer IsCorrect on change
    containerEl.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.onchange = async (e) => {
        const aid = e.target.dataset.aid;
        const qid = e.target.dataset.qid;
        const txt = containerEl.querySelector(`.answer-input[data-aid="${aid}"]`).value;
        
        // This will update the chosen answer to correct, and backend automatically sets others to 0
        const res = await fetch(`https://be-datn-6gb6.onrender.com/api/admin/answers/${aid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ AnswerText: txt, IsCorrect: true })
        });

        // Backend unsets others, but wait let's just let UI reflect it (radio buttons automatically unselect others with same 'name')
      };
    });
  }
}

window.QuizEditor = QuizEditor;
