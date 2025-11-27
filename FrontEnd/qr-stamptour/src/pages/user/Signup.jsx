// src/pages/user/Signup.jsx
// 회원가입 페이지 (API 연동 버전)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authApi';
import '../../styles/Signupmodal.css';

const Signup = () => {
  const navigate = useNavigate();
  const [signupStep, setSignupStep] = useState(1);
  const [error, setError] = useState('');
  const [signupForm, setSignupForm] = useState({
    studentId: '',
    studentIdChecked: false,
    password: '',
    passwordConfirm: '',
    phone: '',
    verificationCode: '',
    phoneVerified: false,
    department: '',
    grade: '',
    gender: '',
    name: ''
  });

  // 학번 중복 확인
  const checkStudentId = async () => {
    if (signupForm.studentId.length < 8) {
      alert('학번은 8자리 이상이어야 합니다.');
      return;
    }

    try {
      // TODO: 실제 중복 확인 API 호출
      // 임시 처리
      setSignupForm({ ...signupForm, studentIdChecked: true });
      alert('사용 가능한 학번입니다!');
    } catch (error) {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 인증번호 발송
  const sendVerificationCode = async () => {
    if (signupForm.phone.length < 10) {
      alert('올바른 전화번호를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 SMS API 호출
      alert('인증번호가 발송되었습니다!');
    } catch (error) {
      alert('인증번호 발송 중 오류가 발생했습니다.');
    }
  };

  // 전화번호 인증
  const verifyPhone = async () => {
    if (signupForm.verificationCode.length !== 6) {
      alert('6자리 인증번호를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 인증 API 호출
      setSignupForm({ ...signupForm, phoneVerified: true });
      alert('전화번호 인증이 완료되었습니다!');
    } catch (error) {
      alert('인증번호가 올바르지 않습니다.');
    }
  };

  // 비밀번호 강도 체크
  const getPasswordStrength = (password) => {
    if (password.length < 6) return null;
    if (password.length < 8) return 'weak';
    if (password.match(/^(?=.*[a-zA-Z])(?=.*[0-9])/)) return 'strong';
    return 'medium';
  };

  // 다음 단계
  const handleNext = () => {
    setError('');

    // 1단계 검증
    if (signupStep === 1) {
      if (!signupForm.studentIdChecked) {
        setError('학번 중복확인을 해주세요!');
        return;
      }
      if (!signupForm.name) {
        setError('이름을 입력해주세요!');
        return;
      }
    }

    // 2단계 검증
    if (signupStep === 2) {
      if (signupForm.password.length < 8) {
        setError('비밀번호는 8자 이상이어야 합니다!');
        return;
      }
      if (signupForm.password !== signupForm.passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다!');
        return;
      }
    }

    // 3단계 검증
    if (signupStep === 3) {
      if (!signupForm.phoneVerified) {
        setError('전화번호 인증을 완료해주세요!');
        return;
      }
    }

    // 4단계 완료
    if (signupStep === 4) {
      handleSignupComplete();
      return;
    }

    setSignupStep(signupStep + 1);
  };

  // 회원가입 완료
  const handleSignupComplete = async () => {
    setError('');
    
    try {
      // API 호출
      await registerUser({
        studentId: signupForm.studentId,
        password: signupForm.password,
        name: signupForm.name,
        phone: signupForm.phone,
        department: signupForm.department,
        grade: signupForm.grade,
        gender: signupForm.gender
      });

      setSignupStep(5);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('회원가입 실패:', error);
      setError(error.detail || '회원가입 중 오류가 발생했습니다.');
      alert(error.detail || '회원가입 중 오류가 발생했습니다.');
    }
  };

  const passwordStrength = getPasswordStrength(signupForm.password);

  return (
    <div className="modal-overlay">
      <div className="modal-content signup-modal-content">
        <button className="modal-close" onClick={() => navigate('/login')}>×</button>

        {/* Progress Steps */}
        <div className="signup-steps">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step}
              className={`signup-step ${signupStep >= step ? 'active' : ''} ${signupStep > step ? 'completed' : ''}`}
            >
              {signupStep > step ? '✓' : step}
              <span className="signup-step-label">
                {step === 1 && '학번'}
                {step === 2 && '비밀번호'}
                {step === 3 && '본인인증'}
                {step === 4 && '추가정보'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: 학번 입력 */}
        {signupStep === 1 && (
          <div className="signup-form-section">
            <h3 className="signup-title">학번 입력</h3>
            <p className="signup-subtitle">로그인 시 사용할 학번을 입력해주세요</p>
            
            <div className="login-input-group">
              <label className="login-label">학번 (아이디)</label>
              <div className="input-with-button">
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className="login-input-icon">🎓</span>
                  <input 
                    type="text"
                    className="login-input"
                    placeholder="학번 8자리"
                    value={signupForm.studentId}
                    onChange={(e) => setSignupForm({ ...signupForm, studentId: e.target.value, studentIdChecked: false })}
                    maxLength="8"
                  />
                </div>
                <button 
                  type="button"
                  className={`check-button ${signupForm.studentIdChecked ? 'verified' : ''}`}
                  onClick={checkStudentId}
                  disabled={signupForm.studentIdChecked}
                >
                  {signupForm.studentIdChecked ? '✓ 확인완료' : '중복확인'}
                </button>
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">이름</label>
              <div style={{ position: 'relative' }}>
                <span className="login-input-icon">👤</span>
                <input 
                  type="text"
                  className="login-input"
                  placeholder="이름을 입력하세요"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2-4: 나머지 단계는 기존 코드와 동일 */}
        {/* 여기서는 생략 - 원본 Signup.jsx의 2-4단계를 그대로 유지 */}

        {/* Step 5: 완료 */}
        {signupStep === 5 && (
          <div className="signup-form-section">
            <div className="success-animation">
              <div className="success-checkmark">✓</div>
              <h3 className="signup-title">회원가입 완료!</h3>
              <p className="signup-subtitle">
                {signupForm.name}님, 환영합니다!<br/>
                로그인 페이지로 이동합니다...
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {signupStep < 5 && (
          <div className="signup-nav-buttons">
            {signupStep > 1 && (
              <button 
                type="button"
                className="signup-nav-button prev"
                onClick={() => setSignupStep(signupStep - 1)}
              >
                ← 이전
              </button>
            )}
            <button 
              type="button"
              className="signup-nav-button next"
              onClick={handleNext}
              disabled={
                (signupStep === 1 && (!signupForm.studentIdChecked || !signupForm.name)) ||
                (signupStep === 2 && (!signupForm.password || !signupForm.passwordConfirm)) ||
                (signupStep === 3 && !signupForm.phoneVerified) ||
                (signupStep === 4 && (!signupForm.department || !signupForm.grade || !signupForm.gender))
              }
            >
              {signupStep === 4 ? '가입완료 →' : '다음 →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;