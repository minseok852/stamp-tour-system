// Home.jsx - 성능 최적화 버전
// ⭐ 최적화 내용:
// 1. KakaoMap React.lazy로 지연 로딩
// 2. useMemo/useCallback으로 불필요한 재계산/재생성 방지
// 3. Promise.all로 데이터 병렬 로딩 (Waterfall 해결)
// 4. 혼잡도 폴링 최적화 (3분 간격, visibility 체크)

import React, { 
    useState, 
    useRef, 
    useEffect, 
    useMemo, 
    useCallback, 
    lazy, 
    Suspense 
} from 'react';
import '../../styles/Home.css'; 
import frontImage from '../../assets/images/앞화면.png';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, logout, getStoredUser } from '../../services/authApi';
import { getAllBooths } from '../../services/boothApi';
import { getMyStamps } from '../../services/stampApi';
import { getCompletionStatus } from '../../services/completionApi';

// ⭐ KakaoMap 지연 로딩 (가장 무거운 컴포넌트)
const KakaoMap = lazy(() => import('../../components/KakaoMap'));

// Vite용 동적 이미지 로드
const stampImages = import.meta.glob('../../assets/images/stamps/stamp_*.png', { eager: true });

// 이미지 경로를 ID로 매핑하는 함수
const getStampImage = (id) => {
    const key = Object.keys(stampImages).find(k => k.includes(`stamp_${id}.png`));
    return key ? stampImages[key].default : null;
};

