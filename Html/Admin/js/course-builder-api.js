import { adminApi } from './admin-api.js';

// Make courseId global for access
window.courseId = null;

export const courseBuilderApi = {
  loadCourseTree: (courseId) => {
    window.courseId = courseId;
    return adminApi.getCourseBuilder(courseId);
  },
  
  // Modules
  addModule: (data) => adminApi.createModule(data),
  getModule: async (moduleId) => {
    console.log('getModule called:', moduleId);
    const courseId = window.courseId;
    if (!courseId) {
      console.error('No courseId available for getModule');
      return null;
    }
    try {
      const modules = await adminApi.getModules(courseId);
      const module = modules.find(m => m.ModuleID == moduleId);
      if (!module) console.warn('Module', moduleId, 'not found in course', courseId);
      return module || null;
    } catch (error) {
      console.error('getModule failed:', error);
      return null;
    }
  },
  updateModule: (data) => {
    console.log('Calling updateModule API:', data);
    return adminApi.updateModule(data.ModuleID, data);
  },
  deleteModule: (moduleId) => {
    console.log('Calling deleteModule API:', moduleId);
    return adminApi.deleteModule(moduleId);
  },
  reorderModules: (data) => adminApi.reorderModules(data),
  
  // Lessons
  addLesson: (data) => adminApi.createLesson(data),
  editLesson: (id, data) => adminApi.updateLesson(id, data),
  removeLesson: (id) => adminApi.deleteLesson(id),
  loadLessons: (moduleId) => adminApi.getLessons(moduleId),
  
  // Quizzes
  addQuiz: (data) => adminApi.createQuiz(data),
  editQuiz: (id, data) => adminApi.updateQuiz(id, data),
  removeQuiz: (id) => adminApi.deleteQuiz(id),
  loadQuizzes: (lessonId) => adminApi.getQuizzes(lessonId),
  
  // Questions
  addQuestion: (data) => adminApi.createQuestion(data),
  editQuestion: (id, data) => adminApi.updateQuestion(id, data),
  removeQuestion: (id) => adminApi.deleteQuestion(id),
  loadQuestions: (quizId) => adminApi.getQuestions(quizId),
  
  // Answers
  addAnswer: (data) => adminApi.createAnswer(data),
  editAnswer: (id, data) => adminApi.updateAnswer(id, data),
  removeAnswer: (id) => adminApi.deleteAnswer(id),
  loadAnswers: (questionId) => adminApi.getAnswers(questionId),
};

