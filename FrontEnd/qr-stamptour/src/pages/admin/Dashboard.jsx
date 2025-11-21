// 행사 데이터 대시보드 (차트 포함)
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/Dashboard.css'; 

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    completedUsers: 0,
    totalStamps: 0,
    activeUsers: 0
  });

  const [boothStats, setBoothStats] = useState([]);
  const [timeStats, setTimeStats] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: 실제 API 호출
      // const response = await adminApi.getDashboardStats();
      
      // 더미 데이터
      setStats({
        totalUsers: 156,
        completedUsers: 42,
        totalStamps: 1248,
        activeUsers: 89
      });

      setBoothStats([
        { name: '교육관', visits: 145, completion: 95 },
        { name: '대학원', visits: 132, completion: 87 },
        { name: '산학관', visits: 128, completion: 83 },
        { name: '인문관', visits: 142, completion: 91 },
        { name: '안보관', visits: 118, completion: 76 },
        { name: '화생관', visits: 135, completion: 88 },
        { name: '학생관', visits: 139, completion: 90 },
        { name: '정보관', visits: 125, completion: 81 },
        { name: '생활관', visits: 108, completion: 70 },
        { name: '응급실', visits: 148, completion: 96 },
        { name: '수련관', visits: 122, completion: 79 },
        { name: '호연관', visits: 130, completion: 84 },
        { name: '교양관', visits: 127, completion: 82 },
        { name: '공학관', visits: 134, completion: 87 }
      ]);

      setTimeStats([
        { time: '09:00', users: 12 },
        { time: '10:00', users: 28 },
        { time: '11:00', users: 45 },
        { time: '12:00', users: 62 },
        { time: '13:00', users: 58 },
        { time: '14:00', users: 71 },
        { time: '15:00', users: 89 },
        { time: '16:00', users: 76 },
        { time: '17:00', users: 54 },
        { time: '18:00', users: 32 }
      ]);

      setRecentUsers([
        { id: 1, name: '홍길동', studentId: '20221563', stamps: 14, completedAt: '2024-11-16 15:32' },
        { id: 2, name: '김철수', studentId: '20221564', stamps: 14, completedAt: '2024-11-16 15:28' },
        { id: 3, name: '이영희', studentId: '20221565', stamps: 12, completedAt: null },
        { id: 4, name: '박민수', studentId: '20221566', stamps: 10, completedAt: null },
        { id: 5, name: '정수진', studentId: '20221567', stamps: 14, completedAt: '2024-11-16 15:15' }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      // TODO: 실제 API 호출
      // const response = await adminApi.exportData();
      
      alert('CSV 다운로드 기능은 개발 중입니다.');
    } catch (error) {
      console.error('CSV 내보내기 실패:', error);
    }
  };

  const COLORS = ['#0D4E8C', '#1A6BB5', '#4FC3F7', '#81D4FA'];

  const completionData = [
    { name: '완주', value: stats.completedUsers },
    { name: '진행중', value: stats.totalUsers - stats.completedUsers }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">📊 행사 데이터 대시보드</h1>
          <p className="dashboard-subtitle">실시간 스탬프 투어 현황</p>
        </div>
        <div className="header-right">
          <button className="refresh-button" onClick={fetchDashboardData}>
            🔄 새로고침
          </button>
          <button className="export-button" onClick={exportToCSV}>
            📥 CSV 다운로드
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-content">
            <div className="stat-label">총 참여자</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-change positive">+12 (오늘)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">🏆</div>
          <div className="stat-content">
            <div className="stat-label">완주자</div>
            <div className="stat-value">{stats.completedUsers}</div>
            <div className="stat-change positive">
              +5 (오늘) · {Math.round((stats.completedUsers / stats.totalUsers) * 100)}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">🎫</div>
          <div className="stat-content">
            <div className="stat-label">총 스탬프 수집</div>
            <div className="stat-value">{stats.totalStamps}</div>
            <div className="stat-change positive">
              평균 {(stats.totalStamps / stats.totalUsers).toFixed(1)}개/인
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">⚡</div>
          <div className="stat-content">
            <div className="stat-label">현재 활동 중</div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-change">실시간</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* 시간대별 방문자 수 */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">📈 시간대별 방문자 수</h3>
            <span className="chart-badge">오늘</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #0D4E8C',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#0D4E8C" 
                strokeWidth={3}
                name="방문자 수"
                dot={{ fill: '#0D4E8C', r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 부스별 방문 통계 */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h3 className="chart-title">🏢 부스별 방문 통계</h3>
            <span className="chart-badge">전체 기간</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={boothStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #0D4E8C',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="visits" fill="#0D4E8C" name="방문 횟수" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completion" fill="#4FC3F7" name="완료율 (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 완주율 */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">🎯 완주율</h3>
            <span className="chart-badge">현재</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="table-card">
        <div className="table-header">
          <h3 className="table-title">👥 최근 활동 사용자</h3>
          <button className="view-all-button">전체 보기 →</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>학번</th>
                <th>획득 스탬프</th>
                <th>상태</th>
                <th>완주 시간</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id}>
                  <td className="user-name">{user.name}</td>
                  <td className="student-id">{user.studentId}</td>
                  <td>
                    <div className="stamp-progress">
                      <span className={user.stamps === 14 ? 'complete' : ''}>
                        {user.stamps}/14
                      </span>
                      <div className="mini-progress-bar">
                        <div 
                          className="mini-progress-fill"
                          style={{ width: `${(user.stamps / 14) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.stamps === 14 ? 'completed' : 'in-progress'}`}>
                      {user.stamps === 14 ? '✓ 완주' : '진행중'}
                    </span>
                  </td>
                  <td className="completed-time">
                    {user.completedAt || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Booths */}
      <div className="top-booths-card">
        <h3 className="card-title">🔥 인기 부스 TOP 5</h3>
        <div className="top-booths-list">
          {boothStats
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5)
            .map((booth, index) => (
              <div key={booth.name} className="top-booth-item">
                <div className="booth-rank">{index + 1}</div>
                <div className="booth-info">
                  <div className="booth-name">{booth.name}</div>
                  <div className="booth-visits">{booth.visits}회 방문</div>
                </div>
                <div className="booth-completion">{booth.completion}%</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;