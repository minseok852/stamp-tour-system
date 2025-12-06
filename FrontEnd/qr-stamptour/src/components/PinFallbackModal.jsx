// src/components/PinFallbackModal.jsx
// GPS 오류 시 PIN 입력 모달
import React, { useState } from 'react';
import { collectStampByPin } from '../services/stampApi';
import '../styles/PinFallbackModal.css';


const PinFallbackModal = ({ boothId, qrCode, onClose, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (pin.length < 4) {
            setError('PIN은 최소 4자리 이상입니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await collectStampByPin(boothId, pin);
            onSuccess(result);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || 'PIN이 올바르지 않습니다.';
            setError(errorDetail);
        } finally {
            setLoading(false);
        }
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
                    <div className="pin-input-container">
                        <input
                            type="text"
                            className="pin-input"
                            placeholder="PIN 입력"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value.toUpperCase());
                                setError('');
                            }}
                            maxLength={10}
                            autoFocus
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
                        disabled={loading || pin.length < 4}
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