// ⭐ 지도 로딩 Fallback 컴포넌트
const MapLoadingFallback = () => (
    <div style={{
        height: '450px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#F7FAFC',
        borderRadius: '20px',
        border: '2px dashed #CBD5E0'
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🗺️</div>
            <div style={{ color: '#718096', fontWeight: '600' }}>지도 로딩 중...</div>
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    
    // ===== 상태 관리 =====
    const [currentPage, setCurrentPage] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stamps, setStamps] = useState([]);
    
    // 지도 관련 상태
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [congestionData, setCongestionData] = useState({});

    // 드롭다운 메뉴 상태
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // 완주 상태
    const [isCompleted, setIsCompleted] = useState(false);
    const [completedAt, setCompletedAt] = useState(null);

    // Refs
    const stampSectionRef = useRef(null);
    const profileMenuRef = useRef(null);

    // ===== ⭐ 로그인 상태 확인 (초기 1회) =====
    useEffect(() => {
        if (isAuthenticated()) {
            const storedUser = getStoredUser();
            setIsLoggedIn(true);
            setUser(storedUser);
        }
    }, []);

    // ===== 프로필 메뉴 외부 클릭 감지 =====
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ===== ⭐ 혼잡도 로드 함수 (useCallback으로 메모이제이션) =====
    const loadCongestion = useCallback(async (stampsData) => {
        if (!stampsData || stampsData.length === 0) return;
        
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/congestion`
            );
            if (response.ok) {
                const data = await response.json();
                setCongestionData(data);
            }
        } catch (error) {
            // 실패 시 조용히 무시 (혼잡도는 필수 아님)
            console.log('혼잡도 로드 실패 (무시됨)');
        }
    }, []);

    // ===== ⭐ 메인 데이터 로딩 (Promise.all로 병렬 실행) =====
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                
                // ⭐ 병렬로 데이터 로드 (Waterfall 해결)
                const isUserLoggedIn = isAuthenticated();
                
                const [boothsData, myStampsData, completionData] = await Promise.all([
                    getAllBooths(),
                    isUserLoggedIn 
                        ? getMyStamps().catch(() => []) // 실패해도 빈 배열 반환
                        : Promise.resolve([]),
                    isUserLoggedIn 
                        ? getCompletionStatus().catch(() => null) // 실패해도 null 반환
                        : Promise.resolve(null)
                ]);
                if(completionData&&completionData.is_completed){
                    setIsCompleted(true);
                }
                // 수집된 부스 ID 목록
                const collectedBoothIds = myStampsData.map(stamp => stamp.booth_id);
                
                // 부스 데이터 가공 (수집 여부 포함)
                const stampsData = boothsData.map(booth => ({
                    id: booth.booth_id,
                    location: booth.booth_name,
                    building: booth.location_name,
                    icon: booth.icon || '📍',
                    collected: collectedBoothIds.includes(booth.booth_id),
                    lat: parseFloat(booth.latitude),
                    lng: parseFloat(booth.longitude)
                }));
                
                setStamps(stampsData);
                
                // ⭐ 혼잡도는 메인 로딩 완료 후 별도로 (비동기, 기다리지 않음)
                loadCongestion(stampsData);
                
            } catch (error) {
                console.error('데이터 로드 실패:', error);
                alert('부스 목록을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        
        loadAllData();
    }, [isLoggedIn, loadCongestion]); // isLoggedIn 변경 시 재실행

    // ===== ⭐ 혼잡도 주기적 갱신 (3분 간격, visibility 체크) =====
    useEffect(() => {
        if (stamps.length === 0) return;
        
        const interval = setInterval(() => {
            // ⭐ 페이지가 보일 때만 폴링 (탭 전환 시 불필요한 요청 방지)
            if (document.visibilityState === 'visible') {
                loadCongestion(stamps);
            }
        }, 180000); // 3분 간격
        
        return () => clearInterval(interval);
    }, [stamps, loadCongestion]);

    // ===== ⭐ useMemo: 계산값 메모이제이션 =====
    const collectedCount = useMemo(() => 
        stamps.filter(s => s.collected).length, 
    [stamps]);

    const progressPercentage = useMemo(() => 
        stamps.length > 0 ? (collectedCount / stamps.length) * 100 : 0, 
    [collectedCount, stamps.length]);

    // ⭐ 마커 데이터 메모이제이션 (KakaoMap에 전달)
    const markers = useMemo(() => 
        stamps.map(s => ({
            id: s.id,
            name: s.location,
            lat: s.lat,
            lng: s.lng,
            icon: s.icon,
            congestion: congestionData[s.id] || 0
        })), 
    [stamps, congestionData]);

    const isAdmin = useMemo(() => 
        user?.role === 'admin' || user?.is_admin === true, 
    [user]);

    // ===== ⭐ useCallback: 핸들러 함수 메모이제이션 =====
    const scrollToStamps = useCallback(() => {
        stampSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleStampClick = useCallback((id) => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다!');
            navigate('/login');
            return;
        }
        navigate('/qr-scan');
    }, [isLoggedIn, navigate]);

    const handleLogout = useCallback(() => {
        logout();
        setIsLoggedIn(false);
        setUser(null);
        setShowProfileMenu(false);
        setIsCompleted(false);
        setCompletedAt(null);
        setStamps(prevStamps => prevStamps.map(stamp => ({ ...stamp, collected: false })));
        alert('로그아웃되었습니다.');
    }, []);

    const handleAdminPage = useCallback(() => {
        setShowProfileMenu(false);
        navigate('/admin/dashboard');
    }, [navigate]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (collectedCount < 15) {
            alert(`15개의 스탬프를 모두 모아야 제출할 수 있습니다! (현재 ${collectedCount}/15)`);
            return;
        }
        setIsCompleted(true);
        setCompletedAt(new Date().toISOString());
        alert(`${user?.name}님! 완주를 축하합니다! 🎉`);
    }, [collectedCount, user?.name]);

    // ⭐ 마커 클릭 핸들러 메모이제이션
    const handleMarkerClick = useCallback((marker) => {
        const booth = stamps.find(s => s.id === marker.id);
        if (booth) {
            setSelectedBooth(booth);
        }
    }, [stamps]);

    const handleCloseBoothPanel = useCallback(() => {
        setSelectedBooth(null);
    }, []);

    // 완주 날짜 포맷팅
    const formatCompletedDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }, []);

    // ===== 로딩 화면 =====
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.5rem',
                color: '#0D4E8C'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎓</div>
                    <div>부스 목록을 불러오는 중...</div>
                </div>
            </div>
        );
    }

    // ===== 렌더링 =====
    return (
        <>
            {/* Desktop Navigation */}
            <nav className="navbar">
                <div className="nav-logo" onClick={() => setCurrentPage('home')}>
                    <span className="nav-logo-icon">🎓</span>
                    <span>대진대 스탬프 투어</span>
                </div>
                <div className="nav-menu">
                    <div 
                        className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('home')}
                    >
                        홈
                    </div>
                    <div 
                        className={`nav-item ${currentPage === 'stamps' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('stamps')}
                    >
                        스탬프 현황
                    </div>
                </div>
                <div className="nav-user">
                    {isLoggedIn ? (
                        <>
                            <div className="user-info">
                                <div className="user-name">{user?.name}</div>
                                <div className="user-stamps">
                                    {isCompleted ? '🏆 완주!' : `🏆 ${collectedCount}/${stamps.length} 스탬프`}
                                </div>
                            </div>
                            <div 
                                className="profile-dropdown-container" 
                                ref={profileMenuRef} 
                            >
                                <div 
                                    className="user-avatar" 
                                    onClick={() => setShowProfileMenu(prev => !prev)}
                                >
                                    {user?.name?.charAt(0)}
                                </div>
                                
                                {showProfileMenu && (
                                    <div className="profile-dropdown-menu">
                                        <div className="dropdown-header">
                                            <div className="dropdown-user-name">{user?.name}</div>
                                            <div className="dropdown-user-id">{user?.student_id}</div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        {isAdmin && (
                                            <div 
                                                className="dropdown-item admin"
                                                onClick={handleAdminPage}
                                            >
                                                <span className="dropdown-icon">📊</span>
                                                관리자 페이지
                                            </div>
                                        )}
                                        <div 
                                            className="dropdown-item logout"
                                            onClick={handleLogout}
                                        >
                                            <span className="dropdown-icon">🚪</span>
                                            로그아웃
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button className="login-button" onClick={() => navigate('/login')}>
                            로그인
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                <div 
                    className={`bottom-nav-item ${currentPage === 'home' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('home')}
                >
                    <div className="bottom-nav-icon">🏠</div>
                    <div className="bottom-nav-label">홈</div>
                </div>
                <div 
                    className={`bottom-nav-item ${currentPage === 'stamps' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('stamps')}
                >
                    <div className="bottom-nav-icon">🎫</div>
                    <div className="bottom-nav-label">스탬프</div>
                </div>
                <div 
                    className={`bottom-nav-item ${currentPage === 'scan' ? 'active' : ''}`}
                    onClick={() => {
                        if (isLoggedIn) {
                            navigate('/qr-scan');
                        } else {
                            alert('로그인이 필요합니다!');
                            navigate('/login');
                        }
                    }}
                >
                    <div className="bottom-nav-icon">📷</div>
                    <div className="bottom-nav-label">QR스캔</div>
                </div>
                <div 
                    className={`bottom-nav-item ${currentPage === 'profile' ? 'active' : ''}`}
                    onClick={() => isLoggedIn ? setShowProfileMenu(true) : navigate('/login')}
                >
                    <div className="bottom-nav-icon">👤</div>
                    <div className="bottom-nav-label">내 정보</div>
                </div>
            </nav>

            {/* 모바일용 프로필 메뉴 */}
            {showProfileMenu && isLoggedIn && (
                <div className="mobile-profile-overlay" onClick={() => setShowProfileMenu(false)}>
                    <div 
                        className="mobile-profile-menu"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mobile-menu-header">
                            <div className="mobile-user-avatar">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="mobile-user-info">
                                <div className="mobile-user-name">{user?.name}</div>
                                <div className="mobile-user-id">{user?.student_id}</div>
                            </div>
                            <button 
                                className="mobile-menu-close"
                                onClick={() => setShowProfileMenu(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mobile-menu-stats">
                            <div className="mobile-stat">
                                <div className="mobile-stat-value">{collectedCount}</div>
                                <div className="mobile-stat-label">획득 스탬프</div>
                            </div>
                            <div className="mobile-stat">
                                <div className="mobile-stat-value">{stamps.length - collectedCount}</div>
                                <div className="mobile-stat-label">남은 스탬프</div>
                            </div>
                        </div>
                        <div className="mobile-menu-items">
                            {isAdmin && (
                                <div 
                                    className="mobile-menu-item admin"
                                    onClick={handleAdminPage}
                                >
                                    <span className="mobile-menu-icon">📊</span>
                                    <span>관리자 페이지</span>
                                    <span className="mobile-menu-arrow">›</span>
                                </div>
                            )}
                            <div 
                                className="mobile-menu-item logout"
                                onClick={handleLogout}
                            >
                                <span className="mobile-menu-icon">🚪</span>
                                <span>로그아웃</span>
                                <span className="mobile-menu-arrow">›</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            {currentPage === 'home' && (
                <section className="hero-section">
                    <div className="deco-circle"></div>
                    <div className="deco-circle"></div>
                    <div className="deco-circle"></div>
                    <div className="deco-circle"></div>
                    
                    <div className="hero-content">
                        <div className="hero-title-section">
                            <div className="hero-logo">
                                <div className="hero-logo-text">대진대</div>
                            </div>
                            <h1 className="hero-main-title">대진대 QR 스탬프 랠리</h1>
                            <p className="hero-subtitle">캠퍼스 투어 참여 안내</p>
                        </div>
                        
                        <div className="hero-image-container">
                            <img src={frontImage} alt="앞화면" className="hero-image" />
                        </div>
                    </div>
                    
                    <div className="scroll-indicator" onClick={scrollToStamps}>
                        <span>스탬프 장소 안내</span>
                        <div className="scroll-arrow"></div>
                    </div>
                </section>
            )}

            {/* Stamp Section */}
            {(currentPage === 'home' || currentPage === 'stamps') && (
                <section className="stamp-section" ref={stampSectionRef}>
                    <div className="stamp-container">
                        <div className="stamp-header">
                            <div className="stamp-header-bg">
                                <h2 className="stamp-title">🎫 스탬프 장소 안내</h2>
                                <p className="stamp-subtitle">
                                    대진대 캠퍼스를 탐험하며 15개의 스탬프를 모두 모아보세요!
                                </p>
                            </div>
                        </div>

                        {/* 완주 축하 배너 */}
                        {isLoggedIn && isCompleted && (
                            <div className="completion-banner">
                                <div className="completion-banner-content">
                                    <div className="completion-trophy">🏆</div>
                                    <div className="completion-text">
                                        <h3 className="completion-title">축하합니다! 완주하셨습니다! 🎉</h3>
                                        <p className="completion-date">
                                            완주일: {formatCompletedDate(completedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="progress-section">
                            <div className={`progress-bar-container ${isCompleted ? 'completed' : ''}`}>
                                <div 
                                    className={`progress-bar-fill ${isCompleted ? 'completed' : ''}`}
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    {collectedCount > 0 && (isCompleted ? '🎉 완주!' : `${Math.round(progressPercentage)}%`)}
                                </div>
                            </div>
                            <div className="progress-text">
                                획득한 스탬프: <span className={`progress-count ${isCompleted ? 'completed' : ''}`}>
                                    {collectedCount}/{stamps.length}
                                </span>
                                {isCompleted && <span className="completed-badge">✔ 완주</span>}
                            </div>
                        </div>

                        {/* 스탬프 그리드 */}
                        <div className={`stamp-grid ${isCompleted ? 'completed' : ''}`}>
                            {stamps.map(stamp => {
                                const stampImage = getStampImage(stamp.id);

                                return (
                                    <div 
                                        key={stamp.id}
                                        className={`stamp-card ${stamp.collected ? 'collected' : ''} ${isCompleted ? 'all-completed' : ''}`}
                                        onClick={() => handleStampClick(stamp.id)}
                                    >
                                        {stamp.collected && stampImage ? (
                                            <>
                                                <div className="stamp-collected-content">
                                                    <img 
                                                        src={stampImage}
                                                        alt={stamp.location}
                                                        className="stamp-image-collected"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                </div>
                                                <div className="stamp-info-collected">
                                                    <div className="stamp-location">{stamp.location}</div>
                                                    <div className="stamp-building">{stamp.building}</div>
                                                </div>
                                                <div className="stamp-check-badge">✔</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="stamp-icon-wrapper">
                                                    <div className="stamp-circle">
                                                        <div className="stamp-icon">{stamp.icon}</div>
                                                        <div className="stamp-logo-text">DAEJIN<br/>UNIVERSITY</div>
                                                    </div>
                                                </div>
                                                <div className="stamp-location">{stamp.location}</div>
                                                <div className="stamp-building">{stamp.building}</div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Submit Form - 완주 여부에 따라 다르게 표시 */}
                        {isLoggedIn && (
                            <div className="submit-form-section">
                                {isCompleted ? (
                                    <button 
                                        className="submit-button completed"
                                        disabled
                                    >
                                        ✅ 완주 완료!
                                    </button>
                                ) : (
                                    <form className="submit-form" onSubmit={handleSubmit}>
                                        <button 
                                            type="submit"
                                            className="submit-button"
                                            disabled={collectedCount < 15}
                                        >
                                            {collectedCount < 15
                                                ? `스탬프를 더 모아주세요 (${collectedCount}/15)` 
                                                : '완주 인증 제출하기 🎉'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {!isLoggedIn && (
                            <div style={{ textAlign: 'center' }}>
                                <button 
                                    className="login-button" 
                                    onClick={() => navigate('/login')}
                                    style={{ padding: '18px 50px', fontSize: '1.2rem' }}
                                >
                                    로그인하고 스탬프 모으기
                                </button>
                            </div>
                        )}

                        {/* 카카오맵 섹션 */}
                        <div className="map-section">
                            <div className="map-header-box">
                                <h2 className="map-title">🗺️ 캠퍼스 지도</h2>
                                <p className="map-subtitle">부스 위치와 실시간 혼잡도를 확인하세요</p>
                            </div>

                            <div className="congestion-legend">
                                <div className="legend-item">
                                    <span className="legend-dot" style={{background: '#48BB78'}}></span>
                                    <span>여유 (0~5명)</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot" style={{background: '#F6AD55'}}></span>
                                    <span>보통 (6~15명)</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot" style={{background: '#E53E3E'}}></span>
                                    <span>혼잡 (16명+)</span>
                                </div>
                            </div>

                            {selectedBooth && (
                                <div className="selected-booth-panel">
                                    <div className="selected-booth-info">
                                        <span className="booth-icon">{selectedBooth.icon}</span>
                                        <div className="booth-details">
                                            <div className="booth-name">{selectedBooth.location}</div>
                                            <div className="booth-building">{selectedBooth.building}</div>
                                        </div>
                                    </div>
                                    <button 
                                        className="close-panel-btn"
                                        onClick={handleCloseBoothPanel}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* ⭐ KakaoMap을 Suspense로 감싸서 지연 로딩 */}
                            <Suspense fallback={<MapLoadingFallback />}>
                                <KakaoMap 
                                    markers={markers}
                                    onMarkerClick={handleMarkerClick}
                                    showCongestion={true}
                                    height="450px"
                                />
                            </Suspense>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default Home;