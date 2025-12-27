// src/services/completionApi.js

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// 완주 상태 조회
export const getCompletionStatus = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        throw new Error('로그인이 필요합니다.');
    }
    
    const response = await fetch(`${API_URL}/stamps/completion-status`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('완주 상태 조회 실패');
    }
    
    return response.json();
};