// FrontEnd/qr-stamptour/src/services/boothApi.js
import api from './api';

// 모든 부스 목록 조회
export const getAllBooths = async () => {
    try {
        const response = await api.get('/booths/');
        return response.data;
    } catch (error) {
        // console.error('부스 목록 조회 실패:', error);
        throw error;
    }
};

// 특정 부스 조회
export const getBooth = async (boothId) => {
    try {
        const response = await api.get(`/booths/${boothId}`);
        return response.data;
    } catch (error) {
        // console.error('부스 조회 실패:', error);
        throw error;
    }
};

// 부스 생성 (관리자 전용)
export const createBooth = async (boothData) => {
    try {
        const response = await api.post('/booths/', boothData);
        return response.data;
    } catch (error) {
        // console.error('부스 생성 실패:', error);
        throw error;
    }
};

// 부스 수정 (관리자 전용)
export const updateBooth = async (boothId, boothData) => {
    try {
        const response = await api.put(`/booths/${boothId}`, boothData);
        return response.data;
    } catch (error) {
        // console.error('부스 수정 실패:', error);
        throw error;
    }
};

// 부스 삭제 (관리자 전용)
export const deleteBooth = async (boothId) => {
    try {
        const response = await api.delete(`/booths/${boothId}`);
        return response.data;
    } catch (error) {
        // console.error('부스 삭제 실패:', error);
        throw error;
    }
};