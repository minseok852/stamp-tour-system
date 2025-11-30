//QR코드 스캔 및 위치 인증 화면
// QRScan.jsx - Universal QR 스캔 페이지
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanStamp } from '../../services/stampApi';
import { isAuthenticated } from '../../services/authApi';
import PinFallbackModal from '../../components/PinFallbackModal';
import '../../styles/Qrscan.css';

const QRScan = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [lastScannedQR, setLastScannedQR] = useState('');

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
                window.html5QrcodeScanner.clear();
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

    const onScanSuccess = (decodedText) => {
        // QR 코드 스캔 성공
        setScanning(true);
        setError('');
        setLastScannedQR(decodedText);

        // QR 코드 형식 확인 (BOOTH_01, BOOTH_02, ...)
        const qrPattern = /^BOOTH_\d{2}$/;
        if (!qrPattern.test(decodedText)) {
            setError('올바른 QR 코드가 아닙니다.');
            setScanning(false);
            return;
        }

        // GPS 위치 가져오기
        if (!navigator.geolocation) {
            setError('GPS를 지원하지 않는 브라우저입니다.');
            setScanning(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // 스탬프 수집 시도 (PIN은 QR에서 자동 추출 가정)
                // 실제로는 QR 코드에 PIN이 포함되어 있거나,
                // 백엔드에서 QR 코드만으로 검증할 수 있어야 함
                collectStamp(
                    decodedText,
                    '1234', // 임시 PIN (실제로는 QR에서 추출)
                    position.coords.latitude,
                    position.coords.longitude
                );
            },
            (err) => {
                setError('GPS 위치를 가져올 수 없습니다. 위치 권한을 허용해주세요.');
                setScanning(false);
            }
        );
    };

    const onScanError = (errorMessage) => {
        // QR 스캔 중 발생하는 일반적인 에러는 무시
        // (카메라가 QR을 찾는 중)
    };

    const collectStamp = async (qrCode, pin, latitude, longitude) => {
        try {
            const result = await scanStamp(qrCode, pin, latitude, longitude);
            
            // 성공!
            alert(`🎉 ${result.message}`);
            
            // 홈으로 이동
            navigate('/');
        } catch (err) {
            const errorDetail = err.response?.data?.detail || '스탬프 수집에 실패했습니다.';
            
            // 에러 메시지에 따라 처리
            if (errorDetail.includes('핀번호')) {
                // PIN 오류 → PIN 입력 모달 표시
                setShowPinFallback(true);
            } else {
                setError(errorDetail);
            }
        } finally {
            setScanning(false);
        }
    };

    const handlePinFallback = () => {
        setShowPinFallback(true);
    };

    const handlePinSuccess = () => {
        setShowPinFallback(false);
        navigate('/');
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
                        <li>부스로부터 5m 이내에 있어야 합니다</li>
                    </ul>
                </div>
            </div>

            {/* PIN 입력 모달 */}
            {showPinFallback && (
                <PinFallbackModal
                    lastQrCode={lastScannedQR}
                    onClose={() => setShowPinFallback(false)}
                    onSuccess={handlePinSuccess}
                />
            )}
        </div>
    );
};

export default QRScan;