
// export const AUTH_API_BASE_URL = "http://localhost:8000";

// src/auth/authConfig.js

// 💡 කලින් තිබුණු URL එක වෙනුවට අපේ .env එකේ ලින්ක් එක කෙලින්ම මෙතනට දෙන්න 🚀
export const AUTH_API_BASE_URL = import.meta.env.VITE_HEALTH_BACKEND_URL || 'http://localhost:5000';