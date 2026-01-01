// MyPage.jsx - 마이페이지 컴포넌트
// 데스크톱 + 모바일 반응형 최적화 버전
// 비밀번호 변경: 새 비밀번호만 입력하는 간단한 방식

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getStoredUser, logout } from '../../services/authApi';

import '../../styles/MyPage.css'; 

const MyPage = () => {
    const navigate = useNavigate();
    
    // 사용자 정보 상태
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 수정 모드 상태
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    // 폼 데이터
    const [phoneNumber, setPhoneNumber] = useState('');
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    
    // 메시지 상태
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 초기 데이터 로드
    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthenticated()) {
                alert('로그인이 필요합니다.');
                navigate('/login');
                return;
            }
            
            try {
                const storedUser = getStoredUser();
                setUser(storedUser);
                setPhoneNumber(storedUser?.phone || '');
                
                // TODO: 서버에서 최신 사용자 정보 가져오기
                // const response = await getUserProfile();
                // setUser(response);
                // setPhoneNumber(response.phone || '');
                
            } catch (error) {
                console.error('사용자 정보 로드 실패:', error);
                setMessage({ type: 'error', text: '사용자 정보를 불러오는데 실패했습니다.' });
            } finally {
                setLoading(false);
            }
        };
        
        loadUserData();
    }, [navigate]);

    // 전화번호 포맷팅 (010-1234-5678 형식)
    const formatPhoneNumber = (value) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    // 전화번호 변경 핸들러
    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
    };

    // 전화번호 저장
    const handlePhoneSave = async () => {
        if (!phoneNumber || phoneNumber.length < 13) {
            setMessage({ type: 'error', text: '올바른 전화번호를 입력해주세요.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            // TODO: API 호출
            // await updatePhoneNumber(phoneNumber);
            
            // 임시: 로컬 스토리지 업데이트
            const updatedUser = { ...user, phone: phoneNumber };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            setMessage({ type: 'success', text: '전화번호가 변경되었습니다.' });
            setIsEditingPhone(false);
        } catch (error) {
            setMessage({ type: 'error', text: '전화번호 변경에 실패했습니다.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 비밀번호 변경 핸들러 (간단한 방식 - 새 비밀번호만)
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        const { newPassword, confirmPassword } = passwordData;
        
        // 유효성 검사
        if (!newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: '모든 필드를 입력해주세요.' });
            return;
        }
        
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' });
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            // TODO: API 호출
            // await changePassword(newPassword);
            
            setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setIsChangingPassword(false);
        } catch (error) {
            setMessage({ type: 'error', text: '비밀번호 변경에 실패했습니다.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 로그아웃
    const handleLogout = () => {
        logout();
        alert('로그아웃되었습니다.');
        navigate('/');
    };

    // 메시지 자동 숨김
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // 로딩 화면
    if (loading) {
        return (
            <div className="mypage-loading">
                <div className="loading-spinner">👤</div>
                <p>정보를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="mypage-wrapper">
            {/* 헤더 */}
            <header className="mypage-header">
                <div className="mypage-header-content">
                    <button className="back-button" onClick={() => navigate('/')}>
                        ← 뒤로
                    </button>
                    <h1 className="mypage-title">마이페이지</h1>
                    <div className="header-spacer"></div>
                </div>
            </header>

            {/* 알림 메시지 */}
            {message.text && (
                <div className={`message-toast ${message.type}`}>
                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                </div>
            )}

            <div className="mypage-container">
                {/* 왼쪽 영역 - 프로필 & 스탬프 현황 */}
                <div className="mypage-left">
                    {/* 프로필 카드 */}
                    <section className="profile-card">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="profile-info">
                            <h2 className="profile-name">{user?.name || '이름 없음'}</h2>
                            <p className="profile-student-id">{user?.student_id || '학번 없음'}</p>
                            <p className="profile-department">{user?.department || '컴퓨터공학과'}</p>
                        </div>
                    </section>

                    {/* 스탬프 현황 카드 */}
                    <section className="stamp-status-section">
                        <h3 className="section-title">🏆 스탬프 현황</h3>
                        <div className="stamp-status-card">
                            <div className="stamp-status-item">
                                <div className="stamp-status-value">{user?.stamp_count || 0}</div>
                                <div className="stamp-status-label">획득</div>
                            </div>
                            <div className="stamp-status-divider"></div>
                            <div className="stamp-status-item">
                                <div className="stamp-status-value">{15 - (user?.stamp_count || 0)}</div>
                                <div className="stamp-status-label">남음</div>
                            </div>
                            <div className="stamp-status-divider"></div>
                            <div className="stamp-status-item">
                                <div className={`stamp-status-badge ${user?.is_completed ? 'completed' : 'progress'}`}>
                                    {user?.is_completed ? '🎉 완주!' : '진행중'}
                                </div>
                                <div className="stamp-status-label">상태</div>
                            </div>
                        </div>
                    </section>

                    {/* 액션 버튼들 (데스크톱에서만 왼쪽에 표시) */}
                    <div className="action-buttons-desktop">
                        <button className="action-btn home" onClick={() => navigate('/')}>
                            🏠 홈으로
                        </button>
                        <button className="action-btn logout" onClick={handleLogout}>
                            🚪 로그아웃
                        </button>
                    </div>
                </div>

                {/* 오른쪽 영역 - 정보 & 설정 */}
                <div className="mypage-right">
                    {/* 기본 정보 섹션 */}
                    <section className="info-section">
                        <h3 className="section-title">📋 기본 정보</h3>
                        <div className="info-card">
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-label">
                                        <span className="info-icon">🎓</span>
                                        학번
                                    </div>
                                    <div className="info-value">{user?.student_id || '-'}</div>
                                </div>
                                
                                <div className="info-item">
                                    <div className="info-label">
                                        <span className="info-icon">👤</span>
                                        이름
                                    </div>
                                    <div className="info-value">{user?.name || '-'}</div>
                                </div>
                                
                                <div className="info-item">
                                    <div className="info-label">
                                        <span className="info-icon">📚</span>
                                        학과
                                    </div>
                                    <div className="info-value">{user?.department || '컴퓨터공학과'}</div>
                                </div>
                                
                                <div className="info-item">
                                    <div className="info-label">
                                        <span className="info-icon">📅</span>
                                        학년
                                    </div>
                                    <div className="info-value">{user?.grade ? `${user.grade}학년` : '4학년'}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 연락처 & 보안 섹션 */}
                    <section className="info-section">
                        <h3 className="section-title">🔧 계정 설정</h3>
                        <div className="info-card">
                            {/* 전화번호 */}
                            <div className="setting-item">
                                <div className="setting-header">
                                    <div className="setting-label">
                                        <span className="info-icon">📞</span>
                                        전화번호
                                    </div>
                                    {!isEditingPhone && (
                                        <button 
                                            className="edit-btn"
                                            onClick={() => setIsEditingPhone(true)}
                                        >
                                            수정
                                        </button>
                                    )}
                                </div>
                                
                                {isEditingPhone ? (
                                    <div className="edit-field">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            placeholder="010-0000-0000"
                                            className="edit-input"
                                            maxLength={13}
                                        />
                                        <div className="edit-buttons">
                                            <button 
                                                className="save-btn"
                                                onClick={handlePhoneSave}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? '저장 중...' : '저장'}
                                            </button>
                                            <button 
                                                className="cancel-btn"
                                                onClick={() => {
                                                    setIsEditingPhone(false);
                                                    setPhoneNumber(user?.phone || '');
                                                }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="setting-value">
                                        {user?.phone || '등록된 번호 없음'}
                                    </div>
                                )}
                            </div>

                            <div className="setting-divider"></div>

                            {/* 비밀번호 변경 */}
                            <div className="setting-item">
                                <div className="setting-header">
                                    <div className="setting-label">
                                        <span className="info-icon">🔑</span>
                                        비밀번호
                                    </div>
                                    {!isChangingPassword && (
                                        <button 
                                            className="edit-btn"
                                            onClick={() => setIsChangingPassword(true)}
                                        >
                                            변경
                                        </button>
                                    )}
                                </div>
                                
                                {isChangingPassword ? (
                                    <form className="password-form" onSubmit={handlePasswordChange}>
                                        <div className="password-fields">
                                            <div className="form-group">
                                                <label className="form-label">새 비밀번호</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData(prev => ({
                                                        ...prev,
                                                        newPassword: e.target.value
                                                    }))}
                                                    className="form-input"
                                                    placeholder="6자 이상 입력"
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">비밀번호 확인</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData(prev => ({
                                                        ...prev,
                                                        confirmPassword: e.target.value
                                                    }))}
                                                    className="form-input"
                                                    placeholder="다시 입력"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="password-form-buttons">
                                            <button 
                                                type="submit" 
                                                className="save-btn"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? '변경 중...' : '변경하기'}
                                            </button>
                                            <button 
                                                type="button"
                                                className="cancel-btn"
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setPasswordData({
                                                        newPassword: '',
                                                        confirmPassword: ''
                                                    });
                                                }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="setting-value">
                                        ••••••••
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* 모바일용 하단 버튼 */}
            <div className="action-buttons-mobile">
                <button className="action-btn home" onClick={() => navigate('/')}>
                    🏠 홈으로
                </button>
                <button className="action-btn logout" onClick={handleLogout}>
                    🚪 로그아웃
                </button>
            </div>

            {/* 하단 여백 */}
            <div className="bottom-spacer"></div>
        </div>
    );
};

export default MyPage;