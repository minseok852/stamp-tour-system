// src/pages/admin/Dashboard.jsx
// 관리자 대시보드 - 백엔드 연동 버전
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
//import KakaoMap from '../../components/KakaoMap';
import { getAllBooths } from '../../services/boothApi';
import { getDashboardStats, getCollectionStats, getSuspiciousRecords } from '../../services/adminApi';
import { logout } from '../../services/authApi';
import '../../styles/Dashboard.css';
import GoogleMap from '../../components/GoogleMap';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // 통계 데이터
    const [stats, setStats] = useState({
        totalUsers: 0,
        completedUsers: 0,
        totalStamps: 0,
        activeUsers: 0
    });

    // 부스 데이터 (지도용)
    const [booths, setBooths] = useState([]);
    const [congestionData, setCongestionData] = useState({});
    
    // QR/PIN 수집 비율
    const [collectionStats, setCollectionStats] = useState({
        qr: 0,
        pin: 0,
        admin: 0
    });

    // 의심 기록
    const [suspiciousRecords, setSuspiciousRecords] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('dashboard');

    // 데이터 로드
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. 부스 데이터 로드
            const boothsData = await getAllBooths();
            
            // ✅ Google Maps 좌표 보정 데이터
            const coordinateAdjustment = {
                1: { lat: 37.869844, lng:127.157538 },      // 국제교육팀
                2: { lat: 37.870253, lng:127.156728 },      // 교직과
                3: { lat: 37.871789, lng:127.156392 },      // 글쓰기센터
                4: { lat: 37.871736, lng:127.156301 },      // 인성교육팀
                5: { lat: 37.871996, lng:127.156604 },      // 교양교육팀
                6: { lat: 37.871156, lng: 127.155291 },      // 학생복지팀
                7: { lat: 37.8710, lng: 127.1551 },      // 장애학생지원센터
                8: { lat: 37.8729, lng: 127.1559 },      // 취업팀
                9: { lat: 37.8731, lng: 127.1557 },      // 학생생활상담센터
                10:{ lat: 37.8733, lng: 127.1546 },     // 교수학습지원센터
                11:{ lat: 37.8733, lng: 127.1546 },     // 학생성공팀
                12: { lat: 37.8733, lng: 127.1546 },     // 원격교육지원센터
                13: { lat: 37.8733, lng: 127.1548 },     // 학술정보팀
                14: { lat: 37.874424, lng: 127.155954 },     // 공학교육혁신센터
                15: { lat: 37.874543, lng: 127.156049 }      // IT융합지식재산교육센터
            };
            
            const formattedBooths = boothsData.map(booth => {
                let lat = parseFloat(booth.latitude);
                let lng = parseFloat(booth.longitude);
                
                // ✅ 보정이 있으면 적용
                if (coordinateAdjustment[booth.booth_id]) {
                    lat = coordinateAdjustment[booth.booth_id].lat;
                    lng = coordinateAdjustment[booth.booth_id].lng;
                }
                
                return {
                    id: booth.booth_id,
                    name: booth.booth_name,
                    building: booth.location_name,
                    lat: lat,
                    lng: lng,
                    icon: booth.icon || '📍'
                };
            });
            setBooths(formattedBooths);

            // 2. 혼잡도 데이터 로드
            try {
                const congestionResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/congestion`);
                if (congestionResponse.ok) {
                    const congestion = await congestionResponse.json();
                    setCongestionData(congestion);
                }
            } catch (e) {
                // 혼잡도 API 실패 시 0으로 초기화
                const initialCongestion = {};
                formattedBooths.forEach(b => {
                    initialCongestion[b.id] = 0;
                });
                setCongestionData(initialCongestion);
            }

            // 3. 대시보드 통계 로드
            try {
                const statsData = await getDashboardStats();
                setStats({
                    totalUsers: statsData.total_users || 0,
                    completedUsers: statsData.completed_users || 0,
                    totalStamps: statsData.total_stamps || 0,
                    activeUsers: statsData.active_users || 0
                });
            } catch (e) {
                console.error('통계 로드 실패:', e);
            }

            // 4. QR/PIN 수집 비율 로드
            try {
                const collectionData = await getCollectionStats();
                setCollectionStats({
                    qr: collectionData.qr || 0,
                    pin: collectionData.pin || 0,
                    admin: collectionData.admin || 0
                });
            } catch (e) {
                console.error('수집 비율 로드 실패:', e);
            }

            // 5. 의심 기록 로드
            try {
                const suspiciousData = await getSuspiciousRecords(20);
                setSuspiciousRecords(suspiciousData || []);
            } catch (e) {
                console.error('의심 기록 로드 실패:', e);
                setSuspiciousRecords([]);
            }

        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // ⭐ 혼잡도 180초(3분)마다 갱신 - 백엔드와 동기화
    useEffect(() => {
        if (booths.length === 0) return;
        
        // ⭐ 페이지 visibility 체크 추가
        const fetchCongestion = async () => {
            // 페이지가 보이지 않으면 스킵
            if (document.hidden) return;
            
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'}/congestion`);
                if (response.ok) {
                    const data = await response.json();
                    setCongestionData(data);
                }
            } catch (e) {
                // 무시
            }
        };
        
        // ⭐ 30초 → 180초 (3분)으로 변경
        const interval = setInterval(fetchCongestion, 180000);

        return () => clearInterval(interval);
    }, [booths.length]);

    // 로그아웃
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // 홈으로
    const handleGoHome = () => {
        navigate('/');
    };
    // 상세 보기
    const handleViewSuspicious = (record) => {
        const message = `
📋 의심 기록 상세
━━━━━━━━━━━━━━━━━━━━━━━━━━
학번: ${record.student_id}
이름: ${record.name}
부스: ${record.booth}
시간: ${new Date(record.time).toLocaleString('ko-KR')}
사유: ${record.reason}
상태: ${record.status}
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        alert(message);
    };

    // 무시하기
    const handleDismissSuspicious = (record) => {
        const confirmed = window.confirm(
            `"${record.name}" 학생(${record.student_id})의 의심 기록을 무시하시겠습니까?\n\n사유: ${record.reason}`
        );
        
        if (!confirmed) return;
        
        setSuspiciousRecords(prev => 
            prev.filter(r => r.id !== record.id)
        );
        
        alert(`${record.name} 학생의 의심 기록이 처리되었습니다.`);
    };

    // 수집 비율 차트 데이터
    const collectionChartData = [
        { name: 'QR 스캔', value: collectionStats.qr, color: '#0D4E8C' },
        { name: 'PIN 입력', value: collectionStats.pin, color: '#F6AD55' },
        { name: '관리자 부여', value: collectionStats.admin, color: '#E53E3E' }
    ];

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
        <div className="admin-dashboard">
            {/* 상단 네비게이션 */}
            <nav className="admin-nav">
                <div className="admin-nav-left">
                    <div className="admin-logo">
                        <span className="admin-logo-icon">🎓</span>
                        <span className="admin-logo-text">대진대 스탬프 투어 관리자</span>
                    </div>
                </div>
                <div className="admin-nav-menu">
                    <div 
                        className={`admin-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('dashboard')}
                    >
                        📊 대시보드
                    </div>
                    <div 
                        className={`admin-nav-item ${activeMenu === 'qr' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/qr-manage')}
                    >
                        📱 QR 관리
                    </div>
                    <div 
                        className={`admin-nav-item ${activeMenu === 'users' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/users')}
                    >
                        👥 사용자 관리
                    </div>
                    <div 
                        className={`admin-nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/settings')}
                    >
                        ⚙️ 설정
                    </div>
                    <div 
                        className={`admin-nav-item ${activeMenu === 'export' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/export')}
                    >
                        📥 데이터
                    </div>
                </div>
                <div className="admin-nav-right">
                    <button className="admin-nav-btn home" onClick={handleGoHome}>
                        🏠 홈으로
                    </button>
                    <button className="admin-nav-btn logout" onClick={handleLogout}>
                        🚪 로그아웃
                    </button>
                </div>
            </nav>

            {/* 메인 컨텐츠 */}
            <div className="admin-content">
                {/* 페이지 헤더 */}
                <div className="admin-header">
                    <h1 className="admin-title">📊 실시간 대시보드</h1>
                    <p className="admin-subtitle">스탬프 투어 현황을 한눈에 확인하세요</p>
                    <button className="refresh-btn" onClick={fetchAllData}>
                        🔄 새로고침
                    </button>
                </div>

                {/* 상단: 통계 카드 */}
                <div className="stats-grid">
                    <div className="stat-card blue">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <div className="stat-label">총 참여자</div>
                            <div className="stat-value">{stats.totalUsers}명</div>
                        </div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-info">
                            <div className="stat-label">완주자</div>
                            <div className="stat-value">{stats.completedUsers}명</div>
                            <div className="stat-sub">
                                ({stats.totalUsers > 0 ? Math.round((stats.completedUsers / stats.totalUsers) * 100) : 0}%)
                            </div>
                        </div>
                    </div>
                    <div className="stat-card purple">
                        <div className="stat-icon">🎫</div>
                        <div className="stat-info">
                            <div className="stat-label">총 스탬프</div>
                            <div className="stat-value">{stats.totalStamps}개</div>
                            <div className="stat-sub">
                                (평균 {stats.totalUsers > 0 ? (stats.totalStamps / stats.totalUsers).toFixed(1) : 0}개/인)
                            </div>
                        </div>
                    </div>
                    <div className="stat-card orange">
                        <div className="stat-icon">⚡</div>
                        <div className="stat-info">
                            <div className="stat-label">현재 활동 중</div>
                            <div className="stat-value">{stats.activeUsers}명</div>
                            <div className="stat-sub">실시간</div>
                        </div>
                    </div>
                </div>

                {/* 중단 1: 실시간 혼잡도 */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">🗺️ 실시간 부스 혼잡도</h2>
                        <div className="congestion-legend">
                            <span className="legend-item">
                                <span className="legend-dot green"></span> 여유 (0~5명)
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot orange"></span> 보통 (6~15명)
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot red"></span> 혼잡 (16명+)
                            </span>
                        </div>
                    </div>
                    <div className="map-container">
                        <GoogleMap
                            markers={booths.map(booth => ({
                                id: booth.id,
                                name: booth.name,
                                lat: booth.lat,
                                lng: booth.lng,
                                icon: booth.icon,
                                congestion: congestionData[booth.id] || 0
                            }))}
                            showCongestion={true}
                            height="400px"
                            showCurrentLocation={false}
                        />
                    </div>
                    {/* 혼잡도 상세 리스트 */}
                    <div className="congestion-list">
                        {booths.map(booth => {
                            const count = congestionData[booth.id] || 0;
                            const level = count <= 5 ? 'low' : count <= 15 ? 'medium' : 'high';
                            const label = count <= 5 ? '여유' : count <= 15 ? '보통' : '혼잡';
                            return (
                                <div key={booth.id} className={`congestion-item ${level}`}>
                                    <span className="booth-icon">{booth.icon}</span>
                                    <span className="booth-name">{booth.name}</span>
                                    <span className={`congestion-badge ${level}`}>
                                        {count}명 · {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 중단 2: QR/PIN 수집 비율 */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">📈 스탬프 수집 방법 비율</h2>
                    </div>
                    <div className="collection-stats">
                        <div className="collection-chart">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={collectionChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {collectionChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="collection-bars">
                            <div className="collection-bar-item">
                                <div className="bar-label">
                                    <span className="bar-icon">📱</span>
                                    <span>QR 스캔</span>
                                    <span className="bar-value">{collectionStats.qr}%</span>
                                </div>
                                <div className="bar-track">
                                    <div 
                                        className="bar-fill qr" 
                                        style={{ width: `${collectionStats.qr}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="collection-bar-item">
                                <div className="bar-label">
                                    <span className="bar-icon">🔢</span>
                                    <span>PIN 입력</span>
                                    <span className="bar-value">{collectionStats.pin}%</span>
                                </div>
                                <div className="bar-track">
                                    <div 
                                        className="bar-fill pin" 
                                        style={{ width: `${collectionStats.pin}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="collection-bar-item">
                                <div className="bar-label">
                                    <span className="bar-icon">👨‍💼</span>
                                    <span>관리자 부여</span>
                                    <span className="bar-value">{collectionStats.admin}%</span>
                                </div>
                                <div className="bar-track">
                                    <div 
                                        className="bar-fill admin" 
                                        style={{ width: `${collectionStats.admin}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단: 의심 기록 */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">⚠️ 의심 기록</h2>
                        <span className="record-count">{suspiciousRecords.length}건</span>
                    </div>
                    {suspiciousRecords.length > 0 ? (
                        <div className="suspicious-table-wrapper">
                            <table className="suspicious-table">
                                <thead>
                                    <tr>
                                        <th>학번</th>
                                        <th>이름</th>
                                        <th>부스</th>
                                        <th>시간</th>
                                        <th>사유</th>
                                        <th>조치</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suspiciousRecords.map(record => (
                                        <tr key={record.id}>
                                            <td className="student-id">{record.student_id}</td>
                                            <td className="name">{record.name}</td>
                                            <td className="booth">{record.booth}</td>
                                            <td className="time">{record.time ? new Date(record.time).toLocaleString('ko-KR') : '-'}</td>
                                            <td className="reason">
                                                <span className="reason-badge">{record.reason}</span>
                                            </td>
                                            <td className="action">
                                                <button className="action-btn view"
                                                onClick={() => handleViewSuspicious(record)}>상세</button>
                                                <button className="action-btn dismiss"
                                                onClick={() => handleDismissSuspicious(record)}>무시</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-records">
                            <span className="no-records-icon">✅</span>
                            <p>의심 기록이 없습니다</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;