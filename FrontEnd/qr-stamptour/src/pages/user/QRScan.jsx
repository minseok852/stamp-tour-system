// src/pages/user/QRScan.jsx
// QR코드 스캔 및 위치 인증 화면 - 수정 버전
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collectStampByQR, collectStampByPin } from '../../services/stampApi';
import { isAuthenticated } from '../../services/authApi';
import PinFallbackModal from '../../components/PinFallbackModal';
import '../../styles/Qrscan.css';

const QRScan = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [lastScannedData, setLastScannedData] = useState({ boothId: null, qrCode: '' });

    useEffect(() => {
        // 로그인 확인
        if (!isAuthenticated()) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        // QR 스캔 초기화
        initQRScanner();

        return () => {
            // 컴포넌트 언마운트 시 스캐너 정리
            if (window.html5QrcodeScanner) {
                window.html5QrcodeScanner.clear().catch(console.error);
            }
        };
    }, [navigate]);

    const initQRScanner = () => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { 
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scanner.render(onScanSuccess, onScanError);
        window.html5QrcodeScanner = scanner;
    };

    const onScanSuccess = async (decodedText) => {
        // 이미 처리 중이면 무시
        if (scanning) return;
        
        setScanning(true);
        setError('');
        setSuccess(null);

        console.log('스캔된 내용:', decodedText);

        // ⭐ URL 형식인지 확인
        // 예: https://domain.com/stamp/collect?booth_id=1&qr_code=BOOTH_01
        try {
            let boothId = null;
            let qrCode = '';

            if (decodedText.includes('stamp/collect')) {
                // URL 형식 QR 코드
                const url = new URL(decodedText);
                boothId = url.searchParams.get('booth_id');
                qrCode = url.searchParams.get('qr_code') || '';
            } else if (decodedText.match(/^BOOTH_\d+$/)) {
                // 기존 형식: BOOTH_01
                qrCode = decodedText;
            } else {
                throw new Error('올바른 QR 코드가 아닙니다.');
            }

            if (!qrCode) {
                throw new Error('QR 코드 정보가 없습니다.');
            }

            setLastScannedData({ boothId, qrCode });

            // GPS 위치 가져오기
            if (!navigator.geolocation) {
                setError('GPS를 지원하지 않는 브라우저입니다.');
                setShowPinFallback(true);
                setScanning(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await collectStamp(
                        qrCode,
                        boothId,
                        position.coords.latitude,
                        position.coords.longitude
                    );
                },
                (err) => {
                    console.error('GPS 오류:', err);
                    setError('GPS 위치를 가져올 수 없습니다. PIN을 입력해주세요.');
                    setShowPinFallback(true);
                    setScanning(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } catch (err) {
            console.error('QR 파싱 오류:', err);
            setError(err.message || '올바른 QR 코드가 아닙니다.');
            setScanning(false);
        }
    };

    const onScanError = (errorMessage) => {
        // QR 스캔 중 발생하는 일반적인 에러는 무시
        // (카메라가 QR을 찾는 중)
    };

    const collectStamp = async (qrCode, boothId, latitude, longitude) => {
        try {
            const result = await collectStampByQR(qrCode, latitude, longitude);
            
            // 성공!
            setSuccess(result);
            setError('');
            
            // 스캐너 중지
            if (window.html5QrcodeScanner) {
                await window.html5QrcodeScanner.clear().catch(console.error);
            }
        } catch (err) {
            console.error('스탬프 수집 실패:', err);
            const errorDetail = err.response?.data?.detail || '스탬프 수집에 실패했습니다.';
            
            // 에러 메시지에 따라 처리
            if (errorDetail.includes('떨어져') || errorDetail.includes('GPS') || errorDetail.includes('위치')) {
                // GPS 거리 오류 → PIN 입력 모달 표시
                setError(errorDetail);
                setShowPinFallback(true);
            } else if (errorDetail.includes('핀번호') || errorDetail.includes('PIN')) {
                // PIN 오류 → PIN 입력 모달 표시
                setError('PIN 번호를 입력해주세요.');
                setShowPinFallback(true);
            } else if (errorDetail.includes('이미')) {
                // 이미 획득한 스탬프
                setError(errorDetail);
            } else {
                setError(errorDetail);
                setShowPinFallback(true);
            }
        } finally {
            setScanning(false);
        }
    };

    const handlePinFallback = () => {
        setShowPinFallback(true);
    };

    const handlePinSuccess = (result) => {
        setShowPinFallback(false);
        setSuccess(result);
        setError('');
        
        // 스캐너 중지
        if (window.html5QrcodeScanner) {
            window.html5QrcodeScanner.clear().catch(console.error);
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleScanAgain = () => {
        setSuccess(null);
        setError('');
        setScanning(false);
        initQRScanner();
    };

    return (
        <div className="qr-scan-page">
            <div className="qr-scan-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 뒤로
                </button>
                <h1>QR 코드 스캔</h1>
            </div>

            <div className="qr-scan-container">
                {/* 성공 화면 */}
                {success ? (
                    <div className="scan-success">
                        <div className="success-icon">🎉</div>
                        <h2>스탬프 획득!</h2>
                        <div className="success-booth">{success.booth_name}</div>
                        <p className="success-total">
                            현재 총 <strong>{success.total_stamps}</strong>개의 스탬프!
                        </p>
                        <div className="success-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${Math.min((success.total_stamps / 15) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <span>{success.total_stamps} / 15</span>
                        </div>
                        {success.total_stamps >= 15 && (
                            <div className="completion-badge">🏆 완주 축하합니다!</div>
                        )}
                        <div className="success-actions">
                            <button className="primary-btn" onClick={handleGoHome}>
                                홈으로
                            </button>
                            <button className="secondary-btn" onClick={handleScanAgain}>
                                다른 QR 스캔
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="scan-info">
                            <p>부스의 QR 코드를 스캔하세요</p>
                            <p className="scan-hint">📱 QR 코드를 카메라 중앙에 맞춰주세요</p>
                        </div>

                        <div id="qr-reader" className="qr-reader"></div>

                        {scanning && (
                            <div className="scanning-overlay">
                                <div className="scanning-spinner"></div>
                                <p>스탬프 수집 중...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-box">
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="scan-help">
                            <button 
                                className="pin-fallback-button"
                                onClick={handlePinFallback}
                            >
                                🔢 QR 인식이 안 되나요? PIN 입력하기
                            </button>
                        </div>

                        <div className="scan-tips">
                            <h3>💡 스캔 팁</h3>
                            <ul>
                                <li>밝은 곳에서 스캔하세요</li>
                                <li>QR 코드와 10-30cm 거리 유지</li>
                                <li>흔들리지 않게 고정하세요</li>
                                <li>부스 근처에서 스캔해주세요</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>

            {/* PIN 입력 모달 */}
            {showPinFallback && (
                <PinFallbackModal
                    boothId={lastScannedData.boothId}
                    qrCode={lastScannedData.qrCode}
                    onClose={() => setShowPinFallback(false)}
                    onSuccess={handlePinSuccess}
                />
            )}
        </div>
    );
};

export default QRScan;