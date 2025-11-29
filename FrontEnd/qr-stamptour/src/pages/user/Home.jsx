// Home.jsx - 로그인 모달 제거, 별도 Login 페이지 사용
import React from 'react';
import '../../styles/Home.css'; 
import frontImage from '../../assets/images/앞화면.png';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated,getCurrentUser,logout } from '../../services/authApi';
import { getAllBooths } from '../../services/boothApi';
const { useState, useRef, useEffect } = React;
 
const Home = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [submitForm, setSubmitForm] = useState({ name: '', studentId: '' });
    const [loading, setLoading]=useState(true);

    const stampSectionRef = useRef(null);

    // 로그인 상태 확인
    useEffect(() => {
        const checkAuth = () => {
            if (isAuthenticated()) {
                const storedUser = getCurrentUser();
                setIsLoggedIn(true);
                setUser(storedUser);
            }
        };
        checkAuth();
    }, []);

    const [stamps, setStamps] = useState([]);
    //부스 목록 불러오기
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
    //로딩 화면
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

    const handleStampClick = (id) => {
        if (!isLoggedIn) {
            alert('로그인이 필요합니다!');
            navigate('/login');
            return;
        }
        setStamps(stamps.map(stamp => 
            stamp.id === id ? { ...stamp, collected: !stamp.collected } : stamp
        ));
    };

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
        setUser(null);
        setStamps(stamps.map(stamp => ({ ...stamp, collected: false })));
        alert('로그아웃되었습니다.');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (collectedCount < 14) {
            alert(`14개의 스탬프를 모두 모아야 제출할 수 있습니다! (현재 ${collectedCount}/14)`);
            return;
        }
        alert(`${submitForm.name}님! 14개의 스탬프를 모두 모으셨습니다!`);
        setStamps(stamps.map(stamp => ({ ...stamp, collected: false })));
        setSubmitForm({ name: '', studentId: '' });
    };

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
                            <div className="user-avatar" onClick={handleLogout}>
                                {user?.name?.charAt(0)}
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
                    onClick={() => alert('QR 스캔 기능은 모바일 앱에서 사용 가능합니다!')}
                >
                    <div className="bottom-nav-icon">📷</div>
                    <div className="bottom-nav-label">QR스캔</div>
                </div>
                <div 
                    className={`bottom-nav-item ${currentPage === 'profile' ? 'active' : ''}`}
                    onClick={() => isLoggedIn ? setCurrentPage('profile') : navigate('/login')}
                >
                    <div className="bottom-nav-icon">👤</div>
                    <div className="bottom-nav-label">내정보</div>
                </div>
            </nav>

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
                                    대진대 캠퍼스를 탐험하며 14개의 스탬프를 모두 모아보세요!
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
                            {stamps.map(stamp => (
                                <div 
                                    key={stamp.id}
                                    className={`stamp-card ${stamp.collected ? 'collected' : ''}`}
                                    onClick={() => handleStampClick(stamp.id)}
                                >
                                    <div className="stamp-icon-wrapper">
                                        <div className="stamp-circle">
                                            <div className="stamp-icon">{stamp.icon}</div>
                                            <div className="stamp-logo-text">DAEJIN<br/>UNIVERSITY</div>
                                        </div>
                                    </div>
                                    <div className="stamp-location">{stamp.location}</div>
                                    <div className="stamp-building">{stamp.building}</div>
                                    <div className="stamp-check-badge">✓</div>
                                </div>
                            ))}
                        </div>

                        {/* Submit Form */}
                        {isLoggedIn && (
                            <div className="submit-form-section">
                                <form className="submit-form" onSubmit={handleSubmit}>
                                    <button 
                                        type="submit"
                                        className="submit-button"
                                        disabled={collectedCount < 14 || !submitForm.name || !submitForm.studentId}
                                    >
                                        {collectedCount < 14 
                                            ? `스탬프를 더 모아주세요 (${collectedCount}/14)` 
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
                    </div>
                </section>
            )}
        </>
    );
};

export default Home;