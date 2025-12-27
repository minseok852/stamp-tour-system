// src/pages/user/QRScan.jsx
// QR코드 스캔 - 성능 최적화 버전
// ⭐ 최적화 내용:
// 1. useCallback - 핸들러 함수 메모이제이션
// 2. 설정 캐싱 - localStorage에 5분간 캐싱
// 3. GPS 캐싱 - watchPosition으로 미리 위치 추적
// 4. 스캐너 lazy 로딩 - 동적 import로 번들 분리

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectStampByQR, getEventSettings } from '../../services/stampApi';
import { isAuthenticated } from '../../services/authApi';
import PinFallbackModal from '../../components/PinFallbackModal';
import '../../styles/QRScan.css';

// ⭐ 설정 캐싱 관련 상수
const SETTINGS_CACHE_KEY = 'qr_event_settings';
const SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5분

// ⭐ 설정 캐싱 함수들
const getCachedSettings = () => {
    try {
        const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > SETTINGS_CACHE_DURATION;
        
        if (isExpired) {
            localStorage.removeItem(SETTINGS_CACHE_KEY);
            return null;
        }
        
        return data;
    } catch {
        return null;
    }
};

const setCachedSettings = (data) => {
    try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch {
        // localStorage 실패 시 무시
    }
};

