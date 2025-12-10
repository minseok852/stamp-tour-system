// src/pages/user/QRScan.jsx
// QR코드 스캔 - 1회 스캔 후 중지, GPS 설정 연동
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collectStampByQR, collectStampByPin, getEventSettings } from '../../services/stampApi';
import { isAuthenticated } from '../../services/authApi';
import PinFallbackModal from '../../components/PinFallbackModal';
import '../../styles/QRScan.css';

const QRScan = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [lastScannedData, setLastScannedData] = useState({ boothId: null, qrCode: '' });
    
    // GPS 설정 상태
    const [gpsEnabled, setGpsEnabled] = useState(true);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    
    // ⭐ Ref로 최신 값 유지 + 중복 방지
    const gpsEnabledRef = useRef(true);
    const isProcessingRef = useRef(false);  // 처리 중 플래그
    const scannerRef = useRef(null);  // 스캐너 참조
    const initCalledRef = useRef(false);  // 초기화 중복 방지

    useEffect(() => {
        // 이미 초기화됐으면 스킵
        if (initCalledRef.current) return;
        initCalledRef.current = true;

        // 로그인 확인
        if (!isAuthenticated()) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        // Settings 로드 후 스캐너 초기화
        loadSettingsAndInitScanner();

        return () => {
            // 컴포넌트 언마운트 시 스캐너 정리
            cleanupScanner();
        };
    }, []);

    const cleanupScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    };

    const loadSettingsAndInitScanner = async () => {
        try {
            const settings = await getEventSettings();
            console.log('GPS 설정 로드 완료:', settings);
            
            const isGpsEnabled = settings.gps_enabled ?? settings.gpsEnabled ?? true;
            setGpsEnabled(isGpsEnabled);
            gpsEnabledRef.current = isGpsEnabled;
        } catch (err) {
            console.error('Settings 로드 실패:', err);
            setGpsEnabled(true);
            gpsEnabledRef.current = true;
        } finally {
            setSettingsLoaded(true);
            initQRScanner();
        }
    };

    const initQRScanner = () => {
        // 이미 스캐너가 있으면 스킵
        if (scannerRef.current) return;

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
        scannerRef.current = scanner;
    };

    const onScanSuccess = async (decodedText) => {
        // ⭐ 이미 처리 중이면 무시 (중복 스캔 방지)
        if (isProcessingRef.current) {
            console.log('이미 처리 중 - 스킵');
            return;
        }
        
        // 처리 시작 플래그
        isProcessingRef.current = true;
        setScanning(true);
        setError('');
        setSuccess(null);

        console.log('스캔된 내용:', decodedText);

        // ⭐ 스캐너 즉시 중지 (추가 스캔 방지)
        cleanupScanner();

        try {
            let boothId = null;
            let qrCode = '';

            if (decodedText.includes('stamp/collect')) {
                const url = new URL(decodedText);
                boothId = url.searchParams.get('booth_id');
                qrCode = url.searchParams.get('qr_code') || '';
            } else if (decodedText.match(/^BOOTH_\d+$/)) {
                qrCode = decodedText;
            } else {
                throw new Error('올바른 QR 코드가 아닙니다.');
            }

            if (!qrCode) {
                throw new Error('QR 코드 정보가 없습니다.');
            }

            setLastScannedData({ boothId, qrCode });

            // ref에서 최신 GPS 설정 가져오기
            const currentGpsEnabled = gpsEnabledRef.current;
            console.log('현재 GPS 설정:', currentGpsEnabled);
            
            if (!currentGpsEnabled) {
                // GPS 비활성화 → 바로 스탬프 수집
                console.log('GPS 비활성화 - 바로 스탬프 수집');
                await collectStamp(qrCode, boothId, 0, 0);
                return;
            }

            // GPS 활성화 → 위치 가져오기
            if (!navigator.geolocation) {
                setError('GPS를 지원하지 않는 브라우저입니다.');
                setShowPinFallback(true);
                setScanning(false);
                isProcessingRef.current = false;
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
                    isProcessingRef.current = false;
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
            isProcessingRef.current = false;
        }
    };

    const onScanError = (errorMessage) => {
        // QR 스캔 중 발생하는 일반적인 에러는 무시
    };

    const collectStamp = async (qrCode, boothId, latitude, longitude) => {
        try {
            const result = await collectStampByQR(qrCode, latitude, longitude);
            
            setSuccess(result);
            setError('');
        } catch (err) {
            console.error('스탬프 수집 실패:', err);
            const errorDetail = err.response?.data?.detail || '스탬프 수집에 실패했습니다.';
            
            if (errorDetail.includes('떨어져') || errorDetail.includes('GPS') || errorDetail.includes('위치')) {
                setError(errorDetail);
                setShowPinFallback(true);
            } else if (errorDetail.includes('핀번호') || errorDetail.includes('PIN')) {
                setError('PIN 번호를 입력해주세요.');
                setShowPinFallback(true);
            } else if (errorDetail.includes('이미')) {
                setError(errorDetail);
            } else {
                setError(errorDetail);
                setShowPinFallback(true);
            }
        } finally {
            setScanning(false);
            isProcessingRef.current = false;
        }
    };

    const handlePinFallback = () => {
        setShowPinFallback(true);
    };

    const handlePinSuccess = (result) => {
        setShowPinFallback(false);
        setSuccess(result);
        setError('');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleScanAgain = () => {
        setSuccess(null);
        setError('');
        setScanning(false);
        isProcessingRef.current = false;
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
                            {settingsLoaded && (
                                <p className="gps-status">
                                    {gpsEnabled ? '📍 GPS 검증 활성화' : '🔓 GPS 검증 비활성화'}
                                </p>
                            )}
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
                                <button 
                                    className="retry-btn"
                                    onClick={handleScanAgain}
                                >
                                    다시 스캔하기
                                </button>
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