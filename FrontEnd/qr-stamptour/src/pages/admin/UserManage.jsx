// src/pages/admin/UserManage.jsx
// 사용자 관리 페이지 - 백엔드 연동 버전
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/authApi';
import { getAllBooths } from '../../services/boothApi';
import { getAllUsers, grantStamp } from '../../services/adminApi';
import '../../styles/UserManage.css';

const UserManage = () => {
    const navigate = useNavigate();
    
    // 검색 관련
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all'); // all, studentId, name
    const [filterStatus, setFilterStatus] = useState('all'); // all, completed, inProgress
    
    // 사용자 데이터
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // 부스 데이터 (스탬프 부여용)
    const [booths, setBooths] = useState([]);
    
    // 스탬프 부여 모달
    const [showStampModal, setShowStampModal] = useState(false);
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [stampReason, setStampReason] = useState('');
    
    // 로딩 및 인증
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
            // 부스 데이터 로드
            const boothsData = await getAllBooths();
            setBooths(boothsData);

            // 사용자 데이터 로드
            const usersData = await getAllUsers();
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('데이터 로드 실패:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // 검색 및 필터링
    useEffect(() => {
        let result = [...users];

        // 검색어 필터
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(user => {
                if (searchType === 'studentId') {
                    return user.student_id.includes(query);
                } else if (searchType === 'name') {
                    return user.name.toLowerCase().includes(query);
                } else {
                    return user.student_id.includes(query) || 
                           user.name.toLowerCase().includes(query);
                }
            });
        }

        // 상태 필터
        if (filterStatus === 'completed') {
            result = result.filter(user => user.stamp_count >= 15 || user.is_completed);
        } else if (filterStatus === 'inProgress') {
            result = result.filter(user => user.stamp_count < 15 && !user.is_completed);
        }

        setFilteredUsers(result);
    }, [searchQuery, searchType, filterStatus, users]);

    // 사용자 선택
    const handleSelectUser = (user) => {
        if (selectedUser?.student_id === user.student_id) {
            setSelectedUser(null);
        } else {
            setSelectedUser(user);
        }
    };

    // 스탬프 부여 모달 열기
    const openStampModal = (user) => {
        setSelectedUser(user);
        setSelectedBooth(null);
        setStampReason('');
        setShowStampModal(true);
    };

    // 스탬프 부여 처리
    const handleGrantStamp = async () => {
        if (!selectedBooth || !stampReason.trim()) {
            alert('부스를 선택하고 사유를 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            await grantStamp(selectedUser.student_id, selectedBooth, stampReason);
            
            alert(`${selectedUser.name}님에게 스탬프가 부여되었습니다!`);
            
            // 모달 닫기 및 초기화
            setShowStampModal(false);
            setSelectedBooth(null);
            setStampReason('');
            setSelectedUser(null);
            
            // 데이터 새로고침
            fetchData();
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('스탬프 부여 실패:', error);
                alert(error?.detail || '스탬프 부여에 실패했습니다.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // CSV 다운로드
    const downloadCSV = () => {
        // BOM 추가 (한글 지원)
        let csvContent = '\uFEFF';
        
        // 헤더
        csvContent += '학번,이름,학과,학년,연락처,스탬프 수,상태,가입일\n';
        
        // 데이터
        filteredUsers.forEach(user => {
            const stampCount = user.stamp_count ?? user.stamps?.length ?? 0;
            const status = stampCount >= 15 || user.is_completed ? '완주' : '진행중';
            const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-';
            
            csvContent += `${user.student_id},${user.name},${user.dept_name},${user.grade}학년,${user.phone_number || '-'},${stampCount},${status},${createdAt}\n`;
        });

        // 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `사용자목록_${new Date().toLocaleDateString('ko-KR')}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // 로그아웃
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // 스탬프 수 가져오기 (API 응답 형식에 따라)
    const getStampCount = (user) => {
        return user.stamp_count ?? user.stamps?.length ?? 0;
    };

    // 스탬프 배열 가져오기
    const getStamps = (user) => {
        return user.stamps || [];
    };

    // 인증 체크 전
    if (!authChecked) {
        return (
            <div className="user-manage-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>인증 확인 중...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="user-manage-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>데이터 로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="user-manage-page">
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
                    <div className="admin-nav-item active">
                        👥 사용자 관리
                    </div>
                    <div className="admin-nav-item" onClick={() => navigate('/admin/settings')}>
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
            <div className="user-manage-content">
                {/* 페이지 헤더 */}
                <div className="page-header">
                    <div className="header-left">
                        <h1 className="page-title">👥 사용자 관리</h1>
                        <p className="page-subtitle">
                            전체 {users.length}명 | 필터 결과 {filteredUsers.length}명
                        </p>
                    </div>
                    <button className="csv-btn" onClick={downloadCSV}>
                        📥 CSV 다운로드
                    </button>
                </div>

                {/* 검색 및 필터 */}
                <div className="search-section">
                    <div className="search-box">
                        <select 
                            className="search-type"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="all">전체</option>
                            <option value="studentId">학번</option>
                            <option value="name">이름</option>
                        </select>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="검색어를 입력하세요..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="search-btn">🔍</button>
                    </div>
                    <div className="filter-box">
                        <button 
                            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            전체
                        </button>
                        <button 
                            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('completed')}
                        >
                            ✅ 완주
                        </button>
                        <button 
                            className={`filter-btn ${filterStatus === 'inProgress' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('inProgress')}
                        >
                            🔄 진행중
                        </button>
                    </div>
                </div>

                {/* 사용자 테이블 */}
                <div className="users-section">
                    {filteredUsers.length > 0 ? (
                        <div className="table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>학번</th>
                                        <th>이름</th>
                                        <th>학과</th>
                                        <th>학년</th>
                                        <th>스탬프</th>
                                        <th>상태</th>
                                        <th>가입일</th>
                                        <th>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => {
                                        const stampCount = getStampCount(user);
                                        const stamps = getStamps(user);
                                        const isCompleted = stampCount >= 15 || user.is_completed;
                                        
                                        return (
                                            <React.Fragment key={user.student_id}>
                                                <tr 
                                                    className={selectedUser?.student_id === user.student_id ? 'selected' : ''}
                                                    onClick={() => handleSelectUser(user)}
                                                >
                                                    <td className="student-id">{user.student_id}</td>
                                                    <td className="name">{user.name}</td>
                                                    <td className="dept">{user.dept_name}</td>
                                                    <td className="grade">{user.grade}학년</td>
                                                    <td className="stamps">
                                                        <div className="stamp-progress">
                                                            <div className="stamp-bar">
                                                                <div 
                                                                    className="stamp-fill"
                                                                    style={{ width: `${Math.min((stampCount / 15) * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="stamp-count">{stampCount}/15</span>
                                                        </div>
                                                    </td>
                                                    <td className="status">
                                                        <span className={`status-badge ${isCompleted ? 'completed' : 'progress'}`}>
                                                            {isCompleted ? '✅ 완주' : '🔄 진행중'}
                                                        </span>
                                                    </td>
                                                    <td className="date">
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                                                    </td>
                                                    <td className="actions">
                                                        <button 
                                                            className="action-btn stamp"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openStampModal(user);
                                                            }}
                                                        >
                                                            ➕ 스탬프
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* 확장된 상세 정보 */}
                                                {selectedUser?.student_id === user.student_id && (
                                                    <tr className="detail-row">
                                                        <td colSpan="8">
                                                            <div className="user-detail">
                                                                <div className="detail-info">
                                                                    <div className="detail-item">
                                                                        <span className="detail-label">📞 연락처</span>
                                                                        <span className="detail-value">{user.phone_number || '-'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="detail-stamps">
                                                                    <h4>🎫 획득한 스탬프</h4>
                                                                    <div className="stamp-grid">
                                                                        {booths.map(booth => {
                                                                            const collected = stamps.includes(booth.booth_id);
                                                                            return (
                                                                                <div 
                                                                                    key={booth.booth_id}
                                                                                    className={`stamp-item ${collected ? 'collected' : ''}`}
                                                                                >
                                                                                    <span className="stamp-icon">{booth.icon || '📍'}</span>
                                                                                    <span className="stamp-name">{booth.booth_name}</span>
                                                                                    {collected && <span className="check">✓</span>}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-users">
                            <span className="no-users-icon">🔍</span>
                            <p>검색 결과가 없습니다</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 스탬프 부여 모달 */}
            {showStampModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowStampModal(false)}>
                    <div className="stamp-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowStampModal(false)}>×</button>
                        
                        <h2 className="modal-title">➕ 스탬프 부여</h2>
                        <p className="modal-subtitle">
                            <strong>{selectedUser.name}</strong> ({selectedUser.student_id})님에게 스탬프를 부여합니다
                        </p>

                        <div className="modal-content">
                            {/* 부스 선택 */}
                            <div className="form-group">
                                <label className="form-label">부스 선택 *</label>
                                <div className="booth-select-grid">
                                    {booths.map(booth => {
                                        const stamps = getStamps(selectedUser);
                                        const alreadyCollected = stamps.includes(booth.booth_id);
                                        return (
                                            <div
                                                key={booth.booth_id}
                                                className={`booth-select-item ${selectedBooth === booth.booth_id ? 'selected' : ''} ${alreadyCollected ? 'disabled' : ''}`}
                                                onClick={() => !alreadyCollected && setSelectedBooth(booth.booth_id)}
                                            >
                                                <span className="booth-icon">{booth.icon || '📍'}</span>
                                                <span className="booth-name">{booth.booth_name}</span>
                                                {alreadyCollected && <span className="already-badge">수집완료</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 사유 입력 */}
                            <div className="form-group">
                                <label className="form-label">부여 사유 *</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="예: QR 스캔 오류로 인한 수동 부여"
                                    value={stampReason}
                                    onChange={(e) => setStampReason(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            {/* 버튼 */}
                            <div className="modal-actions">
                                <button 
                                    className="cancel-btn"
                                    onClick={() => setShowStampModal(false)}
                                    disabled={submitting}
                                >
                                    취소
                                </button>
                                <button 
                                    className="submit-btn"
                                    onClick={handleGrantStamp}
                                    disabled={!selectedBooth || !stampReason.trim() || submitting}
                                >
                                    {submitting ? '처리 중...' : '스탬프 부여'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManage;