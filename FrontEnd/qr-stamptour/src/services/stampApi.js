// src/services/stampApi.js
// 스탬프 관련 API 서비스

import api from './api';

// ⭐ QR 코드로 스탬프 수집 (GPS 기반)
export const collectStampByQR = async (qrCode, latitude, longitude) => {
    try {
        // 먼저 QR 코드로 부스 정보 조회
        const boothResponse = await api.get(`/booths/by-qr/${qrCode}`);
        const booth = boothResponse.data;
        
        // 스탬프 수집 요청
        const response = await api.post('/stamps/scan', {
            qr_code: qrCode,
            qr_pin: booth.qr_pin, // 부스의 PIN 사용
            user_latitude: latitude,
            user_longitude: longitude
        });
        
        return response.data;
    } catch (error) {
        console.error('QR 스탬프 수집 실패:', error);
        throw error;
    }
};

// ⭐ PIN 번호로 스탬프 수집 (GPS 오류 시)
export const collectStampByPin = async (boothId, pin) => {
    try {
        const response = await api.post('/stamps/pin', null, {
            params: {
                booth_id: boothId,
                pin: pin
            }
        });
        return response.data;
    } catch (error) {
        console.error('PIN 스탬프 수집 실패:', error);
        throw error;
    }
};

// 기존 scanStamp 함수 (호환성 유지)
export const scanStamp = async (qrCode, pin, latitude, longitude) => {
    try {
        const response = await api.post('/stamps/scan', {
            qr_code: qrCode,
            qr_pin: pin,
            user_latitude: latitude,
            user_longitude: longitude
        });
        return response.data;
    } catch (error) {
        console.error('스탬프 수집 실패:', error);
        throw error;
    }
};

// 내 스탬프 목록 조회
export const getMyStamps = async () => {
    try {
        const response = await api.get('/stamps/my-stamps');
        return response.data;
    } catch (error) {
        console.error('내 스탬프 조회 실패:', error);
        throw error;
    }
};

// 완주 상태 확인
export const getCompletionStatus = async () => {
    try {
        const response = await api.get('/stamps/completion-status');
        return response.data;
    } catch (error) {
        console.error('완주 상태 확인 실패:', error);
        throw error;
    }
};

// 부스 상태 조회 (내가 수집한 스탬프 표시)
export const getBoothsWithStatus = async () => {
    try {
        const response = await api.get('/stamps/booths-status');
        return response.data;
    } catch (error) {
        console.error('부스 상태 조회 실패:', error);
        throw error;
    }
};