// src/pages/admin/Settings.jsx
// 이벤트 설정 페이지 - 기간, 스탬프 개수, PIN 설정 등
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authApi';
import { getAllBooths } from '../../services/boothApi';
import '../../styles/Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    
    // 이벤트 기본 설정
    const [eventSettings, setEventSettings] = useState({
        eventName: '2025 대진대학교 스탬프 투어',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        startTime: '09:00',
        endTime: '18:00',
        requiredStamps: 15,
        isActive: true
    });

    // GPS 설정
    const [gpsSettings, setGpsSettings] = useState({
        enabled: true,
        maxDistance: 100, // 미터
        allowBypass: false
    });

    // 부스 PIN 설정
    const [booths, setBooths] = useState([]);
    const [editingPin, setEditingPin] = useState(null);
    const [newPin, setNewPin] = useState('');

    // 로딩 및 저장 상태
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState('');

    // 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 부스 데이터 로드
            const boothsData = await getAllBooths();
            setBooths(boothsData);

            // 이벤트 설정 로드 (TODO: 실제 API 연동)
            // const settingsResponse = await fetch('http://127.0.0.1:8000/api/v1/admin/settings');
            // const settings = await settingsResponse.json();
            
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 이벤트 설정 저장
    const handleSaveEventSettings = async () => {
        setSaving(true);
        try {
            // TODO: 실제 API 호출
            // await fetch('http://127.0.0.1:8000/api/v1/admin/settings', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(eventSettings)
            // });

            await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션
            showSavedMessage('이벤트 설정이 저장되었습니다.');
        } catch (error) {
            console.error('저장 실패:', error);
            alert('설정 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // GPS 설정 저장
    const handleSaveGpsSettings = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            showSavedMessage('GPS 설정이 저장되었습니다.');
        } catch (error) {
            console.error('저장 실패:', error);
        } finally {
            setSaving(false);
        }
    };

    // PIN 변경
    const handleUpdatePin = async (boothId) => {
        if (!newPin.trim() || newPin.length < 4) {
            alert('PIN은 4자리 이상이어야 합니다.');
            return;
        }

        try {
            // TODO: 실제 API 호출
            // await fetch(`http://127.0.0.1:8000/api/v1/admin/booths/${boothId}/pin`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ qr_pin: newPin })
            // });

            setBooths(prevBooths =>
                prevBooths.map(booth =>
                    booth.booth_id === boothId
                        ? { ...booth, qr_pin: newPin }
                        : booth
                )
            );

            setEditingPin(null);
            setNewPin('');
            showSavedMessage('PIN이 변경되었습니다.');
        } catch (error) {
            console.error('PIN 변경 실패:', error);
            alert('PIN 변경에 실패했습니다.');
        }
    };

    // 저장 메시지 표시
    const showSavedMessage = (message) => {
        setSavedMessage(message);
        setTimeout(() => setSavedMessage(''), 3000);
    };

    // 로그아웃
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // 이벤트 상태 토글
    const toggleEventActive = () => {
        setEventSettings(prev => ({
            ...prev,
            isActive: !prev.isActive
        }));
    };

    // 로딩 화면
    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>설정을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="settings-page">
            {/* 저장 완료 메시지 */}
            {savedMessage && (
                <div className="saved-toast">
                    ✅ {savedMessage}
                </div>
            )}

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
                    <h1 className="page-title">⚙️ 이벤트 설정</h1>
                    <p className="page-subtitle">스탬프 투어 이벤트 설정을 관리합니다</p>
                </div>

                {/* 설정 그리드 */}
                <div className="settings-grid">
                    {/* 이벤트 기본 설정 */}
                    <div className="settings-card">
                        <div className="card-header">
                            <h2 className="card-title">📅 이벤트 기본 정보</h2>
                            <div className={`event-status ${eventSettings.isActive ? 'active' : 'inactive'}`}>
                                {eventSettings.isActive ? '🟢 진행중' : '🔴 종료'}
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="form-group">
                                <label className="form-label">이벤트 이름</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={eventSettings.eventName}
                                    onChange={(e) => setEventSettings({
                                        ...eventSettings,
                                        eventName: e.target.value
                                    })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">시작일</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={eventSettings.startDate}
                                        onChange={(e) => setEventSettings({
                                            ...eventSettings,
                                            startDate: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">종료일</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={eventSettings.endDate}
                                        onChange={(e) => setEventSettings({
                                            ...eventSettings,
                                            endDate: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">운영 시작 시간</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={eventSettings.startTime}
                                        onChange={(e) => setEventSettings({
                                            ...eventSettings,
                                            startTime: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">운영 종료 시간</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={eventSettings.endTime}
                                        onChange={(e) => setEventSettings({
                                            ...eventSettings,
                                            endTime: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">완주에 필요한 스탬프 개수</label>
                                <div className="stamp-count-input">
                                    <button 
                                        className="count-btn"
                                        onClick={() => setEventSettings({
                                            ...eventSettings,
                                            requiredStamps: Math.max(1, eventSettings.requiredStamps - 1)
                                        })}
                                    >
                                        -
                                    </button>
                                    <span className="count-value">{eventSettings.requiredStamps}</span>
                                    <button 
                                        className="count-btn"
                                        onClick={() => setEventSettings({
                                            ...eventSettings,
                                            requiredStamps: Math.min(booths.length, eventSettings.requiredStamps + 1)
                                        })}
                                    >
                                        +
                                    </button>
                                    <span className="count-max">/ {booths.length} 부스</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">이벤트 상태</label>
                                <div 
                                    className={`toggle-switch ${eventSettings.isActive ? 'active' : ''}`}
                                    onClick={toggleEventActive}
                                >
                                    <div className="toggle-slider"></div>
                                    <span className="toggle-label">
                                        {eventSettings.isActive ? '진행중' : '종료'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="card-footer">
                            <button 
                                className="save-btn"
                                onClick={handleSaveEventSettings}
                                disabled={saving}
                            >
                                {saving ? '저장 중...' : '💾 저장'}
                            </button>
                        </div>
                    </div>

                    {/* GPS 설정 */}
                    <div className="settings-card">
                        <div className="card-header">
                            <h2 className="card-title">📍 GPS 검증 설정</h2>
                        </div>
                        <div className="card-content">
                            <div className="form-group">
                                <label className="form-label">GPS 검증 사용</label>
                                <div 
                                    className={`toggle-switch ${gpsSettings.enabled ? 'active' : ''}`}
                                    onClick={() => setGpsSettings({
                                        ...gpsSettings,
                                        enabled: !gpsSettings.enabled
                                    })}
                                >
                                    <div className="toggle-slider"></div>
                                    <span className="toggle-label">
                                        {gpsSettings.enabled ? '사용' : '사용 안함'}
                                    </span>
                                </div>
                            </div>

                            {gpsSettings.enabled && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">허용 거리 (미터)</label>
                                        <div className="range-input">
                                            <input
                                                type="range"
                                                min="50"
                                                max="500"
                                                step="10"
                                                value={gpsSettings.maxDistance}
                                                onChange={(e) => setGpsSettings({
                                                    ...gpsSettings,
                                                    maxDistance: parseInt(e.target.value)
                                                })}
                                            />
                                            <span className="range-value">{gpsSettings.maxDistance}m</span>
                                        </div>
                                        <p className="form-hint">
                                            부스 위치에서 {gpsSettings.maxDistance}m 이내에서만 스탬프 획득 가능
                                        </p>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">GPS 오류 시 우회 허용</label>
                                        <div 
                                            className={`toggle-switch ${gpsSettings.allowBypass ? 'active' : ''}`}
                                            onClick={() => setGpsSettings({
                                                ...gpsSettings,
                                                allowBypass: !gpsSettings.allowBypass
                                            })}
                                        >
                                            <div className="toggle-slider"></div>
                                            <span className="toggle-label">
                                                {gpsSettings.allowBypass ? '허용' : '허용 안함'}
                                            </span>
                                        </div>
                                        <p className="form-hint">
                                            GPS 획득 실패 시 PIN 입력으로 대체 가능 여부
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="card-footer">
                            <button 
                                className="save-btn"
                                onClick={handleSaveGpsSettings}
                                disabled={saving}
                            >
                                {saving ? '저장 중...' : '💾 저장'}
                            </button>
                        </div>
                    </div>

                    {/* 부스 PIN 관리 */}
                    <div className="settings-card full-width">
                        <div className="card-header">
                            <h2 className="card-title">🔢 부스 PIN 관리</h2>
                            <p className="card-subtitle">QR 스캔 실패 시 사용할 PIN 번호</p>
                        </div>
                        <div className="card-content">
                            <div className="pin-grid">
                                {booths.map(booth => (
                                    <div key={booth.booth_id} className="pin-item">
                                        <div className="pin-booth-info">
                                            <span className="pin-booth-icon">{booth.icon || '📍'}</span>
                                            <span className="pin-booth-name">{booth.booth_name}</span>
                                        </div>
                                        {editingPin === booth.booth_id ? (
                                            <div className="pin-edit">
                                                <input
                                                    type="text"
                                                    className="pin-input"
                                                    value={newPin}
                                                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                                    placeholder="새 PIN"
                                                    maxLength={6}
                                                    autoFocus
                                                />
                                                <button 
                                                    className="pin-btn save"
                                                    onClick={() => handleUpdatePin(booth.booth_id)}
                                                >
                                                    ✓
                                                </button>
                                                <button 
                                                    className="pin-btn cancel"
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
                                                <span className="pin-value">
                                                    {booth.qr_pin || '미설정'}
                                                </span>
                                                <button 
                                                    className="pin-btn edit"
                                                    onClick={() => {
                                                        setEditingPin(booth.booth_id);
                                                        setNewPin(booth.qr_pin || '');
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;