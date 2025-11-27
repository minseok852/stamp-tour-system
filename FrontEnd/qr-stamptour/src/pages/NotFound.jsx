import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';
// 이 파일은 404 Not Found 페이지 입니다
const NotFound = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        {/* Animated 404 */}
        <div className="notfound-number">
          <span className="four">4</span>
          <span className="zero">0</span>
          <span className="four">4</span>
        </div>

        {/* Icon */}
        <div className="notfound-icon">🗺️</div>

        {/* Message */}
        <h1 className="notfound-title">길을 잃으셨나요?</h1>
        <p className="notfound-message">
          찾으시는 페이지가 존재하지 않습니다.<br/>
          주소를 다시 확인해주세요.
        </p>

        {/* Buttons */}
        <div className="notfound-buttons">
          <button className="home-button" onClick={goHome}>
            🏠 홈으로 돌아가기
          </button>
          {/*<button className="back-button" onClick={() => navigate(-1)}>
            ← 이전 페이지
          </button>*/}
        </div>

        {/* Suggestions */}
        <div className="notfound-suggestions">
          <p className="suggestions-title">🔍 이런 페이지를 찾으시나요?</p>
          <div className="suggestion-links">
            <button onClick={() => navigate('/')} className="suggestion-link">
              스탬프 투어
            </button>
            <button onClick={() => navigate('/signup')} className="suggestion-link">
              회원가입
            </button>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="notfound-bg">
        <div className="deco-circle"></div>
        <div className="deco-circle"></div>
        <div className="deco-circle"></div>
      </div>
    </div>
  );
};

export default NotFound;