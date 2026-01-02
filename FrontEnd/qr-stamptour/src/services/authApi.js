// FrontEnd/qr-stamptour/src/services/authApi.js
// 인증 관련 API (토큰 만료 체크 추가)

import api from './api';

// ========================================
// 토큰 관련 유틸리티
// ========================================

/**
 * JWT 토큰 만료 여부 확인
 * @returns {boolean} 만료되었으면 true
 */
export const isTokenExpired = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return true;
    
    try {
        // JWT는 base64로 인코딩된 3부분 (header.payload.signature)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expTime = payload.exp * 1000; // 초 → 밀리초 변환
        
        // 현재 시간과 비교 (5분 여유를 두고 체크)
        const now = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5분
        
        return now > expTime - bufferTime;
    } catch (e) {
        console.error('토큰 파싱 실패:', e);
        return true; // 파싱 실패 시 만료로 처리
    }
};

/**
 * 토큰 남은 시간 확인 (디버깅용)
 * @returns {number} 남은 시간(분), 만료되었으면 0
 */
export const getTokenRemainingTime = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return 0;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expTime = payload.exp * 1000;
        const remaining = expTime - Date.now();
        
        return remaining > 0 ? Math.floor(remaining / 60000) : 0; // 분 단위
    } catch (e) {
        return 0;
    }
};

// ========================================
// 인증 상태 확인
// ========================================

/**
 * 로그인 여부 확인 (토큰 만료 체크 포함)
 * @returns {boolean} 로그인 상태
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    // 토큰이나 유저 정보가 없으면 미인증
    if (!token || !user) {
        return false;
    }
    
    // 토큰 만료 확인
    if (isTokenExpired()) {
        console.log('토큰이 만료되어 자동 로그아웃합니다.');
        logout();
        return false;
    }
    
    return true;
};

/**
 * 로그인 상태 검증 (서버 확인 포함)
 * 중요한 작업 전에 사용
 * @returns {Promise<boolean>}
 */
export const validateSession = async () => {
    // 1. 로컬 토큰 체크
    if (!isAuthenticated()) {
        return false;
    }
    
    // 2. 서버에서 토큰 유효성 확인
    try {
        await api.get('/auth/me');
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        }
        return false;
    }
};

// ========================================
// 로그인 / 로그아웃
// ========================================

/**
 * 로그인
 */
export const login = async (studentId, password) => {
    try {
        const response = await api.post('/auth/login', {
            student_id: studentId,
            password: password
        });

        const { access_token, user } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 로그아웃
 */
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
};

/**
 * 로그아웃 후 로그인 페이지로 이동
 */
export const logoutAndRedirect = () => {
    logout();
    // React Router 외부에서 리다이렉트
    window.location.href = '/login';
};

// ========================================
// 사용자 정보
// ========================================

/**
 * 현재 로그인한 사용자 정보 (로컬스토리지)
 */
export const getStoredUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

/**
 * 서버에서 현재 사용자 정보 조회 (토큰 유효성 검증)
 */
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        // 401 에러 시 토큰 삭제
        if (error.response?.status === 401) {
            logout();
        }
        throw error;
    }
};

/**
 * 관리자 여부 확인 (로컬)
 */
export const isAdmin = () => {
    const user = getStoredUser();
    return user?.role === 'admin';
};

// ========================================
// 회원가입 / 학번 확인
// ========================================

/**
 * 학번 중복확인
 */
export const checkStudentId = async (studentId) => {
    try {
        const response = await api.get(`/auth/check-student-id/${studentId}`);
        return response.data; // { available: true/false, message: "..." }
    } catch (error) {
        throw error;
    }
};

/**
 * 회원가입
 */
export const registerUser = async (userData) => {
    try {
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
        throw error;
    }
};