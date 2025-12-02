// PinFallbackModal.jsx - PIN 입력 모달 (QR 실패 시)
//src/components/PinFallbackModal.jsx
import React, { useState, useEffect } from 'react';
import { scanStamp } from '../services/stampApi';
import { getAllBooths } from '../services/boothApi';
import '../styles/PinFallbackModal.css';

const PinFallbackModal = ({ lastQrCode, onClose, onSuccess }) => {
    const [booths, setBooths] = useState([]);
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadBooths();
    }, []);

    const loadBooths = async () => {
        try {
            const boothsData = await getAllBooths();
            setBooths(boothsData);
        } catch (err) {
            setError('부스 목록을 불러올 수 없습니다.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBooth) {
            setError('부스를 선택해주세요.');
            return;
        }

        if (pin.length !== 4) {
            setError('PIN 번호는 4자리입니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // GPS 위치 가져오기
            if (!navigator.geolocation) {
                throw new Error('GPS를 지원하지 않는 브라우저입니다.');
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // QR 코드 생성 (BOOTH_01 형식)
                        const qrCode = `BOOTH_${String(selectedBooth.booth_id).padStart(2, '0')}`;

                        const result = await scanStamp(
                            qrCode,
                            pin,
                            position.coords.latitude,
                            position.coords.longitude
                        );

                        alert(`🎉 ${result.message}`);
                        onSuccess();
                    } catch (err) {
                        setError(err.response?.data?.detail || '스탬프 수집에 실패했습니다.');
                    } finally {
                        setLoading(false);
                    }
                },
                (err) => {
                    setError('GPS 위치를 가져올 수 없습니다.');
                    setLoading(false);
                }
            );
        } catch (err) {
            setError(err.message || '오류가 발생했습니다.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pin-fallback" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔢 PIN 번호로 수집</h2>
                    <p>QR 인식이 안 될 때 사용하세요</p>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>현재 위치한 부스</label>
                            <select
                                value={selectedBooth?.booth_id || ''}
                                onChange={(e) => {
                                    const booth = booths.find(b => b.booth_id === parseInt(e.target.value));
                                    setSelectedBooth(booth);
                                }}
                                disabled={loading}
                                required
                            >
                                <option value="">부스를 선택하세요</option>
                                {booths.map(booth => (
                                    <option key={booth.booth_id} value={booth.booth_id}>
                                        {booth.icon} {booth.booth_name} - {booth.location_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>PIN 번호 (관리자에게 문의)</label>
                            <input
                                type="text"
                                className="pin-input"
                                placeholder="4자리"
                                maxLength="4"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                disabled={loading}
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="button-group">
                            <button 
                                type="button" 
                                className="btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={loading || !selectedBooth || pin.length !== 4}
                            >
                                {loading ? '수집 중...' : '수집하기'}
                            </button>
                        </div>
                    </form>

                    <div className="help-text">
                        💡 PIN 번호는 각 부스의 관리자가 알려드립니다<br/>
                        📍 부스로부터 5m 이내에 있어야 합니다
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinFallbackModal;