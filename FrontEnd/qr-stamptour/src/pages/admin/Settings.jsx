// src/pages/admin/Settings.jsx
// 이벤트 설정 페이지 - 백엔드 연동 버전
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/authApi';
import { getSettings, updateSettings, getBoothPins, updateBoothPin } from '../../services/adminApi';
import '../../styles/Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    
    // 이벤트 설정
    const [eventSettings, setEventSettings] = useState({
        event_name: '',
        start_date: '',
        end_date: '',
        start_time: '09:00',
        end_time: '18:00',
        required_stamps: 15,
        total_booths: 15,
        is_active: true
    });

    // GPS 설정
    const [gpsSettings, setGpsSettings] = useState({
        gps_enabled: true,
        gps_max_distance: 100,
        gps_bypass_allowed: true
    });

    // 부스 PIN
    const [boothPins, setBoothPins] = useState([]);
    const [editingPin, setEditingPin] = useState(null);
    const [newPin, setNewPin] = useState('');
    
    // 로딩 및 상태
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // 인증 체크
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');
        
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'admin') {
                    alert('관리자 권한이 필요합니다.');
                    navigate('/');
                    return;
                }
            } catch (e) {
                console.error('사용자 정보 파싱 실패:', e);
            }
        }

        try {
            await getCurrentUser();
            setAuthChecked(true);
            fetchData();
        } catch (error) {
            console.error('토큰 검증 실패:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            navigate('/login');
        }
    };

    // 401 에러 처리
    const handleAuthError = (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            navigate('/login');
            return true;
        }
        return false;
    };

    // 데이터 로드
    const fetchData = async () => {
        setLoading(true);
        try {
            // 설정 조회
            const settings = await getSettings();
            setEventSettings({
                event_name: settings.event_name || '',
                start_date: settings.start_date || '',
                end_date: settings.end_date || '',
                start_time: settings.start_time || '09:00',
                end_time: settings.end_time || '18:00',
                required_stamps: settings.required_stamps || 15,
                total_booths: settings.total_booths || 15,
                is_active: settings.is_active ?? true
            });
            setGpsSettings({
                gps_enabled: settings.gps_enabled ?? true,
                gps_max_distance: settings.gps_max_distance || 100,
                gps_bypass_allowed: settings.gps_bypass_allowed ?? true
            });

            // 부스 PIN 조회
            const pins = await getBoothPins();
            setBoothPins(pins);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('설정 로드 실패:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // 설정 변경 핸들러
    const handleEventChange = (field, value) => {
        setEventSettings(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleGpsChange = (field, value) => {
        setGpsSettings(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    // 스탬프 개수 조절
    const adjustStamps = (delta) => {
        const newValue = Math.max(1, Math.min(eventSettings.total_booths, eventSettings.required_stamps + delta));
        handleEventChange('required_stamps', newValue);
    };

    // 설정 저장
    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const settingsToSave = {
                ...eventSettings,
                ...gpsSettings
            };
            
            await updateSettings(settingsToSave);
            alert('설정이 저장되었습니다.');
            setHasChanges(false);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('설정 저장 실패:', error);
                alert(error?.detail || '설정 저장에 실패했습니다.');
            }
        } finally {
            setSaving(false);
        }
    };

    // PIN 수정 시작
    const startEditPin = (booth) => {
        setEditingPin(booth.booth_id);
        setNewPin(booth.qr_pin || '');
    };

    // PIN 저장
    const savePin = async (boothId) => {
        if (newPin.length < 4) {
            alert('PIN은 최소 4자리 이상이어야 합니다.');
            return;
        }

        try {
            await updateBoothPin(boothId, newPin);
            
            // 로컬 상태 업데이트
            setBoothPins(prev => prev.map(b => 
                b.booth_id === boothId ? { ...b, qr_pin: newPin } : b
            ));
            
            setEditingPin(null);
            setNewPin('');
            alert('PIN이 수정되었습니다.');
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('PIN 수정 실패:', error);
                alert(error?.detail || 'PIN 수정에 실패했습니다.');
            }
        }
    };

    // 로그아웃
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // 인증 체크 전
    if (!authChecked) {
        return (
            <div className="settings-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>인증 확인 중...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="settings-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>설정 로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            {/* 상단 네비게이션 */}
            <nav className="admin-nav">
                <div className="admin-nav-left">
                    <div className="admin-logo">
                        <span className="admin-logo-icon">🎓</span>
                        <span className="admin-logo-text">대진대 스탬프 투어 관리자</span>
                    </div>
                </div>
                <div className="admin-nav-menu">
                    <div className="admin-nav-item" onClick={() => navigate('/admin/dashboard')}>
                        📊 대시보드
                    </div>
                    <div className="admin-nav-item" onClick={() => navigate('/admin/qr-manage')}>
                        📱 QR 관리
                    </div>
                    <div className="admin-nav-item" onClick={() => navigate('/admin/users')}>
                        👥 사용자 관리
                    </div>
                    <div className="admin-nav-item active">
                        ⚙️ 설정
                    </div>
                    <div className="admin-nav-item" onClick={() => navigate('/admin/export')}>
                        📥 데이터
                    </div>
                </div>
                <div className="admin-nav-right">
                    <button className="admin-nav-btn home" onClick={() => navigate('/')}>
                        🏠 홈으로
                    </button>
                    <button className="admin-nav-btn logout" onClick={handleLogout}>
                        🚪 로그아웃
                    </button>
                </div>
            </nav>

            {/* 메인 컨텐츠 */}
            <div className="settings-content">
                {/* 페이지 헤더 */}
                <div className="page-header">
                    <div className="header-left">
                        <h1 className="page-title">⚙️ 이벤트 설정</h1>
                        <p className="page-subtitle">스탬프 투어 이벤트 설정을 관리합니다</p>
                    </div>
                    <button 
                        className={`save-btn ${hasChanges ? 'active' : ''}`}
                        onClick={handleSaveSettings}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? '저장 중...' : '💾 설정 저장'}
                    </button>
                </div>

                <div className="settings-grid">
                    {/* 이벤트 기본 정보 */}
                    <div className="settings-card">
                        <div className="card-header">
                            <h2 className="card-title">📅 이벤트 기본 정보</h2>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">이벤트명</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={eventSettings.event_name}
                                    onChange={(e) => handleEventChange('event_name', e.target.value)}
                                    placeholder="예: 2025 대진대 스탬프 투어"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">시작일</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={eventSettings.start_date}
                                        onChange={(e) => handleEventChange('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">종료일</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={eventSettings.end_date}
                                        onChange={(e) => handleEventChange('end_date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">운영 시작 시간</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={eventSettings.start_time}
                                        onChange={(e) => handleEventChange('start_time', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">운영 종료 시간</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={eventSettings.end_time}
                                        onChange={(e) => handleEventChange('end_time', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">완주 필요 스탬프 개수</label>
                                <div className="stamp-counter">
                                    <button 
                                        className="counter-btn"
                                        onClick={() => adjustStamps(-1)}
                                        disabled={eventSettings.required_stamps <= 1}
                                    >
                                        −
                                    </button>
                                    <span className="counter-value">
                                        {eventSettings.required_stamps} / {eventSettings.total_booths}
                                    </span>
                                    <button 
                                        className="counter-btn"
                                        onClick={() => adjustStamps(1)}
                                        disabled={eventSettings.required_stamps >= eventSettings.total_booths}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">이벤트 상태</label>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        id="eventActive"
                                        checked={eventSettings.is_active}
                                        onChange={(e) => handleEventChange('is_active', e.target.checked)}
                                    />
                                    <label htmlFor="eventActive" className="toggle-label">
                                        <span className="toggle-inner"></span>
                                        <span className="toggle-switch-btn"></span>
                                    </label>
                                    <span className={`toggle-text ${eventSettings.is_active ? 'active' : ''}`}>
                                        {eventSettings.is_active ? '진행중' : '종료'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GPS 검증 설정 */}
                    <div className="settings-card">
                        <div className="card-header">
                            <h2 className="card-title">📍 GPS 검증 설정</h2>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">GPS 검증 사용</label>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        id="gpsEnabled"
                                        checked={gpsSettings.gps_enabled}
                                        onChange={(e) => handleGpsChange('gps_enabled', e.target.checked)}
                                    />
                                    <label htmlFor="gpsEnabled" className="toggle-label">
                                        <span className="toggle-inner"></span>
                                        <span className="toggle-switch-btn"></span>
                                    </label>
                                    <span className={`toggle-text ${gpsSettings.gps_enabled ? 'active' : ''}`}>
                                        {gpsSettings.gps_enabled ? '사용' : '미사용'}
                                    </span>
                                </div>
                            </div>

                            {gpsSettings.gps_enabled && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">
                                            허용 거리: <strong>{gpsSettings.gps_max_distance}m</strong>
                                        </label>
                                        <input
                                            type="range"
                                            className="form-range"
                                            min="50"
                                            max="2000"
                                            step="10"
                                            value={gpsSettings.gps_max_distance}
                                            onChange={(e) => handleGpsChange('gps_max_distance', parseInt(e.target.value))}
                                        />
                                        <div className="range-labels">
                                            <span>50m</span>
                                            <span>2000m</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">GPS 오류 시 PIN 입력 허용</label>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                id="gpsBypass"
                                                checked={gpsSettings.gps_bypass_allowed}
                                                onChange={(e) => handleGpsChange('gps_bypass_allowed', e.target.checked)}
                                            />
                                            <label htmlFor="gpsBypass" className="toggle-label">
                                                <span className="toggle-inner"></span>
                                                <span className="toggle-switch-btn"></span>
                                            </label>
                                            <span className={`toggle-text ${gpsSettings.gps_bypass_allowed ? 'active' : ''}`}>
                                                {gpsSettings.gps_bypass_allowed ? '허용' : '미허용'}
                                            </span>
                                        </div>
                                        <p className="form-hint">
                                            GPS 신호가 약할 때 부스별 PIN 번호로 대체 인증할 수 있습니다.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 부스 PIN 관리 */}
                <div className="settings-card full-width">
                    <div className="card-header">
                        <h2 className="card-title">🔐 부스 PIN 관리</h2>
                        <p className="card-subtitle">QR 스캔 오류 시 사용되는 부스별 PIN 번호</p>
                    </div>
                    <div className="card-body">
                        <div className="pin-grid">
                            {boothPins.map(booth => (
                                <div key={booth.booth_id} className="pin-item">
                                    <div className="pin-info">
                                        <span className="pin-icon">{booth.icon || '📍'}</span>
                                        <div className="pin-details">
                                            <span className="pin-name">{booth.booth_name}</span>
                                            <span className="pin-location">{booth.location_name || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="pin-value">
                                        {editingPin === booth.booth_id ? (
                                            <div className="pin-edit">
                                                <input
                                                    type="text"
                                                    className="pin-input"
                                                    value={newPin}
                                                    onChange={(e) => setNewPin(e.target.value)}
                                                    placeholder="PIN 입력"
                                                    maxLength={10}
                                                />
                                                <button 
                                                    className="pin-save-btn"
                                                    onClick={() => savePin(booth.booth_id)}
                                                >
                                                    ✓
                                                </button>
                                                <button 
                                                    className="pin-cancel-btn"
                                                    onClick={() => {
                                                        setEditingPin(null);
                                                        setNewPin('');
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="pin-display">
                                                <span className="pin-code">{booth.qr_pin || '미설정'}</span>
                                                <button 
                                                    className="pin-edit-btn"
                                                    onClick={() => startEditPin(booth)}
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;