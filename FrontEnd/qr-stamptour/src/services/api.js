//services는 백엔드 fastapi 통신 로직 (Axios) 캡슐화
//api.js는 Axios 인스턴스 설정 
import axios from 'axios';

// 백엔드 FastAPI 서버의 기본 URL을 정의합니다.
const BASE_URL = 'http://127.0.0.1:8000/api/v1'; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 로컬 스토리지에서 JWT 토큰을 가져와 Header에 추가합니다.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Authorization: Bearer <token> 형식으로 헤더에 추가
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;