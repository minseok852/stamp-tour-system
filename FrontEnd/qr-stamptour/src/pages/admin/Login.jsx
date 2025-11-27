//관리자 및 학생들 로그인
// src/pages/admin/Login.jsx
// 관리자 및 학생들 로그인
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authApi';
import '../../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({
    studentId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value
    });
    // 입력 시 에러 메시지 제거
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 로그인 API 호출
      const response = await loginUser({
        studentId: loginForm.studentId,
        password: loginForm.password
      });

      console.log('로그인 성공:', response);

      // 성공 메시지
      alert(`${response.user.name}님, 환영합니다!`);

      // 홈 페이지로 이동 (또는 이전 페이지)
      navigate('/');
    } catch (err) {
      console.error('로그인 실패:', err);
      setError(err.detail || '로그인에 실패했습니다. 학번과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigate('/signup');
  };

  const handleForgotPassword = () => {
    navigate('/forgotpasswordmodal');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🎓</div>
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">대진대 QR 스탬프 투어</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">학번</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="studentId"
                className="form-input"
                placeholder="학번 8자리"
                value={loginForm.studentId}
                onChange={handleChange}
                maxLength="8"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="비밀번호"
                value={loginForm.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="login-actions">
            <button
              type="button"
              className="action-link"
              onClick={handleSignupRedirect}
            >
              회원가입
            </button>
            <span className="divider">|</span>
            <button
              type="button"
              className="action-link"
              onClick={handleForgotPassword}
            >
              비밀번호 찾기
            </button>
          </div>
        </form>

        <div className="login-info">
          <p>💡 대진대학교 재학생만 이용 가능합니다</p>
          <p>📱 문의: 학생지원팀 (031-123-4567)</p>
        </div>
      </div>
    </div>
  );
};

export default Login;