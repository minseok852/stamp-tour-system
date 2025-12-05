// src/pages/admin/UserManage.jsx
// 사용자 관리 페이지 - 검색, 스탬프 부여, CSV 다운로드
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authApi';
import { getAllBooths } from '../../services/boothApi';
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
    
    // 로딩
    const [loading, setLoading] = useState(true);

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

            // 사용자 데이터 로드 (TODO: 실제 API 연동)
            // const usersResponse = await fetch('http://127.0.0.1:8000/api/v1/admin/users');
            // const usersData = await usersResponse.json();
            
            // 테스트 데이터
            const testUsers = [
                { 
                    student_id: '20231001', 
                    name: '홍길동', 
                    dept_name: '컴퓨터공학과',
                    grade: 3,
                    phone_number: '010-1234-5678',
                    stamps: [1, 2, 3, 5, 7, 9, 11, 13, 15],
                    created_at: '2025-12-01 09:30'
                },
                { 
                    student_id: '20231002', 
                    name: '김철수', 
                    dept_name: '전자공학과',
                    grade: 2,
                    phone_number: '010-2345-6789',
                    stamps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                    created_at: '2025-12-01 10:15'
                },
                { 
                    student_id: '20231003', 
                    name: '이영희', 
                    dept_name: '경영학과',
                    grade: 4,
                    phone_number: '010-3456-7890',
                    stamps: [1, 3, 5],
                    created_at: '2025-12-02 11:20'
                },
                { 
                    student_id: '20231004', 
                    name: '박민수', 
                    dept_name: '국어국문학과',
                    grade: 1,
                    phone_number: '010-4567-8901',
                    stamps: [2, 4, 6, 8, 10, 12],
                    created_at: '2025-12-02 14:45'
                },
                { 
                    student_id: '20231005', 
                    name: '정수진', 
                    dept_name: '화학과',
                    grade: 3,
                    phone_number: '010-5678-9012',
                    stamps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                    created_at: '2025-12-03 09:00'
                },
                { 
                    student_id: '20231006', 
                    name: '최동현', 
                    dept_name: '물리학과',
                    grade: 2,
                    phone_number: '010-6789-0123',
                    stamps: [1],
                    created_at: '2025-12-03 16:30'
                },
                { 
                    student_id: '20231007', 
                    name: '강서연', 
                    dept_name: '간호학과',
                    grade: 4,
                    phone_number: '010-7890-1234',
                    stamps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    created_at: '2025-12-04 10:00'
                },
                { 
                    student_id: '20231008', 
                    name: '윤지호', 
                    dept_name: '건축학과',
                    grade: 3,
                    phone_number: '010-8901-2345',
                    stamps: [],
                    created_at: '2025-12-04 13:15'
                },
            ];
            
            setUsers(testUsers);
            setFilteredUsers(testUsers);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
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
            result = result.filter(user => user.stamps.length >= 15);
        } else if (filterStatus === 'inProgress') {
            result = result.filter(user => user.stamps.length < 15);
        }

        setFilteredUsers(result);
    }, [searchQuery, searchType, filterStatus, users]);

    // 사용자 선택
    const handleSelectUser = (user) => {
        setSelectedUser(selectedUser?.student_id === user.student_id ? null : user);
    };

    // 스탬프 부여 모달 열기
    const openStampModal = (user) => {
        setSelectedUser(user);
        setShowStampModal(true);
        setSelectedBooth(null);
        setStampReason('');
    };

    // 스탬프 부여
    const handleGrantStamp = async () => {
        if (!selectedBooth) {
            alert('부스를 선택해주세요.');
            return;
        }
        if (!stampReason.trim()) {
            alert('부여 사유를 입력해주세요.');
            return;
        }

        try {
            // TODO: 실제 API 호출
            // await fetch('http://127.0.0.1:8000/api/v1/admin/grant-stamp', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         student_id: selectedUser.student_id,
            //         booth_id: selectedBooth,
            //         reason: stampReason
            //     })
            // });

            // 로컬 상태 업데이트 (테스트용)
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.student_id === selectedUser.student_id
                        ? { ...user, stamps: [...user.stamps, selectedBooth] }
                        : user
                )
            );

            alert(`${selectedUser.name}님에게 스탬프가 부여되었습니다.`);
            setShowStampModal(false);
            setSelectedBooth(null);
            setStampReason('');
        } catch (error) {
            console.error('스탬프 부여 실패:', error);
            alert('스탬프 부여에 실패했습니다.');
        }
    };

    // CSV 다운로드
    const downloadCSV = () => {
        const headers = ['학번', '이름', '학과', '학년', '연락처', '획득 스탬프', '완주 여부', '가입일'];
        const rows = filteredUsers.map(user => [
            user.student_id,
            user.name,
            user.dept_name,
            user.grade,
            user.phone_number,
            user.stamps.length,
            user.stamps.length >= 15 ? '완주' : '진행중',
            user.created_at
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `사용자목록_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // 로그아웃
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // 부스 이름 가져오기
    const getBoothName = (boothId) => {
        const booth = booths.find(b => b.booth_id === boothId);
        return booth ? booth.booth_name : `부스 ${boothId}`;
    };

    // 로딩 화면
    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>데이터를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="user-manage">
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
                        <p className="page-subtitle">사용자 검색, 스탬프 현황 확인 및 관리</p>
                    </div>
                    <div className="header-right">
                        <button className="csv-btn" onClick={downloadCSV}>
                            📥 CSV 다운로드
                        </button>
                    </div>
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
                            placeholder="학번 또는 이름으로 검색..."
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
                            전체 ({users.length})
                        </button>
                        <button 
                            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('completed')}
                        >
                            ✅ 완주 ({users.filter(u => u.stamps.length >= 15).length})
                        </button>
                        <button 
                            className={`filter-btn ${filterStatus === 'inProgress' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('inProgress')}
                        >
                            🔄 진행중 ({users.filter(u => u.stamps.length < 15).length})
                        </button>
                    </div>
                </div>

                {/* 사용자 목록 */}
                <div className="users-section">
                    <div className="users-header">
                        <span className="users-count">검색 결과: {filteredUsers.length}명</span>
                    </div>

                    {filteredUsers.length > 0 ? (
                        <div className="users-table-wrapper">
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
                                    {filteredUsers.map(user => (
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
                                                                style={{ width: `${(user.stamps.length / 15) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="stamp-count">{user.stamps.length}/15</span>
                                                    </div>
                                                </td>
                                                <td className="status">
                                                    <span className={`status-badge ${user.stamps.length >= 15 ? 'completed' : 'progress'}`}>
                                                        {user.stamps.length >= 15 ? '✅ 완주' : '🔄 진행중'}
                                                    </span>
                                                </td>
                                                <td className="date">{user.created_at}</td>
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
                                                                    <span className="detail-value">{user.phone_number}</span>
                                                                </div>
                                                            </div>
                                                            <div className="detail-stamps">
                                                                <h4>🎫 획득한 스탬프</h4>
                                                                <div className="stamp-grid">
                                                                    {booths.map(booth => {
                                                                        const collected = user.stamps.includes(booth.booth_id);
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
                                    ))}
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
                                        const alreadyCollected = selectedUser.stamps.includes(booth.booth_id);
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
                                >
                                    취소
                                </button>
                                <button 
                                    className="submit-btn"
                                    onClick={handleGrantStamp}
                                    disabled={!selectedBooth || !stampReason.trim()}
                                >
                                    스탬프 부여
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