//스탬프 조회/추가 관련 api
// src/services/stampApi.js

import api from './api';

// 1. 사용자 획득 스탬프 목록 조회 (나의 도장판)
export const getMyStamps = async () => {
    try {
        // 백엔드 API: GET /stamps/me
        const response = await api.get('/stamps/me');
        return response.data;
    } catch (error) {
        // 토큰 만료 등 인증 오류 시, Login 페이지로 리디렉션 처리 필요
        throw error.response.data || '도장판 정보를 불러오는데 실패했습니다.';
    }
};

// 2. QR 스캔을 통한 스탬프 획득 (다음 목표)
export const acquireStamp = async (qrCodeValue, latitude, longitude) => {
    try {
        // 백엔드 API: POST /stamps/acquire
        const response = await api.post('/stamps/acquire', {
            qr_code_value: qrCodeValue,
            user_latitude: latitude,
            user_longitude: longitude,
        });
        return response.data;
    } catch (error) {
        throw error.response.data || '스탬프 획득 실패';
    }
};