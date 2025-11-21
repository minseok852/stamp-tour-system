//QR코드 생성/수정/다운로드 관리 화면
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import '../../styles/QRManage.css'; 

const QRManage = () => {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef(null);

  const [newBooth, setNewBooth] = useState({
    name: '',
    building: '',
    latitude: '',
    longitude: '',
    icon: '🏛️'
  });

  useEffect(() => {
    fetchBooths();
  }, []);

  const fetchBooths = async () => {
    try {
      // TODO: 실제 API 호출
      // const response = await adminApi.getBooths();
      
      // 더미 데이터
      setBooths([
        { id: 1, name: '교육관', building: '국제교육관(5층)', lat: 37.6313, lng: 127.2533, icon: '🏛️', qrCode: 'BOOTH_01' },
        { id: 2, name: '대학원', building: '교육대학원(207호)', lat: 37.6318, lng: 127.2538, icon: '🎓', qrCode: 'BOOTH_02' },
        { id: 3, name: '산학관', building: '글로컬산학관(109호)', lat: 37.6308, lng: 127.2528, icon: '🏢', qrCode: 'BOOTH_03' },
        { id: 4, name: '인문관', building: '인문과학관(101호)', lat: 37.6315, lng: 127.2542, icon: '📖', qrCode: 'BOOTH_04' },
        { id: 5, name: '안보관', building: '국방과학관(101호)', lat: 37.6310, lng: 127.2525, icon: '🛡️', qrCode: 'BOOTH_05' },
        { id: 6, name: '화생관', building: '학생과학관(139호)', lat: 37.6320, lng: 127.2545, icon: '🔬', qrCode: 'BOOTH_06' },
        { id: 7, name: '학생관', building: '정해문화장1층(319호)', lat: 37.6312, lng: 127.2535, icon: '🏫', qrCode: 'BOOTH_07' },
        { id: 8, name: '정보관', building: '체육정보관(103호)', lat: 37.6305, lng: 127.2530, icon: '⚽', qrCode: 'BOOTH_08' },
        { id: 9, name: '생활관', building: '학생생활관(442호)', lat: 37.6322, lng: 127.2548, icon: '🏠', qrCode: 'BOOTH_09' },
        { id: 10, name: '응급실', building: '중앙도서관(102호)', lat: 37.6316, lng: 127.2540, icon: '📚', qrCode: 'BOOTH_10' },
        { id: 11, name: '수련관', building: '수학과학관(102호)', lat: 37.6307, lng: 127.2532, icon: '🔢', qrCode: 'BOOTH_11' },
        { id: 12, name: '호연관', building: '관광고석호연관(102호)', lat: 37.6311, lng: 127.2537, icon: '✈️', qrCode: 'BOOTH_12' },
        { id: 13, name: '교양관', building: '교양교육센터(88-110호)', lat: 37.6314, lng: 127.2534, icon: '💡', qrCode: 'BOOTH_13' },
        { id: 14, name: '공학관', building: 'IT공학관', lat: 37.6309, lng: 127.2544, icon: '💻', qrCode: 'BOOTH_14' }
      ]);
    } catch (error) {
      console.error('부스 데이터 로딩 실패:', error);
    }
  };

  const generateQRCode = async (boothData) => {
    try {
      const canvas = canvasRef.current;
      
      // QR 코드 생성
      await QRCode.toCanvas(canvas, boothData.qrCode, {
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
    }
  };

  const downloadQRCode = (booth) => {
    const link = document.createElement('a');
    link.download = `QR_${booth.name}_${booth.qrCode}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const downloadAllQRCodes = async () => {
    for (const booth of booths) {
      await generateQRCode(booth);
      // 약간의 딜레이를 주고 다운로드
      await new Promise(resolve => setTimeout(resolve, 500));
      downloadQRCode(booth);
    }
    alert('모든 QR 코드 다운로드가 완료되었습니다!');
  };

  const handleCreateBooth = async (e) => {
    e.preventDefault();
    
    try {
      // TODO: 실제 API 호출
      // const response = await adminApi.createBooth(newBooth);
      
      const newBoothData = {
        id: booths.length + 1,
        ...newBooth,
        lat: parseFloat(newBooth.latitude),
        lng: parseFloat(newBooth.longitude),
        qrCode: `BOOTH_${String(booths.length + 1).padStart(2, '0')}`
      };

      setBooths([...booths, newBoothData]);
      setShowCreateModal(false);
      setNewBooth({
        name: '',
        building: '',
        latitude: '',
        longitude: '',
        icon: '🏛️'
      });
      
      alert('부스가 생성되었습니다!');
    } catch (error) {
      console.error('부스 생성 실패:', error);
      alert('부스 생성 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteBooth = async (boothId) => {
    if (!window.confirm('정말로 이 부스를 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await adminApi.deleteBooth(boothId);
      
      setBooths(booths.filter(b => b.id !== boothId));
      alert('부스가 삭제되었습니다!');
    } catch (error) {
      console.error('부스 삭제 실패:', error);
      alert('부스 삭제 중 오류가 발생했습니다.');
    }
  };

  const iconOptions = ['🏛️', '🎓', '🏢', '📖', '🛡️', '🔬', '🏫', '⚽', '🏠', '📚', '🔢', '✈️', '💡', '💻'];

  return (
    <div className="qr-manage-container">
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
          <div key={booth.id} className="qr-card">
            <div className="qr-card-header">
              <div className="booth-icon">{booth.icon}</div>
              <div className="booth-info">
                <h3 className="booth-name">{booth.name}</h3>
                <p className="booth-building">{booth.building}</p>
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
                <span className="info-value">{booth.qrCode}</span>
              </div>
              <div className="info-item">
                <span className="info-label">위치</span>
                <span className="info-value">{booth.lat}, {booth.lng}</span>
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
                onClick={() => handleDeleteBooth(booth.id)}
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
            
            <h2 className="preview-title">{selectedBooth.icon} {selectedBooth.name}</h2>
            <p className="preview-subtitle">{selectedBooth.building}</p>

            <div className="qr-preview-image">
              <img src={qrCodeUrl} alt={`QR Code for ${selectedBooth.name}`} />
            </div>

            <div className="preview-info">
              <div className="preview-info-item">
                <strong>QR 코드:</strong> {selectedBooth.qrCode}
              </div>
              <div className="preview-info-item">
                <strong>위치:</strong> {selectedBooth.lat}, {selectedBooth.lng}
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
                <label className="form-label">부스 이름</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 교육관"
                  value={newBooth.name}
                  onChange={(e) => setNewBooth({...newBooth, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">건물명</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 국제교육관(5층)"
                  value={newBooth.building}
                  onChange={(e) => setNewBooth({...newBooth, building: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">위도 (Latitude)</label>
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
                  <label className="form-label">경도 (Longitude)</label>
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