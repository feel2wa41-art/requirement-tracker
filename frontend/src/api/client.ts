import axios from 'axios';

// API 기본 설정
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (인증 토큰 등을 여기서 처리)
api.interceptors.request.use(
  (config) => {
    // 여기서 인증 토큰을 추가할 수 있습니다
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      url: error.config?.url,
    });

    // 공통 에러 처리
    if (error.response?.status === 401) {
      // 인증 에러 처리
      console.warn('🔐 Unauthorized access');
      // 로그인 페이지로 리다이렉트 등
    } else if (error.response?.status === 403) {
      // 권한 에러 처리
      console.warn('🚫 Forbidden access');
    } else if (error.response?.status === 404) {
      // 리소스 없음 에러 처리
      console.warn('🔍 Resource not found');
    } else if (error.response?.status >= 500) {
      // 서버 에러 처리
      console.error('🛠️ Server error');
    }

    return Promise.reject(error);
  }
);

// 에러 응답 타입
export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

// 성공적인 API 응답인지 확인하는 타입 가드
export function isApiError(response: any): response is ApiError {
  return response && typeof response.error === 'string';
}

export default api;