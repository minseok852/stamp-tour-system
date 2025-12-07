// src/pages/stamp/StampCollect.jsx
// QR 코드 스캔 후 스탬프 수집 페이지
// URL: /stamp/collect?booth_id=1&qr_code=BOOTH_01
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated } from '../../services/authApi';
import { collectStampByQR } from '../../services/stampApi';
import PinFallbackModal from '../../components/PinFallbackModal';
import '../../styles/StampCollect.css';

const StampCollect = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // URL 파라미터
    const boothId = searchParams.get('booth_id');
    const qrCode = searchParams.get('qr_code');
    
    // 상태
    const [status, setStatus] = useState('loading'); // loading, getting_location, collecting, success, error, need_login
    const [message, setMessage] = useState('');
    const [boothName, setBoothName] = useState('');
    const [totalStamps, setTotalStamps] = useState(0);
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [errorDetail, setErrorDetail] = useState('');

    useEffect(() => {
        // 파라미터 확인
        if (!boothId || !qrCode) {
            setStatus('error');
            setMessage('유효하지 않은 QR 코드입니다.');
            return;
        }

        // 로그인 확인
        if (!isAuthenticated()) {
            setStatus('need_login');
            setMessage('로그인이 필요합니다.');
            return;
        }

        // 스탬프 수집 시작
        startStampCollection();
    }, [boothId, qrCode]);

    const startStampCollection = async () => {
        setStatus('getting_location');
        setMessage('GPS 위치를 확인하고 있습니다...');

        // GPS 위치 가져오기
        if (!navigator.geolocation) {
            setStatus('error');
            setMessage('GPS를 지원하지 않는 브라우저입니다.');
            setShowPinFallback(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // 위치 가져오기 성공 → 스탬프 수집
                await collectStamp(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                // 위치 가져오기 실패
                console.error('GPS 오류:', error);
                setStatus('error');
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setMessage('위치 권한이 거부되었습니다.');
                        setErrorDetail('설정에서 위치 권한을 허용해주세요.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setMessage('위치 정보를 사용할 수 없습니다.');
                        setErrorDetail('GPS 신호가 약합니다.');
                        break;
                    case error.TIMEOUT:
                        setMessage('위치 확인 시간이 초과되었습니다.');
                        setErrorDetail('다시 시도하거나 PIN을 입력해주세요.');
                        break;
                    default:
                        setMessage('위치를 확인할 수 없습니다.');
                        setErrorDetail('다시 시도하거나 PIN을 입력해주세요.');
                }
                
                setShowPinFallback(true);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const collectStamp = async (latitude, longitude) => {
        setStatus('collecting');
        setMessage('스탬프를 수집하고 있습니다...');

        try {
            const result = await collectStampByQR(qrCode, latitude, longitude);
            
            // 성공!
            setStatus('success');
            setBoothName(result.booth_name);
            setTotalStamps(result.total_stamps);
            setMessage(result.message || `🎉 스탬프를 획득했습니다!`);
        } catch (error) {
            console.error('스탬프 수집 실패:', error);
            
            const detail = error.response?.data?.detail || error.message || '스탬프 수집에 실패했습니다.';
            
            setStatus('error');
            setMessage(detail);
            
            // GPS 거리 오류 또는 PIN 오류 시 PIN 입력 허용
            if (detail.includes('떨어져') || detail.includes('GPS') || detail.includes('위치')) {
                setShowPinFallback(true);
                setErrorDetail('GPS 위치 확인에 실패했습니다. PIN을 입력하여 스탬프를 받을 수 있습니다.');
            } else if (detail.includes('이미')) {
                // 이미 획득한 스탬프
                setErrorDetail('');
            } else {
                setShowPinFallback(true);
                setErrorDetail('PIN을 입력하여 스탬프를 받을 수 있습니다.');
            }
        }
    };

    const handlePinSuccess = (result) => {
        setShowPinFallback(false);
        setStatus('success');
        setBoothName(result.booth_name);
        setTotalStamps(result.total_stamps);
        setMessage(result.message || `🎉 스탬프를 획득했습니다!`);
    };

    const handleRetry = () => {
        startStampCollection();
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleLogin = () => {
        // 로그인 후 다시 돌아올 수 있도록 현재 URL 저장
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        navigate('/login');
    };

    return (
        <div className="stamp-collect-page">
            <div className="stamp-collect-container">
                {/* 로딩 상태 */}
                {(status === 'loading' || status === 'getting_location' || status === 'collecting') && (
                    <div className="stamp-status loading">
                        <div className="stamp-spinner"></div>
                        <h2>{status === 'getting_location' ? '📍 위치 확인 중...' : '🎫 스탬프 수집 중...'}</h2>
                        <p>{message}</p>
                    </div>
                )}

                {/* 로그인 필요 */}
                {status === 'need_login' && (
                    <div className="stamp-status need-login">
                        <div className="stamp-icon">🔐</div>
                        <h2>로그인이 필요합니다</h2>
                        <p>스탬프를 받으려면 먼저 로그인해주세요.</p>
                        <div className="stamp-actions">
                            <button className="primary-btn" onClick={handleLogin}>
                                로그인하기
                            </button>
                            <button className="secondary-btn" onClick={handleGoHome}>
                                홈으로
                            </button>
                        </div>
                    </div>
                )}

                {/* 성공 */}
                {status === 'success' && (
                    <div className="stamp-status success">
                        <div className="stamp-icon success-icon">🎉</div>
                        <h2>스탬프 획득!</h2>
                        <div className="booth-info">
                            <span className="booth-name">{boothName}</span>
                        </div>
                        <p className="total-stamps">
                            현재 총 <strong>{totalStamps}</strong>개의 스탬프를 모았습니다!
                        </p>
                        <div className="stamp-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${Math.min((totalStamps / 15) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">{totalStamps} / 15</span>
                        </div>
                        {totalStamps >= 15 && (
                            <div className="completion-badge">
                                🏆 완주를 축하합니다!
                            </div>
                        )}
                        <div className="stamp-actions">
                            <button className="primary-btn" onClick={handleGoHome}>
                                홈으로
                            </button>
                        </div>
                    </div>
                )}

                {/* 에러 */}
                {status === 'error' && (
                    <div className="stamp-status error">
                        <div className="stamp-icon error-icon">😢</div>
                        <h2>스탬프 수집 실패</h2>
                        <p className="error-message">{message}</p>
                        {errorDetail && <p className="error-detail">{errorDetail}</p>}
                        <div className="stamp-actions">
                            {showPinFallback && (
                                <button className="primary-btn" onClick={() => setShowPinFallback(true)}>
                                    🔢 PIN 입력하기
                                </button>
                            )}
                            <button className="secondary-btn" onClick={handleRetry}>
                                🔄 다시 시도
                            </button>
                            <button className="secondary-btn" onClick={handleGoHome}>
                                홈으로
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* PIN 입력 모달 */}
            {showPinFallback && status === 'error' && (
                <PinFallbackModal
                    boothId={boothId}
                    qrCode={qrCode}
                    onClose={() => setShowPinFallback(false)}
                    onSuccess={handlePinSuccess}
                />
            )}
        </div>
    );
};

export default StampCollect;