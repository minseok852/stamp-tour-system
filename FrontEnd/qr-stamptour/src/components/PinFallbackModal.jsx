// src/components/PinFallbackModal.jsx
// GPS 오류 시 PIN 입력 모달 - 부스 선택 기능 추가
import React, { useState, useEffect } from 'react';
import { collectStampByPin } from '../services/stampApi';
import { getAllBooths } from '../services/boothApi';
import '../styles/PinFallbackModal.css';

const PinFallbackModal = ({ boothId, qrCode, onClose, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // ⭐ 부스 선택 관련 상태
    const [booths, setBooths] = useState([]);
    const [selectedBoothId, setSelectedBoothId] = useState(boothId || '');
    const [boothsLoading, setBoothsLoading] = useState(false);

    // 부스 목록 로드
    useEffect(() => {
        const loadBooths = async () => {
            // boothId가 이미 있으면 부스 목록 안 불러와도 됨
            if (boothId) {
                setSelectedBoothId(boothId);
                return;
            }
            
            setBoothsLoading(true);
            try {
                const boothList = await getAllBooths();
                setBooths(boothList || []);
            } catch (err) {
                console.error('부스 목록 로드 실패:', err);
                setError('부스 목록을 불러올 수 없습니다.');
            } finally {
                setBoothsLoading(false);
            }
        };
        
        loadBooths();
    }, [boothId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedBoothId) {
            setError('부스를 선택해주세요.');
            return;
        }
        
        if (pin.length < 4) {
            setError('PIN은 최소 4자리 이상입니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // boothId를 숫자로 변환
            const numericBoothId = parseInt(selectedBoothId, 10);
            const result = await collectStampByPin(numericBoothId, pin);
            onSuccess(result);
        } catch (err) {
            console.error('PIN 스탬프 수집 에러:', err);
            
            // 에러 메시지 안전하게 추출
            let errorMessage = 'PIN이 올바르지 않습니다.';
            
            const detail = err.response?.data?.detail;
            
            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (Array.isArray(detail) && detail.length > 0) {
                errorMessage = detail[0]?.msg || '입력값이 올바르지 않습니다.';
            } else if (detail && typeof detail === 'object') {
                errorMessage = detail.msg || detail.message || '오류가 발생했습니다.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 선택된 부스 이름 찾기
    const getSelectedBoothName = () => {
        if (!selectedBoothId) return '';
        const booth = booths.find(b => String(b.booth_id) === String(selectedBoothId));
        return booth ? booth.booth_name : '';
    };

    return (
        <div className="pin-modal-overlay" onClick={onClose}>
            <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
                <button className="pin-modal-close" onClick={onClose}>×</button>
                
                <div className="pin-modal-header">
                    <span className="pin-icon">🔢</span>
                    <h2>PIN 번호 입력</h2>
                    <p>부스 담당자에게 PIN 번호를 확인하세요</p>
                </div>

                <form onSubmit={handleSubmit} className="pin-form">
                    {/* ⭐ 부스 선택 (boothId가 없을 때만 표시) */}
                    {!boothId && (
                        <div className="booth-select-container">
                            <label htmlFor="booth-select">부스 선택</label>
                            {boothsLoading ? (
                                <p className="loading-text">부스 목록 로딩 중...</p>
                            ) : (
                                <select
                                    id="booth-select"
                                    className="booth-select"
                                    value={selectedBoothId}
                                    onChange={(e) => {
                                        setSelectedBoothId(e.target.value);
                                        setError('');
                                    }}
                                >
                                    <option value="">-- 부스를 선택하세요 --</option>
                                    {booths.map((booth) => (
                                        <option key={booth.booth_id} value={booth.booth_id}>
                                            {booth.booth_name} ({booth.location_name})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* boothId가 있으면 부스 이름 표시 */}
                    {boothId && (
                        <div className="selected-booth-info">
                            <span className="booth-label">선택된 부스:</span>
                            <span className="booth-name">{qrCode || `부스 #${boothId}`}</span>
                        </div>
                    )}

                    <div className="pin-input-container">
                        <label htmlFor="pin-input">PIN 번호</label>
                        <input
                            id="pin-input"
                            type="text"
                            className="pin-input"
                            placeholder="PIN 입력"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value.toUpperCase());
                                setError('');
                            }}
                            maxLength={10}
                            autoFocus={!!boothId}
                        />
                    </div>

                    {error && (
                        <div className="pin-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="pin-submit-btn"
                        disabled={loading || pin.length < 4 || !selectedBoothId}
                    >
                        {loading ? '확인 중...' : '스탬프 받기'}
                    </button>
                </form>

                <div className="pin-help">
                    <p>💡 부스 담당자에게 PIN 번호를 물어보세요!</p>
                </div>
            </div>
        </div>
    );
};

export default PinFallbackModal;