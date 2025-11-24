// src/pages/admin/QRManage.jsx
// QR코드 생성/수정/다운로드 관리 화면 (백엔드 연동 버전)
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { getBooths, createBooth, deleteBooth } from '../../services/adminApi';
import '../../styles/QRManage.css'; 

const QRManage = () => {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // 부스 목록 불러오기
  useEffect(() => {
    fetchBooths();
  }, []);

  const fetchBooths = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooths();
      setBooths(data);
    } catch (error) {
      console.error('부스 데이터 로딩 실패:', error);
      setError('부스 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // QR 코드 생성
  const generateQRCode = async (boothData) => {
    try {
      const canvas = canvasRef.current;
      
      // QR 코드 생성 (qr_code 값 사용)
      await QRCode.toCanvas(canvas, boothData.qr_code || `BOOTH_${boothData.booth_id}`, {
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
      setSelectedBooth(boothData);
    } catch (error) {
      console.error('QR 코드 생성 실패:', error);
      alert('QR 코드 생성에 실패했습니다.');
    }
  };

  // QR 코드 다운로드
  const downloadQRCode = (booth) => {
    const link = document.createElement('a');
    link.download = `QR_${booth.booth_name}_${booth.qr_code}.png`;
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
      console.error('부스 생성 실패:', error);
      setError(error.detail || '부스 생성 중 오류가 발생했습니다.');
      alert(error.detail || '부스 생성 중 오류가 발생했습니다.');
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
      fetchBooths(); // 목록 새로고침
    } catch (error) {
      console.error('부스 삭제 실패:', error);
      setError(error.detail || '부스 삭제 중 오류가 발생했습니다.');
      alert(error.detail || '부스 삭제 중 오류가 발생했습니다.');
    }
  };

  const iconOptions = ['🏛️', '🎓', '🏢', '📖', '🛡️', '🔬', '🏫', '⚽', '🏠', '📚', '🔢', '✈️', '💡', '💻'];

  // 로딩 상태
  if (loading) {
    return (
      <div className="qr-manage-container">
        <div className="loading-message">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
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
          <p className="page-subtitle">부스별 QR 코드 생성 및 다운로드</p>
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
                <span className="info-value">{booth.latitude}, {booth.longitude}</span>
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
                onClick={() => {
                  generateQRCode(booth).then(() => downloadQRCode(booth));
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
                <label className="form-label">QR 코드 값</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: BOOTH_01"
                  value={newBooth.qr_code}
                  onChange={(e) => setNewBooth({...newBooth, qr_code: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">관리자 PIN</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="QR 오류 시 사용할 PIN"
                  value={newBooth.qr_pin}
                  onChange={(e) => setNewBooth({...newBooth, qr_pin: e.target.value})}
                />
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
  );
};

export default QRManage;