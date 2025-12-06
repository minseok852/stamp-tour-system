// src/pages/admin/QRManage.jsx
// QR코드 생성/수정/다운로드 관리 화면 - URL 기반 QR 생성
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { getBooths, createBooth, deleteBooth } from '../../services/adminApi';
import { logout, getCurrentUser } from '../../services/authApi';
import '../../styles/QRManage.css'; 

const QRManage = () => {
  const navigate = useNavigate();
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const canvasRef = useRef(null);

  const [newBooth, setNewBooth] = useState({
    booth_name: '',
    location_name: '',
    latitude: '',
    longitude: '',
    qr_code: '',
    qr_pin: '',
    icon: '🏛️',
    event_id: 1
  });

  // ⭐ 프론트엔드 도메인 (자동으로 현재 도메인 사용)
  const FRONTEND_URL = window.location.origin;

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
      fetchBooths();
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

  // 부스 목록 불러오기
  const fetchBooths = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooths();
      setBooths(data);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('부스 데이터 로딩 실패:', error);
        setError('부스 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ⭐ QR 코드 생성 (URL 포함)
  const generateQRCode = async (boothData) => {
    try {
      const canvas = canvasRef.current;
      
      // ⭐ 스탬프 수집 URL 생성
      const stampUrl = `${FRONTEND_URL}/stamp/collect?booth_id=${boothData.booth_id}&qr_code=${encodeURIComponent(boothData.qr_code || `BOOTH_${String(boothData.booth_id).padStart(2, '0')}`)}`;
      
      console.log('생성된 QR URL:', stampUrl); // 디버그용
      
      await QRCode.toCanvas(canvas, stampUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0D4E8C',
          light: '#FFFFFF'
        }
      });

      // Data URL로 변환
      const url = canvas.toDataURL('image/png');
      setQrCodeUrl(url);
      setSelectedBooth({
        ...boothData,
        generatedUrl: stampUrl // URL도 저장
      });
    } catch (error) {
      console.error('QR 코드 생성 실패:', error);
      alert('QR 코드 생성에 실패했습니다.');
    }
  };

  // QR 코드 다운로드
  const downloadQRCode = (booth) => {
    if (!qrCodeUrl) {
      alert('먼저 QR 코드를 생성해주세요.');
      return;
    }
    const link = document.createElement('a');
    link.download = `QR_${booth.booth_name}_${booth.qr_code || booth.booth_id}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  // 전체 QR 코드 다운로드
  const downloadAllQRCodes = async () => {
    for (const booth of booths) {
      await generateQRCode(booth);
      await new Promise(resolve => setTimeout(resolve, 500));
      downloadQRCode(booth);
    }
    alert('모든 QR 코드 다운로드가 완료되었습니다!');
  };

  // 새 부스 생성
  const handleCreateBooth = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // 위도/경도를 숫자로 변환
      const boothData = {
        ...newBooth,
        latitude: parseFloat(newBooth.latitude),
        longitude: parseFloat(newBooth.longitude)
      };

      await createBooth(boothData);
      
      alert(`${newBooth.booth_name} 부스가 생성되었습니다!`);
      
      // 폼 초기화 및 닫기
      setNewBooth({
        booth_name: '',
        location_name: '',
        latitude: '',
        longitude: '',
        qr_code: '',
        qr_pin: '',
        icon: '🏛️',
        event_id: 1
      });
      setShowCreateModal(false);
      
      // 목록 새로고침
      fetchBooths();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('부스 생성 실패:', error);
        setError(error.detail || '부스 생성 중 오류가 발생했습니다.');
        alert(error.detail || '부스 생성 중 오류가 발생했습니다.');
      }
    }
  };

  // 부스 삭제
  const handleDeleteBooth = async (booth) => {
    if (!window.confirm(`정말로 '${booth.booth_name}' 부스를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteBooth(booth.booth_id);
      alert(`${booth.booth_name} 부스가 삭제되었습니다!`);
      fetchBooths();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('부스 삭제 실패:', error);
        setError(error.detail || '부스 삭제 중 오류가 발생했습니다.');
        alert(error.detail || '부스 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 로그아웃
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const iconOptions = ['🏛️', '🎓', '🏢', '📖', '🛡️', '🔬', '🏫', '⚽', '🏠', '📚', '📢', '✈️', '💡', '💻'];

  // 인증 체크 전
  if (!authChecked) {
    return (
      <div className="qr-manage-page">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="qr-manage-page">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-manage-page">
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
          <div className="admin-nav-item active">
            📱 QR 관리
          </div>
          <div className="admin-nav-item" onClick={() => navigate('/admin/users')}>
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
      <div className="qr-manage-container">
        {/* Error Message */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="qr-manage-header">
          <div className="header-left">
            <h1 className="page-title">📱 QR 코드 관리</h1>
            <p className="page-subtitle">부스별 QR 코드 생성 및 다운로드 (스캔 시 자동으로 스탬프 페이지로 이동)</p>
          </div>
          <div className="header-right">
            <button className="create-booth-button" onClick={() => setShowCreateModal(true)}>
              ➕ 새 부스 추가
            </button>
            <button className="download-all-button" onClick={downloadAllQRCodes}>
              📥 전체 다운로드
            </button>
          </div>
        </div>

        {/* QR Code Grid */}
        <div className="qr-grid">
          {booths.map(booth => (
            <div key={booth.booth_id} className="qr-card">
              <div className="qr-card-header">
                <div className="booth-icon">{booth.icon || '📍'}</div>
                <div className="booth-info">
                  <h3 className="booth-name">{booth.booth_name}</h3>
                  <p className="booth-building">{booth.location_name || '-'}</p>
                </div>
              </div>

              <div className="qr-preview" onClick={() => generateQRCode(booth)}>
                <div className="qr-placeholder">
                  <span className="qr-icon">📱</span>
                  <p>클릭하여 QR 생성</p>
                </div>
              </div>

              <div className="qr-info">
                <div className="info-item">
                  <span className="info-label">QR 코드</span>
                  <span className="info-value">{booth.qr_code || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">위치</span>
                  <span className="info-value">
                    {booth.latitude ? `${parseFloat(booth.latitude).toFixed(4)}, ${parseFloat(booth.longitude).toFixed(4)}` : '-'}
                  </span>
                </div>
              </div>

              <div className="qr-actions">
                <button 
                  className="action-button generate"
                  onClick={() => generateQRCode(booth)}
                >
                  🔄 생성
                </button>
                <button 
                  className="action-button download"
                  onClick={async () => {
                    await generateQRCode(booth);
                    setTimeout(() => downloadQRCode(booth), 300);
                  }}
                >
                  📥 다운로드
                </button>
                <button 
                  className="action-button delete"
                  onClick={() => handleDeleteBooth(booth)}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* QR Preview Modal */}
        {selectedBooth && qrCodeUrl && (
          <div className="qr-preview-modal" onClick={() => setSelectedBooth(null)}>
            <div className="qr-preview-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedBooth(null)}>×</button>
              
              <h2 className="preview-title">{selectedBooth.icon || '📍'} {selectedBooth.booth_name}</h2>
              <p className="preview-subtitle">{selectedBooth.location_name || '-'}</p>

              <div className="qr-preview-image">
                <img src={qrCodeUrl} alt={`QR Code for ${selectedBooth.booth_name}`} />
              </div>

              <div className="preview-info">
                <div className="preview-info-item">
                  <strong>QR 코드:</strong> {selectedBooth.qr_code || '-'}
                </div>
                <div className="preview-info-item">
                  <strong>위치:</strong> {selectedBooth.latitude}, {selectedBooth.longitude}
                </div>
                {selectedBooth.generatedUrl && (
                  <div className="preview-info-item url-info">
                    <strong>스캔 URL:</strong>
                    <span className="url-text">{selectedBooth.generatedUrl}</span>
                  </div>
                )}
              </div>

              <button 
                className="download-button-large"
                onClick={() => downloadQRCode(selectedBooth)}
              >
                📥 다운로드
              </button>
            </div>
          </div>
        )}

        {/* Create Booth Modal */}
        {showCreateModal && (
          <div className="create-booth-modal" onClick={() => setShowCreateModal(false)}>
            <div className="create-booth-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setShowCreateModal(false)}>×</button>
              
              <h2 className="modal-title">➕ 새 부스 추가</h2>
              
              <form className="create-booth-form" onSubmit={handleCreateBooth}>
                <div className="form-group">
                  <label className="form-label">부스 이름 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 교육관"
                    value={newBooth.booth_name}
                    onChange={(e) => setNewBooth({...newBooth, booth_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">건물명</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 국제교육관(5층)"
                    value={newBooth.location_name}
                    onChange={(e) => setNewBooth({...newBooth, location_name: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">위도 (Latitude) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-input"
                      placeholder="37.631300"
                      value={newBooth.latitude}
                      onChange={(e) => setNewBooth({...newBooth, latitude: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">경도 (Longitude) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-input"
                      placeholder="127.253300"
                      value={newBooth.longitude}
                      onChange={(e) => setNewBooth({...newBooth, longitude: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">QR 코드 값 *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: BOOTH_01"
                    value={newBooth.qr_code}
                    onChange={(e) => setNewBooth({...newBooth, qr_code: e.target.value})}
                    required
                  />
                  <p className="form-hint">고유한 값이어야 합니다 (예: BOOTH_01, BOOTH_02...)</p>
                </div>

                <div className="form-group">
                  <label className="form-label">관리자 PIN *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="QR 오류 시 사용할 PIN (4자리 이상)"
                    value={newBooth.qr_pin}
                    onChange={(e) => setNewBooth({...newBooth, qr_pin: e.target.value})}
                    required
                    minLength={4}
                  />
                  <p className="form-hint">QR 스캔 오류 시 학생이 수동 입력할 PIN</p>
                </div>

                <div className="form-group">
                  <label className="form-label">아이콘</label>
                  <div className="icon-selector">
                    {iconOptions.map(icon => (
                      <div
                        key={icon}
                        className={`icon-option ${newBooth.icon === icon ? 'selected' : ''}`}
                        onClick={() => setNewBooth({...newBooth, icon})}
                      >
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="submit-button">
                  부스 생성하기
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Hidden Canvas for QR Generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>
    </div>
  );
};

export default QRManage;