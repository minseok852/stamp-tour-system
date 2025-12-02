// src/pages/admin/Login.jsx
// 관리자 및 학생들 로그인 (공통)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authApi';
import '../../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 입력 시 에러 초기화
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData.studentId, formData.password);
      
      //console.log('로그인 성공:', response);
      
      // 역할에 따라 리다이렉트
      if (response.user.role === 'admin') {
        alert(`환영합니다, ${response.user.name} 관리자님!`);
        navigate('/admin/dashboard');
      } else {
        alert(`환영합니다, ${response.user.name}님!`);
        navigate('/');  // Home으로
      }
    } catch (err) {
      //console.error('로그인 에러:', err);
      setError(err.detail || '로그인에 실패했습니다. 학번과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">🎓</div>
            <h1 className="login-title">대진대 스탬프 투어</h1>
            <p className="login-subtitle">로그인</p>
          </div>

          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label className="login-label">학번</label>
              <div style={{ position: 'relative' }}>
                
                <input
                  type="text"
                  name="studentId"
                  className="login-input"
                  placeholder="학번 8자리"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  maxLength="8"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">비밀번호</label>
              <div style={{ position: 'relative' }}>
                
                <input
                  type="password"
                  name="password"
                  className="login-input"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button-submit"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="login-actions">
            <button
              type="button"
              className="login-action-link"
              onClick={() => navigate('/signup')}
            >
              회원가입
            </button>
            <span className="divider">|</span>
            <button
              type="button"
              className="login-action-link"
              onClick={() => navigate('/forgotpasswordmodal')}
            >
              비밀번호 찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;