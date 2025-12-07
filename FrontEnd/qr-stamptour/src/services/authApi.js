// FrontEnd/qr-stamptour/src/services/authApi.js
import api from './api';

// 학번 중복확인
export const checkStudentId = async (studentId) => {
    try {
        const response = await api.get(`/auth/check-student-id/${studentId}`);
        return response.data; // { available: true/false, message: "..." }
    } catch (error) {
        throw error;
    }
};

// 로그인
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

// 로그아웃
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
};

// 로그인 여부 확인 (로컬 체크)
export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
};

// 현재 로그인한 사용자 정보 가져오기 (로컬스토리지)
export const getStoredUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// ⭐ 서버에서 현재 사용자 정보 조회 (토큰 유효성 검증)
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        // 401 에러 시 토큰 삭제
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
        throw error;
    }
};

// ⭐ 관리자 여부 확인 (로컬)
export const isAdmin = () => {
    const user = getStoredUser();
    return user?.role === 'admin';
};

// 회원가입
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