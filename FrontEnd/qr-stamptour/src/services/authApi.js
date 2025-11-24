//회원가입 관련 기능 및 로그인 기능 api통신
// src/services/authApi.js

import api from './api';

// 관리자(또는 사용자) 로그인 API 호출
export const login = async (studentId, password) => {
    try {
        const response = await api.post('/auth/token', { 
            student_id: studentId, 
            password: password 
        });
        
        // 토큰을 로컬 스토리지에 저장 (인터셉터가 사용함)
        const token = response.data.access_token;
        localStorage.setItem('accessToken', token);

        return response.data;
    } catch (error) {
        throw error.response.data || '로그인 실패';
    }
};

// 로그아웃 (토큰 삭제)
export const logout = () => {
    localStorage.removeItem('accessToken');
};

// 사용자 등록 (선택 사항이지만 테스트를 위해 구현)
export const registerUser = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        throw error.response.data || '회원가입 실패';
    }
};