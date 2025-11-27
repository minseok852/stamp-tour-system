// src/services/authApi.js
// 회원가입 및 로그인 기능 API 통신
import api from './api';

// 1. 회원가입
export const registerUser = async (userData) => {
    try {
        // 백엔드 API: POST /auth/register
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
        throw error.response?.data || { detail: '회원가입에 실패했습니다.' };
    }
};

// 2. 로그인
export const loginUser = async (credentials) => {
    try {
        // 백엔드 API: POST /auth/login
        const response = await api.post('/auth/login', {
            student_id: credentials.studentId,
            password: credentials.password
        });
        
        const { access_token, user } = response.data;
        
        // 로컬 스토리지에 토큰 저장
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return response.data;
    } catch (error) {
        console.error('로그인 실패:', error);
        throw error.response?.data || { detail: '로그인에 실패했습니다.' };
    }
};

// 3. 로그아웃
export const logoutUser = () => {
    try {
        // 로컬 스토리지에서 토큰 제거
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return true;
    } catch (error) {
        console.error('로그아웃 실패:', error);
        return false;
    }
};

// 4. 현재 로그인한 사용자 정보 조회
export const getCurrentUser = async () => {
    try {
        // 백엔드 API: GET /auth/me
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        throw error.response?.data || { detail: '사용자 정보를 불러올 수 없습니다.' };
    }
};

// 5. 로그인 상태 확인
export const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken');
    return token !== null;
};

// 6. 저장된 사용자 정보 가져오기
export const getStoredUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('사용자 정보 파싱 실패:', e);
            return null;
        }
    }
    return null;
};

// 7. 학번 중복 확인 (선택적 - 회원가입 시 사용)
export const checkStudentId = async (studentId) => {
    try {
        // 실제로는 백엔드에서 별도 엔드포인트 필요
        // 임시로 registerUser 호출 전에 확인하는 방식
        return { available: true };
    } catch (error) {
        console.error('학번 중복 확인 실패:', error);
        throw error;
    }
};

// 8. 전화번호 인증번호 발송 (선택적 - SMS 기능)
export const sendVerificationCode = async (phoneNumber) => {
    try {
        // TODO: 실제 SMS API 연동 필요
        // const response = await api.post('/auth/send-verification', { phone_number: phoneNumber });
        // return response.data;
        
        console.log('인증번호 발송:', phoneNumber);
        return { success: true, message: '인증번호가 발송되었습니다.' };
    } catch (error) {
        console.error('인증번호 발송 실패:', error);
        throw error;
    }
};

// 9. 전화번호 인증 확인 (선택적 - SMS 기능)
export const verifyPhoneCode = async (phoneNumber, code) => {
    try {
        // TODO: 실제 SMS API 연동 필요
        // const response = await api.post('/auth/verify-phone', { 
        //     phone_number: phoneNumber,
        //     code: code
        // });
        // return response.data;
        
        console.log('인증번호 확인:', phoneNumber, code);
        return { verified: true, message: '인증이 완료되었습니다.' };
    } catch (error) {
        console.error('인증번호 확인 실패:', error);
        throw error;
    }
};