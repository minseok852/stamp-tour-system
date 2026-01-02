// FrontEnd/qr-stamptour/src/services/userApi.js
// 사용자 정보 관련 API 서비스 (마이페이지용)

import api from './api';

/**
 * 내 프로필 조회 (상세 정보 + 스탬프 현황)
 */
export const getMyProfile = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '프로필 조회에 실패했습니다.');
    }
};

/**
 * 전화번호 변경
 * @param {string} phoneNumber - 새 전화번호 (예: "010-1234-5678")
 */
export const updatePhoneNumber = async (phoneNumber) => {
    try {
        const response = await api.put('/users/me/phone', {
            phone_number: phoneNumber
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '전화번호 변경에 실패했습니다.');
    }
};

/**
 * 비밀번호 변경
 * @param {string} newPassword - 새 비밀번호
 * @param {string} confirmPassword - 비밀번호 확인
 */
export const updatePassword = async (newPassword, confirmPassword) => {
    try {
        const response = await api.put('/users/me/password', {
            new_password: newPassword,
            confirm_password: confirmPassword
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    }
};

/**
 * 내 스탬프 요약 정보 조회
 */
export const getMyStampsSummary = async () => {
    try {
        const response = await api.get('/users/me/stamps-summary');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '스탬프 정보 조회에 실패했습니다.');
    }
};