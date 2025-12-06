// src/pages/admin/DataExport.jsx
// 데이터 다운로드 페이지 - 백엔드 연동 버전
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/authApi';
import { 
    getDashboardStats, 
    getAllUsers, 
    getCompleters, 
    getBoothStats, 
    getSuspiciousRecords,
    getTimeStats 
} from '../../services/adminApi';
import '../../styles/DataExport.css';

const DataExport = () => {
    const navigate = useNavigate();
    
    // 다운로드 옵션
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    
    // 다운로드 진행 상태
    const [downloading, setDownloading] = useState(null);
    
    // 통계 요약
    const [stats, setStats] = useState({
        totalUsers: 0,
        completedUsers: 0,
        totalStamps: 0,
        suspiciousCount: 0,
        totalBooths: 0
    });

    // 로딩 및 인증
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

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
            fetchStats();
            initializeDateRange();
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

    // 기본 날짜 범위 설정
    const initializeDateRange = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        setDateRange({
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        });
    };

    // 통계 데이터 로드
    const fetchStats = async () => {
        setLoading(true);
        try {
            const dashboardStats = await getDashboardStats();
            const suspicious = await getSuspiciousRecords(100);
            
            setStats({
                totalUsers: dashboardStats.total_users || 0,
                completedUsers: dashboardStats.completed_users || 0,
                totalStamps: dashboardStats.total_stamps || 0,
                suspiciousCount: suspicious?.length || 0,
                totalBooths: dashboardStats.total_booths || 15
            });
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('통계 로드 실패:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // CSV 생성 헬퍼 함수
    const generateCSV = (headers, rows) => {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell ?? '';
            }).join(','))
        ].join('\n');

        return '\uFEFF' + csvContent; // BOM 추가 (한글 지원)
    };

    // 파일 다운로드 헬퍼 함수
    const downloadFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
        const blob = new Blob([content], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // 전체 사용자 목록 다운로드
    const downloadAllUsers = async () => {
        setDownloading('allUsers');
        try {
            const users = await getAllUsers();
            
            const rows = users.map(user => [
                user.student_id,
                user.name,
                user.dept_name || '-',
                user.grade || '-',
                user.phone_number || '-',
                user.stamp_count || 0,
                user.is_completed ? '완주' : '진행중',
                user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '-'
            ]);

            const headers = ['학번', '이름', '학과', '학년', '연락처', '획득 스탬프', '상태', '가입일'];
            const csv = generateCSV(headers, rows);
            
            const filename = `전체사용자목록_${dateRange.startDate}_${dateRange.endDate}.csv`;
            downloadFile(csv, filename);

            alert(`전체 사용자 목록 ${users.length}건이 다운로드되었습니다.`);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('다운로드 실패:', error);
                alert('다운로드에 실패했습니다.');
            }
        } finally {
            setDownloading(null);
        }
    };

    // 완주자 목록 다운로드
    const downloadCompletedUsers = async () => {
        setDownloading('completedUsers');
        try {
            const completers = await getCompleters();
            
            const rows = completers.map(user => [
                user.student_id,
                user.name,
                user.dept_name || '-',
                user.grade || '-',
                user.phone_number || '-',
                user.completion_time ? new Date(user.completion_time).toLocaleString('ko-KR') : '-'
            ]);

            const headers = ['학번', '이름', '학과', '학년', '연락처', '완주 시간'];
            const csv = generateCSV(headers, rows);
            
            const filename = `완주자목록_${dateRange.startDate}_${dateRange.endDate}.csv`;
            downloadFile(csv, filename);

            alert(`완주자 목록 ${completers.length}건이 다운로드되었습니다.`);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('다운로드 실패:', error);
                alert('다운로드에 실패했습니다.');
            }
        } finally {
            setDownloading(null);
        }
    };

    // 부스별 방문 통계 다운로드
    const downloadBoothStats = async () => {
        setDownloading('boothStats');
        try {
            const boothStats = await getBoothStats();
            
            const rows = boothStats.map(booth => [
                booth.booth_name,
                booth.location_name || '-',
                booth.visit_count || 0,
                booth.qr_count || 0,
                booth.pin_count || 0,
                booth.admin_count || 0,
                `${booth.visit_rate || 0}%`
            ]);

            const headers = ['부스명', '위치', '총 방문', 'QR 스캔', 'PIN 입력', '관리자 부여', '방문율'];
            const csv = generateCSV(headers, rows);
            
            const filename = `부스별방문통계_${dateRange.startDate}_${dateRange.endDate}.csv`;
            downloadFile(csv, filename);

            alert(`부스별 방문 통계 ${boothStats.length}건이 다운로드되었습니다.`);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('다운로드 실패:', error);
                alert('다운로드에 실패했습니다.');
            }
        } finally {
            setDownloading(null);
        }
    };

    // 시간대별 통계 다운로드
    const downloadTimeStats = async () => {
        setDownloading('timeStats');
        try {
            const timeStats = await getTimeStats();
            
            const rows = timeStats.map(stat => [
                stat.time,
                stat.count || 0
            ]);

            const headers = ['시간대', '스탬프 획득 수'];
            const csv = generateCSV(headers, rows);
            
            const filename = `시간대별통계_${dateRange.startDate}_${dateRange.endDate}.csv`;
            downloadFile(csv, filename);

            alert('시간대별 통계가 다운로드되었습니다.');
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('다운로드 실패:', error);
                alert('다운로드에 실패했습니다.');
            }
        } finally {
            setDownloading(null);
        }
    };

    // 의심 기록 다운로드
    const downloadSuspiciousRecords = async () => {
        setDownloading('suspicious');
        try {
            const suspicious = await getSuspiciousRecords(100);
            
            const rows = suspicious.map(record => [
                record.student_id,
                record.name,
                record.booth,
                record.time ? new Date(record.time).toLocaleString('ko-KR') : '-',
                record.reason,
                record.status || '미처리'
            ]);

            const headers = ['학번', '이름', '부스', '시간', '사유', '처리상태'];
            const csv = generateCSV(headers, rows);
            
            const filename = `의심기록_${dateRange.startDate}_${dateRange.endDate}.csv`;
            downloadFile(csv, filename);

            alert(`의심 기록 ${suspicious.length}건이 다운로드되었습니다.`);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('다운로드 실패:', error);
                alert('다운로드에 실패했습니다.');
            }
        } finally {
            setDownloading(null);
        }
    };

    // 스탬프 상세 내역 다운로드 (사용자별 스탬프)
    const downloadStampDetails = async () => {
        setDownloading('stampDetails');
        try {
            const users = await getAllUsers();
            
            // 스탬프가 있는 사용자만 필터링하고 스탬프별로 행 생성
            const rows = [];
            users.forEach(user => {
                if (user.stamps && user.stamps.length > 0) {
                    user.stamps.forEach((boothId, index) => {
                        rows.push([
                            user.student_id,
                            user.name,
                            user.dept_name || '-',
                            boothId,
                            index + 1
                        ]);
                    });
                }
            });

            const headers = ['학번', '이름', '학과', '부스 ID', '순서'];
            const csv = generateCSV(headers, rows);
            
            const filename = `스탬프상세내역_${dateRange.startDate}_${dateRange.endDate}.csv`;
            downloadFile(csv, filename);

            alert(`스탬프 상세 내역 ${rows.length}건이 다운로드되었습니다.`);
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('다운로드 실패:', error);
                alert('다운로드에 실패했습니다.');
            }
        } finally {
            setDownloading(null);
        }
    };

    // 전체 데이터 다운로드 (ZIP)
    const downloadAllData = async () => {
        setDownloading('all');
        try {
            // 순차적으로 모든 데이터 다운로드
            await downloadAllUsers();
            await downloadCompletedUsers();
            await downloadBoothStats();
            await downloadTimeStats();
            await downloadSuspiciousRecords();
            
            alert('모든 데이터가 다운로드되었습니다.');
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('전체 다운로드 실패:', error);
            }
        } finally {
            setDownloading(null);
        }
    };

    // 로그아웃
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // 다운로드 항목 정의
    const downloadItems = [
        {
            id: 'allUsers',
            icon: '👥',
            title: '전체 사용자 목록',
            description: '가입한 모든 사용자 정보',
            columns: '학번, 이름, 학과, 학년, 연락처, 스탬프, 상태',
            count: stats.totalUsers,
            unit: '명',
            action: downloadAllUsers
        },
        {
            id: 'completedUsers',
            icon: '🏆',
            title: '완주자 목록',
            description: '스탬프를 모두 모은 사용자',
            columns: '학번, 이름, 학과, 학년, 연락처, 완주시간',
            count: stats.completedUsers,
            unit: '명',
            action: downloadCompletedUsers
        },
        {
            id: 'boothStats',
            icon: '📊',
            title: '부스별 방문 통계',
            description: '각 부스의 방문 현황',
            columns: '부스명, 위치, 총방문, QR, PIN, 관리자',
            count: stats.totalBooths,
            unit: '개 부스',
            action: downloadBoothStats
        },
        {
            id: 'timeStats',
            icon: '⏰',
            title: '시간대별 통계',
            description: '시간대별 스탬프 획득 현황',
            columns: '시간대, 스탬프 획득 수',
            count: 10,
            unit: '시간대',
            action: downloadTimeStats
        },
        {
            id: 'suspicious',
            icon: '⚠️',
            title: '의심 기록',
            description: '비정상적인 스탬프 획득 기록',
            columns: '학번, 이름, 부스, 시간, 사유, 상태',
            count: stats.suspiciousCount,
            unit: '건',
            action: downloadSuspiciousRecords
        },
        {
            id: 'stampDetails',
            icon: '🎫',
            title: '스탬프 상세 내역',
            description: '사용자별 획득 스탬프 상세',
            columns: '학번, 이름, 학과, 부스ID, 순서',
            count: stats.totalStamps,
            unit: '개',
            action: downloadStampDetails
        }
    ];

    // 인증 체크 전
    if (!authChecked) {
        return (
            <div className="export-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>인증 확인 중...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="export-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>데이터 로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="export-page">
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
                    <div className="admin-nav-item" onClick={() => navigate('/admin/settings')}>
                        ⚙️ 설정
                    </div>
                    <div className="admin-nav-item active">
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
            <div className="export-content">
                {/* 페이지 헤더 */}
                <div className="page-header">
                    <div className="header-left">
                        <h1 className="page-title">📥 데이터 다운로드</h1>
                        <p className="page-subtitle">이벤트 데이터를 CSV 파일로 다운로드합니다</p>
                    </div>
                    <button 
                        className="download-all-btn"
                        onClick={downloadAllData}
                        disabled={downloading !== null}
                    >
                        {downloading === 'all' ? '⏳ 다운로드 중...' : '📦 전체 다운로드'}
                    </button>
                </div>

                {/* 날짜 범위 선택 */}
                <div className="date-range-card">
                    <div className="date-range-header">
                        <h2 className="date-range-title">📅 다운로드 기간 설정</h2>
                    </div>
                    <div className="date-range-content">
                        <div className="date-input-group">
                            <label className="date-label">시작일</label>
                            <input
                                type="date"
                                className="date-input"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({
                                    ...dateRange,
                                    startDate: e.target.value
                                })}
                            />
                        </div>
                        <span className="date-separator">~</span>
                        <div className="date-input-group">
                            <label className="date-label">종료일</label>
                            <input
                                type="date"
                                className="date-input"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({
                                    ...dateRange,
                                    endDate: e.target.value
                                })}
                            />
                        </div>
                        <div className="quick-date-btns">
                            <button 
                                className="quick-btn"
                                onClick={() => {
                                    const today = new Date();
                                    setDateRange({
                                        startDate: today.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                            >
                                오늘
                            </button>
                            <button 
                                className="quick-btn"
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date();
                                    weekAgo.setDate(today.getDate() - 7);
                                    setDateRange({
                                        startDate: weekAgo.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                            >
                                최근 7일
                            </button>
                            <button 
                                className="quick-btn"
                                onClick={() => {
                                    const today = new Date();
                                    const monthAgo = new Date();
                                    monthAgo.setDate(today.getDate() - 30);
                                    setDateRange({
                                        startDate: monthAgo.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                            >
                                최근 30일
                            </button>
                            <button 
                                className="quick-btn"
                                onClick={() => {
                                    setDateRange({
                                        startDate: '2025-01-01',
                                        endDate: new Date().toISOString().split('T')[0]
                                    });
                                }}
                            >
                                전체 기간
                            </button>
                        </div>
                    </div>
                </div>

                {/* 다운로드 항목 그리드 */}
                <div className="download-grid">
                    {downloadItems.map(item => (
                        <div key={item.id} className="download-card">
                            <div className="download-card-header">
                                <span className="download-icon">{item.icon}</span>
                                <div className="download-info">
                                    <h3 className="download-title">{item.title}</h3>
                                    <p className="download-desc">{item.description}</p>
                                </div>
                            </div>
                            <div className="download-card-body">
                                <div className="download-columns">
                                    <span className="columns-label">포함 항목:</span>
                                    <span className="columns-value">{item.columns}</span>
                                </div>
                                <div className="download-count">
                                    <span className="count-value">{item.count.toLocaleString()}</span>
                                    <span className="count-unit">{item.unit}</span>
                                </div>
                            </div>
                            <div className="download-card-footer">
                                <button 
                                    className="download-btn csv"
                                    onClick={item.action}
                                    disabled={downloading !== null}
                                >
                                    {downloading === item.id ? (
                                        <>⏳ 다운로드 중...</>
                                    ) : (
                                        <>📄 CSV 다운로드</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 안내 사항 */}
                <div className="export-notice">
                    <h3 className="notice-title">💡 안내 사항</h3>
                    <ul className="notice-list">
                        <li>CSV 파일은 Microsoft Excel, Google Sheets 등에서 열 수 있습니다.</li>
                        <li>한글이 깨지는 경우, 파일을 UTF-8 인코딩으로 다시 열어주세요.</li>
                        <li>대량의 데이터는 다운로드에 시간이 걸릴 수 있습니다.</li>
                        <li>개인정보가 포함된 데이터는 안전하게 관리해주세요.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DataExport;