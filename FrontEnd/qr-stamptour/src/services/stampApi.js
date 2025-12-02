// FrontEnd/qr-stamptour/src/services/stampApi.js
// 스탬프 조회/추가 관련 API

import api from './api';

// 1. 내 스탬프 목록 조회
export const getMyStamps = async () => {
    try {
        // 백엔드 API: GET /api/v1/stamps/my-stamps
        const response = await api.get('/stamps/my-stamps');
        return response.data;
    } catch (error) {
        // console.error('내 스탬프 조회 실패:', error);
        throw error;
    }
};

// 2. QR 스캔으로 스탬프 수집
export const scanStamp = async (qrCode, qrPin, latitude, longitude) => {
    try {
        // 백엔드 API: POST /api/v1/stamps/scan
        const response = await api.post('/stamps/scan', {
            qr_code: qrCode,
            qr_pin: qrPin,
            user_latitude: latitude,
            user_longitude: longitude
        });
        return response.data;
    } catch (error) {
        // console.error('스탬프 수집 실패:', error);
        throw error;
    }
};

// 3. PIN 수동 입력으로 스탬프 수집 (관리자용)
export const collectStampByPin = async (boothId, pin) => {
    try {
        // 백엔드 API: POST /api/v1/stamps/pin
        const response = await api.post('/stamps/pin', null, {
            params: {
                booth_id: boothId,
                pin: pin
            }
        });
        return response.data;
    } catch (error) {
        // console.error('PIN 스탬프 수집 실패:', error);
        throw error;
    }
};

// 4. 완주 상태 확인
export const getCompletionStatus = async () => {
    try {
        // 백엔드 API: GET /api/v1/stamps/completion-status
        const response = await api.get('/stamps/completion-status');
        return response.data;
    } catch (error) {
        // console.error('완주 상태 조회 실패:', error);
        throw error;
    }
};

// 5. 부스 수집 상태 조회 (모든 부스 + 내가 모은 것 표시)
export const getBoothsStatus = async () => {
    try {
        // 백엔드 API: GET /api/v1/stamps/booths-status
        const response = await api.get('/stamps/booths-status');
        return response.data;
    } catch (error) {
        // console.error('부스 상태 조회 실패:', error);
        throw error;
    }
};