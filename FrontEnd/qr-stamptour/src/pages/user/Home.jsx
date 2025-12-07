// Home.jsx - 스탬프 이미지 표시 수정 버전
import React from 'react';
import '../../styles/Home.css'; 
import frontImage from '../../assets/images/앞화면.png';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated,getCurrentUser,logout, getStoredUser } from '../../services/authApi';
import { getAllBooths } from '../../services/boothApi';
import { getMyStamps } from '../../services/stampApi';
import KakaoMap from '../../components/KakaoMap';  // ✨ 카카오맵 추가

// ✨ Vite용 동적 이미지 로드 - 모든 스탬프 이미지를 미리 로드
const stampImages = import.meta.glob('../../assets/images/stamps/stamp_*.png', { eager: true });

// 이미지 경로를 ID로 매핑하는 함수
const getStampImage = (id) => {
    // glob 결과에서 해당 ID의 이미지 찾기
    const key = Object.keys(stampImages).find(k => k.includes(`stamp_${id}.png`));
    return key ? stampImages[key].default : null;
};

const { useState, useRef, useEffect } = React;
 
const Home = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [submitForm, setSubmitForm] = useState({ name: '', studentId: '' });
    const [loading, setLoading]=useState(true);

    // ✨ 지도 관련 상태 추가
    const [selectedBooth, setSelectedBooth] = useState(null);  // 선택된 부스 정보
    const [congestionData, setCongestionData] = useState({});  // 부스별 혼잡도 데이터

    const stampSectionRef = useRef(null);

     // ✨ 드롭다운 메뉴 상태 추가
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    // 로그인 상태 확인
    useEffect(() => {
        const checkAuth = () => {
            if (isAuthenticated()) {
                const storedUser = getStoredUser();
                setIsLoggedIn(true);
                setUser(storedUser);
            }
        };
        checkAuth();
    }, []);

    const [stamps, setStamps] = useState([]);
    //프로필 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 부스 목록 불러오기
    useEffect(() => {
        const loadBooths = async () => {
            try {
                setLoading(true);
                const boothsData = await getAllBooths();
                
                // API 데이터를 stamps 형식으로 변환
                const stampsData = boothsData.map(booth => ({
                    id: booth.booth_id,
                    location: booth.booth_name,
                    building: booth.location_name,
                    icon: booth.icon || '📍',
                    collected: false,
                    lat: parseFloat(booth.latitude),
                    lng: parseFloat(booth.longitude)
                }));
                
                setStamps(stampsData);
            } catch (error) {
                alert('부스 목록을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        
        loadBooths();
    }, []);

    // ✨ 새로 추가: 내가 모은 스탬프 불러오기 (로그인 시)
    useEffect(() => {
        const loadMyStamps = async () => {
            if (!isLoggedIn || stamps.length === 0) return;
            
            try {
                const myStampsData = await getMyStamps();
                
                // 내가 모은 스탬프 ID 목록
                const collectedBoothIds = myStampsData.map(stamp => stamp.booth_id);
                
                // stamps 배열 업데이트 (collected 상태 변경)
                setStamps(prevStamps => 
                    prevStamps.map(stamp => ({
                        ...stamp,
                        collected: collectedBoothIds.includes(stamp.id)
                    }))
                );
            } catch (error) {
                // console.error('내 스탬프 로딩 실패:', error);
                // 에러 시 조용히 무시 (401 에러 등)
            }
        };
        
        loadMyStamps();
    }, [isLoggedIn, stamps.length]); // isLoggedIn이나 stamps가 변경되면 실행

    // ✨ 혼잡도 데이터 로드 (30초마다 갱신)
    useEffect(() => {
        const loadCongestion = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/v1/congestion');
                if (response.ok) {
                    const data = await response.json();
                    setCongestionData(data);
                }
            } catch (error) {
                // 혼잡도 로드 실패 시 테스트 데이터 사용
                const testData = {};
                stamps.forEach(s => {
                    testData[s.id] = Math.floor(Math.random() * 20);
                });
                setCongestionData(testData);
            }
        };

        if (stamps.length > 0) {
            loadCongestion();
            const interval = setInterval(loadCongestion, 30000); // 30초마다 갱신
            return () => clearInterval(interval);
        }
    }, [stamps.length]);

    // 로딩 화면
    if(loading){
        return(
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

    const collectedCount = stamps.filter(s => s.collected).length;
    const progressPercentage = (collectedCount / stamps.length) * 100;

    const scrollToStamps = () => {
        stampSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 스탬프 클릭 동작 변경
    const handleStampClick = (id) => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다!');
            navigate('/login');
            return;
        }
        
        // 실제로는 QR 스캔 화면으로 이동해야 함
        navigate('/qr-scan');
    };

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
        setUser(null);
        setShowProfileMenu(false);
        // 스탬프 초기화
        setStamps(stamps.map(stamp => ({ ...stamp, collected: false })));
        alert('로그아웃되었습니다.');
    };

    //관리자 페이지 이동 함수
    const handleAdminPage = () => {
        setShowProfileMenu(false); // 메뉴 닫기
        navigate('/admin/dashboard');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (collectedCount < 15) {
            alert(`15개의 스탬프를 모두 모아야 제출할 수 있습니다! (현재 ${collectedCount}/15)`);
            return;
        }
        alert(`${submitForm.name}님! 15개의 스탬프를 모두 모으셨습니다!`);
        // 실제로는 완주 제출 API 호출
        // submitCompletion(submitForm);
    };

    //관리자 여부 확인
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

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
                                    🏆 {collectedCount}/{stamps.length} 스탬프
                                </div>
                            </div>
                            {/* ✅ 드롭다운 컨테이너 - 메뉴가 안에 있어야 함 */}
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
                                
                                {/* ✅ 드롭다운 메뉴 - 컨테이너 안에 위치 */}
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
                    onClick={() =>{
                        if(isLoggedIn){
                            navigate('/qr-scan');
                        }else{
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

            {/* ✨ 모바일용 프로필 메뉴 (하단에서 슬라이드) */}
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

                        {/* Progress Bar */}
                        <div className="progress-section">
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar-fill" 
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    {collectedCount > 0 && `${Math.round(progressPercentage)}%`}
                                </div>
                            </div>
                            <div className="progress-text">
                                획득한 스탬프: <span className="progress-count">{collectedCount}/{stamps.length}</span>
                            </div>
                        </div>

                        

                        {/* Stamp Grid */}
                        <div className="stamp-grid">
                            {stamps.map(stamp => {
                                // ✨ Vite용 동적 이미지 로드
                                const stampImage = getStampImage(stamp.id);

                                return (
                                    <div 
                                        key={stamp.id}
                                        className={`stamp-card ${stamp.collected ? 'collected' : ''}`}
                                        onClick={() => handleStampClick(stamp.id)}
                                    >
                                        {/* ✅ 핵심 수정: 수집 여부에 따라 완전히 다른 구조 렌더링 */}
                                        {stamp.collected && stampImage ? (
                                            // 🎯 수집 완료 + 이미지 있음: 이미지 중심 레이아웃
                                            <>
                                                <div className="stamp-collected-content">
                                                    <img 
                                                        src={stampImage}
                                                        alt={stamp.location}
                                                        className="stamp-image-collected"
                                                    />
                                                </div>
                                                <div className="stamp-info-collected">
                                                    <div className="stamp-location">{stamp.location}</div>
                                                    <div className="stamp-building">{stamp.building}</div>
                                                </div>
                                                <div className="stamp-check-badge">✔</div>
                                            </>
                                        ) : (
                                            // 🔘 미수집: 기존 아이콘 디자인
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

                        {/* Submit Form */}
                        {isLoggedIn && (
                            <div className="submit-form-section">
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

                        {/* ✨ 카카오맵 섹션 */}
                        <div className="map-section">
                            <div className="map-header-box">
                                <h2 className="map-title">🗺️ 캠퍼스 지도</h2>
                                <p className="map-subtitle">부스 위치와 실시간 혼잡도를 확인하세요</p>
                            </div>

                            {/* 혼잡도 범례 */}
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

                            {/* 선택된 부스 정보 */}
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
                                        onClick={() => setSelectedBooth(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* 카카오맵 */}
                            <KakaoMap 
                                markers={stamps.map(s => ({
                                    id: s.id,
                                    name: s.location,
                                    lat: s.lat,
                                    lng: s.lng,
                                    icon: s.icon,
                                    congestion: congestionData[s.id] || 0
                                }))}
                                onMarkerClick={(marker) => {
                                    const booth = stamps.find(s => s.id === marker.id);
                                    if (booth) {
                                        setSelectedBooth(booth);
                                    }
                                }}
                                showCongestion={true}
                                height="450px"
                            />
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default Home;