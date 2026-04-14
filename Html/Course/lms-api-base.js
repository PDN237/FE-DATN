const LMS_API_BASE = 'https://be-datn-6gb6.onrender.com/api/courses';

export const api = {
  courses: `${LMS_API_BASE}/courses`,
  course: (id) => `${LMS_API_BASE}/${id}`,
  modulesLessons: (id) => `${LMS_API_BASE}/${id}/modules-lessons`,
  lesson: (id) => `${LMS_API_BASE}/lessons/${id}`,
  quiz: (lessonId) => `${LMS_API_BASE}/quizzes/${lessonId}`,
  progress: `${LMS_API_BASE}/user/progress`,
  updateProgress: `${LMS_API_BASE}/progress`,
  comments: (courseId) => `${LMS_API_BASE}/comments/${courseId}`
};
