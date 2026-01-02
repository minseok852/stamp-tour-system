// src/services/adminApi.js
// 관리자 API 서비스 (설정 기능 추가)

import api from './api';

// ========================================
// 부스 관리 API
// ========================================

export const getBooths = async () => {
    try {
        const response = await api.get('/booths/');
        return response.data;
    } catch (error) {
        throw error.response?.data || '부스 목록 조회 실패';
    }
};

export const createBooth = async (boothData) => {
    try {
        const response = await api.post('/booths/', boothData);
        return response.data;
    } catch (error) {
        throw error.response?.data || '부스 등록 실패';
    }
};

export const deleteBooth = async (boothId) => {
    try {
        await api.delete(`/booths/${boothId}`);
        return true;
    } catch (error) {
        throw error.response?.data || '부스 삭제 실패';
    }
};

export const updateBooth = async (boothId, boothData) => {
    try {
        const response = await api.put(`/booths/${boothId}`, boothData);
        return response.data;
    } catch (error) {
        throw error.response?.data || '부스 수정 실패';
    }
};


// ========================================
// 대시보드 API
// ========================================
//대시보드 통계 조회
export const getDashboardStats = async () => {
    try {
        const response = await api.get('/admin/dashboard/stats');
        return response.data;
    } catch (error) {
        console.error('대시보드 통계 조회 실패:', error);
        throw error.response?.data || '대시보드 통계 조회 실패';
    }
};
//QR/PIN 수집 비율 조회
export const getCollectionStats = async () => {
    try {
        const response = await api.get('/admin/collection-stats');
        return response.data;
    } catch (error) {
        console.error('수집 비율 조회 실패:', error);
        throw error.response?.data || '수집 비율 조회 실패';
    }
};
//의심 기록 조회
export const getSuspiciousRecords = async (limit = 20) => {
    try {
        const response = await api.get(`/admin/suspicious?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('의심 기록 조회 실패:', error);
        throw error.response?.data || '의심 기록 조회 실패';
    }
};

export const getTimeStats = async (date = null) => {
    try {
        const url = date ? `/admin/time-stats?date=${date}` : '/admin/time-stats';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('시간대별 통계 조회 실패:', error);
        throw error.response?.data || '시간대별 통계 조회 실패';
    }
};


// ========================================
// 사용자 관리 API
// ========================================

export const getAllUsers = async (search = '', status = 'all') => {
    try {
        let url = '/admin/users';
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (status && status !== 'all') params.push(`status=${status}`);
        if (params.length > 0) url += '?' + params.join('&');
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
        throw error.response?.data || '사용자 목록 조회 실패';
    }
};

export const getCompleters = async () => {
    try {
        const response = await api.get('/admin/completers');
        return response.data;
    } catch (error) {
        console.error('완주자 목록 조회 실패:', error);
        throw error.response?.data || '완주자 목록 조회 실패';
    }
};

export const getUserDetail = async (studentId) => {
    try {
        const response = await api.get(`/admin/users/${studentId}`);
        return response.data;
    } catch (error) {
        console.error('사용자 상세 조회 실패:', error);
        throw error.response?.data || '사용자 상세 조회 실패';
    }
};

export const grantStamp = async (studentId, boothId, reason) => {
    try {
        const response = await api.post('/admin/grant-stamp', null, {
            params: {
                student_id: studentId,
                booth_id: boothId,
                reason: reason
            }
        });
        return response.data;
    } catch (error) {
        console.error('스탬프 부여 실패:', error);
        throw error.response?.data || '스탬프 부여 실패';
    }
};


// ========================================
// 부스 통계 API
// ========================================

export const getBoothStats = async () => {
    try {
        const response = await api.get('/admin/booths/stats');
        return response.data;
    } catch (error) {
        console.error('부스 통계 조회 실패:', error);
        throw error.response?.data || '부스 통계 조회 실패';
    }
};


// ========================================
// 설정 API
// ========================================

// 이벤트 설정 조회
export const getSettings = async () => {
    try {
        const response = await api.get('/admin/settings');
        return response.data;
    } catch (error) {
        console.error('설정 조회 실패:', error);
        throw error.response?.data || '설정 조회 실패';
    }
};

// 이벤트 설정 저장
export const updateSettings = async (settings) => {
    try {
        const response = await api.put('/admin/settings', settings);
        return response.data;
    } catch (error) {
        console.error('설정 저장 실패:', error);
        throw error.response?.data || '설정 저장 실패';
    }
};

// 부스 PIN 목록 조회
export const getBoothPins = async () => {
    try {
        const response = await api.get('/admin/booths/pins');
        return response.data;
    } catch (error) {
        console.error('부스 PIN 조회 실패:', error);
        throw error.response?.data || '부스 PIN 조회 실패';
    }
};

// 부스 PIN 수정
export const updateBoothPin = async (boothId, newPin) => {
    try {
        const response = await api.put(`/admin/booths/${boothId}/pin`, { qr_pin: newPin });
        return response.data;
    } catch (error) {
        console.error('PIN 수정 실패:', error);
        throw error.response?.data || 'PIN 수정 실패';
    }
};


// ========================================
// 데이터 내보내기 API
// ========================================

export const exportUsers = async () => {
    try {
        const response = await api.get('/admin/users');
        return response.data;
    } catch (error) {
        throw error.response?.data || '사용자 데이터 내보내기 실패';
    }
};

export const exportCompleters = async () => {
    try {
        const response = await api.get('/admin/completers');
        return response.data;
    } catch (error) {
        throw error.response?.data || '완주자 데이터 내보내기 실패';
    }
};

export const exportBoothStats = async () => {
    try {
        const response = await api.get('/admin/booths/stats');
        return response.data;
    } catch (error) {
        throw error.response?.data || '부스 통계 내보내기 실패';
    }
};

export const exportSuspicious = async () => {
    try {
        const response = await api.get('/admin/suspicious?limit=100');
        return response.data;
    } catch (error) {
        throw error.response?.data || '의심 기록 내보내기 실패';
    }
};