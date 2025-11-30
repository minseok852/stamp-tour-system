// FrontEnd/qr-stamptour/src/services/authApi.js
import api from './api';

// 학번 중복확인
export const checkStudentId = async (studentId) => {
    try {
        const response = await api.get(`/auth/check-student-id/${studentId}`);
        return response.data; // { available: true/false, message: "..." }
    } catch (error) {
        //console.error('학번 중복확인 실패:', error);
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

        // ✅ 수정: accessToken → access_token
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    } catch (error) {
        //console.error('로그인 실패:', error); //디버그 용 주석 처리 테스트 완료
        throw error;
    }
};

// 로그아웃
export const logout = () => {
    // ✅ 수정: accessToken → access_token
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
};

// 로그인 여부 확인
export const isAuthenticated = () => {
    // ✅ 수정: accessToken → access_token
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
};

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
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
        //console.error('회원가입 실패:', error);
        throw error;
    }
};