// LMS API Base URL Config
// Backend: https://be-datn-6gb6.onrender.com (production)
window.API_BASE = 'https://be-datn-6gb6.onrender.com';

// Global userId helper (used across pages)
window.getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || parseInt(localStorage.getItem('userId')) || 1;
  } catch {
    return 1;
  }
};

// Helper fetch
window.apiFetch = async (endpoint, options = {}) => {
  const url = `${window.API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API ${endpoint}: ${response.status}`);
  }
  
  return response.json();
};