const QRScan = () => {
    const navigate = useNavigate();
    
    // ===== 상태 관리 =====
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(true);
    
    // GPS 설정 상태
    const [gpsEnabled, setGpsEnabled] = useState(true);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    
    // ===== Refs =====
    // ⭐ lastScannedData를 ref로 변경 (리렌더링 방지)
    const lastScannedDataRef = useRef({ boothId: null, qrCode: '' });
    const gpsEnabledRef = useRef(true);
    const isProcessingRef = useRef(false);
    const scannerRef = useRef(null);
    const initCalledRef = useRef(false);
    
    // ⭐ GPS 캐싱용 ref
    const currentLocationRef = useRef({ lat: null, lng: null, timestamp: 0 });
    const gpsWatchIdRef = useRef(null);

    // ===== ⭐ GPS 위치 추적 시작 (페이지 진입 시) =====
    useEffect(() => {
        if (!navigator.geolocation) return;
        
        // watchPosition으로 계속 위치 추적
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                currentLocationRef.current = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: Date.now()
                };
                console.log('GPS 위치 업데이트:', currentLocationRef.current);
            },
            (err) => {
                console.log('GPS 추적 오류 (무시됨):', err.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,  // 10초 이내 캐시 허용
                timeout: 15000
            }
        );
        
        gpsWatchIdRef.current = watchId;
        
        // 클린업: 컴포넌트 언마운트 시 추적 중지
        return () => {
            if (gpsWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(gpsWatchIdRef.current);
                gpsWatchIdRef.current = null;
            }
        };
    }, []);

    // ===== 스캐너 정리 함수 =====
    const cleanupScanner = useCallback(() => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    }, []);

    // ===== ⭐ 설정 로드 (캐싱 적용) =====
    const loadSettings = useCallback(async () => {
        // 1. 캐시 확인
        const cached = getCachedSettings();
        if (cached) {
            console.log('캐시된 설정 사용:', cached);
            const isGpsEnabled = cached.gps_enabled ?? cached.gpsEnabled ?? true;
            setGpsEnabled(isGpsEnabled);
            gpsEnabledRef.current = isGpsEnabled;
            setSettingsLoaded(true);
            return;
        }
        
        // 2. API 호출
        try {
            const settings = await getEventSettings();
            console.log('설정 로드 완료:', settings);
            
            // 캐시 저장
            setCachedSettings(settings);
            
            const isGpsEnabled = settings.gps_enabled ?? settings.gpsEnabled ?? true;
            setGpsEnabled(isGpsEnabled);
            gpsEnabledRef.current = isGpsEnabled;
        } catch (err) {
            console.error('설정 로드 실패:', err);
            setGpsEnabled(true);
            gpsEnabledRef.current = true;
        } finally {
            setSettingsLoaded(true);
        }
    }, []);

    // ===== ⭐ 스캐너 초기화 (동적 import + DOM 확인) =====
    const initQRScanner = useCallback(async () => {
        if (scannerRef.current) return;
        
        try {
            setScannerLoading(true);
            
            // ⭐ 동적 import - 필요할 때만 라이브러리 로드
            const { Html5QrcodeScanner } = await import('html5-qrcode');
            
            // ⭐ DOM이 준비될 때까지 대기
            const waitForElement = () => {
                return new Promise((resolve) => {
                    const checkElement = () => {
                        const element = document.getElementById('qr-reader');
                        if (element) {
                            resolve(element);
                        } else {
                            requestAnimationFrame(checkElement);
                        }
                    };
                    checkElement();
                });
            };
            
            await waitForElement();
            
            // 이미 스캐너가 있으면 스킵 (중복 방지)
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
            
        } catch (error) {
            console.error('QR 스캐너 초기화 실패:', error);
            setError('QR 스캐너를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
        } finally {
            setScannerLoading(false);
        }
    }, []);

    // ===== ⭐ 스탬프 수집 API 호출 (useCallback) =====
    const collectStamp = useCallback(async (qrCode, boothId, latitude, longitude) => {
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
    }, []);

    // ===== ⭐ 스캔 성공 핸들러 (GPS 캐싱 활용) =====
    const onScanSuccess = useCallback(async (decodedText) => {
        // 중복 스캔 방지
        if (isProcessingRef.current) {
            console.log('이미 처리 중 - 스킵');
            return;
        }
        
        isProcessingRef.current = true;
        setScanning(true);
        setError('');
        setSuccess(null);

        console.log('스캔된 내용:', decodedText);

        // 스캐너 즉시 중지
        cleanupScanner();

        try {
            let boothId = null;
            let qrCode = '';

            // QR 코드 파싱
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

            // ⭐ ref 사용 (리렌더링 방지)
            lastScannedDataRef.current = { boothId, qrCode };

            const currentGpsEnabled = gpsEnabledRef.current;
            console.log('현재 GPS 설정:', currentGpsEnabled);
            
            // GPS 비활성화 → 바로 스탬프 수집
            if (!currentGpsEnabled) {
                console.log('GPS 비활성화 - 바로 스탬프 수집');
                await collectStamp(qrCode, boothId, 0, 0);
                return;
            }

            // GPS 미지원 브라우저
            if (!navigator.geolocation) {
                setError('GPS를 지원하지 않는 브라우저입니다.');
                setShowPinFallback(true);
                setScanning(false);
                isProcessingRef.current = false;
                return;
            }

            // ⭐ GPS 캐싱 활용 - 미리 추적한 위치 사용
            const cachedLocation = currentLocationRef.current;
            const locationAge = Date.now() - cachedLocation.timestamp;
            const isLocationFresh = cachedLocation.lat && cachedLocation.lng && locationAge < 30000; // 30초 이내
            
            if (isLocationFresh) {
                // 캐시된 위치 사용 (즉시 처리!)
                console.log('캐시된 GPS 위치 사용:', cachedLocation);
                await collectStamp(qrCode, boothId, cachedLocation.lat, cachedLocation.lng);
                return;
            }

            // 캐시 없으면 새로 요청
            console.log('GPS 위치 새로 요청 중...');
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
                    maximumAge: 30000  // 30초 캐시 허용
                }
            );
        } catch (err) {
            console.error('QR 파싱 오류:', err);
            setError(err.message || '올바른 QR 코드가 아닙니다.');
            setScanning(false);
            isProcessingRef.current = false;
        }
    }, [cleanupScanner, collectStamp]);

    // ===== 스캔 에러 (무시) =====
    const onScanError = useCallback((errorMessage) => {
        // QR 스캔 중 발생하는 일반적인 에러는 무시
    }, []);

    // ===== 메인 useEffect =====
    useEffect(() => {
        if (initCalledRef.current) return;
        initCalledRef.current = true;

        // 로그인 확인
        if (!isAuthenticated()) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        // 설정 로드 후 스캐너 초기화
        const initialize = async () => {
            await loadSettings();
            await initQRScanner();
        };
        
        initialize();

        // 클린업
        return () => {
            cleanupScanner();
        };
    }, [navigate, loadSettings, initQRScanner, cleanupScanner]);

    // ===== ⭐ 핸들러 함수들 (useCallback) =====
    const handlePinFallback = useCallback(() => {
        setShowPinFallback(true);
    }, []);

    const handlePinSuccess = useCallback((result) => {
        setShowPinFallback(false);
        setSuccess(result);
        setError('');
    }, []);

    const handleClosePinModal = useCallback(() => {
        setShowPinFallback(false);
    }, []);

    const handleGoHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleScanAgain = useCallback(async () => {
        setSuccess(null);
        setError('');
        setScanning(false);
        isProcessingRef.current = false;
        await initQRScanner();
    }, [initQRScanner]);

    const handleGoBack = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // ===== ⭐ 진행률 스타일 메모이제이션 =====
    const progressWidth = useMemo(() => {
        if (!success) return '0%';
        return `${Math.min((success.total_stamps / 15) * 100, 100)}%`;
    }, [success]);

    // ===== 렌더링 =====
    return (
        <div className="qr-scan-page">
            <div className="qr-scan-header">
                <button className="back-button" onClick={handleGoBack}>
                    ← 뒤로
                </button>
                <h1>QR 코드 스캔</h1>
            </div>

            <div className="qr-scan-container">
                {success ? (
                    // ===== 성공 화면 =====
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
                                    style={{ width: progressWidth }}
                                />
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
                    // ===== 스캔 화면 =====
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

                        {/* ⭐ qr-reader는 항상 렌더링 (스캐너가 찾을 수 있도록) */}
                        <div 
                            id="qr-reader" 
                            className="qr-reader"
                            style={{ display: scannerLoading ? 'none' : 'block' }}
                        ></div>
                        
                        {/* 로딩 중일 때 표시 */}
                        {scannerLoading && (
                            <div className="scanner-loading">
                                <div className="scanning-spinner"></div>
                                <p>카메라 준비 중...</p>
                            </div>
                        )}

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

            {/* PIN 입력 모달 */}
            {showPinFallback && (
                <PinFallbackModal
                    boothId={lastScannedDataRef.current.boothId}
                    qrCode={lastScannedDataRef.current.qrCode}
                    onClose={handleClosePinModal}
                    onSuccess={handlePinSuccess}
                />
            )}
        </div>
    );
};

export default QRScan;