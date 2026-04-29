// Admin API utilities - /api/admin/* endpoints
// TODO: Add JWT token to headers once auth integrated

const API_BASE = 'https://be-datn-6gb6.onrender.com/api/admin';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    },
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) {
          errorMessage = errData.error;
        }
      } catch (e) {
        // Fallback to default if response isn't JSON
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Admin API error:', error);
    throw error;
  }
}

export const adminApi = {
  // Courses
  getCourses: (page = 1, size = 10, search = '') => 
    apiCall(`/courses?page=${page}&size=${size}&search=${encodeURIComponent(search)}`),
    
  getPendingCourses: (page = 1, size = 10, search = '') => 
    apiCall(`/courses/pending?page=${page}&size=${size}&search=${encodeURIComponent(search)}`),
    
  createCourse: (data) => apiCall('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => apiCall(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => apiCall(`/courses/${id}`, { method: 'DELETE' }),
  getCourse: (id) => apiCall(`/courses/${id}`),
  approveCourse: (id) => apiCall(`/courses/${id}/approve`, { method: 'PUT' }),
  rejectCourse: (id, feedback) => apiCall(`/courses/${id}/reject`, { method: 'PUT', body: JSON.stringify({ feedback }) }),
  

  // Course Builder
  getCourseBuilder: (id) => apiCall(`/course-builder/${id}`),
  
  // Modules
  createModule: (data) => apiCall('/modules', { method: 'POST', body: JSON.stringify(data) }),
  getModules: (courseId) => apiCall(`/modules/${courseId}`),
  updateModule: (id, data) => apiCall(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteModule: (moduleId) => apiCall(`/modules/${moduleId}`, { method: 'DELETE' }),
  reorderModules: (data) => apiCall('/modules/reorder', { method: 'POST', body: JSON.stringify(data) }),
  
  // Lessons
  createLesson: (data) => apiCall('/lessons', { method: 'POST', body: JSON.stringify(data) }),
  getLessons: (moduleId) => apiCall(`/modules/${moduleId}/lessons`),
  updateLesson: (id, data) => apiCall(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLesson: (id) => apiCall(`/lessons/${id}`),
  deleteLesson: (id) => apiCall(`/lessons/${id}`, { method: 'DELETE' }),
  
  // Quizzes
  createQuiz: (data) => apiCall('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  getQuizzes: (lessonId) => apiCall(`/quizzes/${lessonId}`),

  updateQuiz: (id, data) => apiCall(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuiz: (id) => apiCall(`/quizzes/${id}`, { method: 'DELETE' }),
  
  // Questions
  createQuestion: (data) => apiCall('/questions', { method: 'POST', body: JSON.stringify(data) }),
  getQuestions: (quizId) => apiCall(`/questions/${quizId}`),
  updateQuestion: (id, data) => apiCall(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id) => apiCall(`/questions/${id}`, { method: 'DELETE' }),
  
  // Answers
  createAnswer: (data) => apiCall('/answers', { method: 'POST', body: JSON.stringify(data) }),
  getAnswers: (questionId) => apiCall(`/answers/${questionId}`),
  updateAnswer: (id, data) => apiCall(`/answers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnswer: (id) => apiCall(`/answers/${id}`, { method: 'DELETE' }),

  // Problems
  getProblems: (page = 1, size = 10, search = '') => 
    apiCall(`/problems?page=${page}&size=${size}&search=${encodeURIComponent(search)}`),
  getProblem: (id) => apiCall(`/problems/${id}`),
  createProblem: (data) => apiCall('/problems', { method: 'POST', body: JSON.stringify(data) }),
  updateProblem: (id, data) => apiCall(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProblem: (id) => apiCall(`/problems/${id}`, { method: 'DELETE' }),

  // Test Cases
  getTestCases: (problemId) => apiCall(`/problems/${problemId}/testcases`),
  createTestCase: (problemId, data) => apiCall(`/problems/${problemId}/testcases`, { method: 'POST', body: JSON.stringify(data) }),
  updateTestCase: (problemId, tcid, data) => apiCall(`/problems/${problemId}/testcases/${tcid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTestCase: (problemId, tcid) => apiCall(`/problems/${problemId}/testcases/${tcid}`, { method: 'DELETE' }),
  duplicateTestCase: (problemId, tcid) => apiCall(`/problems/${problemId}/testcases/${tcid}/duplicate`, { method: 'POST' }),
};



