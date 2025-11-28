// src/services/authApi.js
// 회원가입 관련 기능 및 로그인 기능 api통신

import api from './api';

// 관리자(또는 사용자) 로그인 API 호출
export const login = async (studentId, password) => {
    try {
        // 백엔드 API: POST /api/v1/auth/login
        const response = await api.post('/auth/login', { 
            student_id: studentId, 
            password: password 
        });
        
        // 응답 구조: { access_token, token_type, user: {...} }
        const token = response.data.access_token;
        const user = response.data.user;
        
        // 토큰과 사용자 정보를 로컬 스토리지에 저장
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    } catch (error) {
        console.error('로그인 실패:', error);
        throw error.response?.data || { detail: '로그인 실패' };
    }
};

// 로그아웃 (토큰 삭제)
export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
};

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// 사용자 등록 (회원가입)
export const registerUser = async (userData) => {
    try {
        // 백엔드 API: POST /api/v1/auth/register
        const response = await api.post('/auth/register', {
            student_id: userData.studentId,
            password: userData.password,
            name: userData.name,
            phone_number: userData.phone,
            dept_name: userData.department,
            grade: parseInt(userData.grade),
            gender: userData.gender
        });
        
        return response.data;
    } catch (error) {
        console.error('회원가입 실패:', error);
        throw error.response?.data || { detail: '회원가입 실패' };
    }
};

export const isAuthenticated = () => {
    //jwt 토큰이 있는 지 확인
    return !!localStorage.getItem('accessToken');
}