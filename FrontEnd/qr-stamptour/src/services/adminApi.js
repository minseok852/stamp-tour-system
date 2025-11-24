// 대시보드 데이터, QR 관리 관련 api
// src/services/adminApi.js

import api from './api';

// 1. 모든 부스 목록 조회 (READ)
export const getBooths = async () => {
    try {
        // 백엔드 API: GET /booths/
        const response = await api.get('/booths/');
        return response.data;
    } catch (error) {
        throw error.response.data || '부스 목록 조회 실패';
    }
};

// 2. 새 부스 등록 (CREATE)
export const createBooth = async (boothData) => {
    try {
        // 백엔드 API: POST /booths/
        const response = await api.post('/booths/', boothData);
        return response.data;
    } catch (error) {
        throw error.response.data || '부스 등록 실패';
    }
};

// 3. 부스 삭제 (DELETE)
export const deleteBooth = async (boothId) => {
    try {
        // 백엔드 API: DELETE /booths/{booth_id}
        await api.delete(`/booths/${boothId}`);
        return true;
    } catch (error) {
        throw error.response.data || '부스 삭제 실패';
    }
};