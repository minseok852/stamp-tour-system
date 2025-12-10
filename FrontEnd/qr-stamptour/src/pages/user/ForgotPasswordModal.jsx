import React, { useState } from 'react';
import '../../styles/ForgotPasswordModal.css';//비밀번호 찾는 페이지 css

const ForgotPasswordModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    studentId: '',
    phone: '',
    verificationCode: '',
    codeVerified: false
  });

  if (!isOpen) return null;

  // 학번 및 전화번호 확인
  const verifyUser = async () => {
    if (formData.studentId.length < 8) {
      alert('학번은 8자리 이상이어야 합니다.');
      return;
    }

    if (formData.phone.length < 10) {
      alert('올바른 전화번호를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 FastAPI 호출
      // const response = await fetch('/api/verify-user', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     studentId: formData.studentId,
      //     phone: formData.phone
      //   })
      // });
      // const data = await response.json();
      
      // if (data.exists) {
      //   setStep(2);
      //   await sendVerificationCode();
      // } else {
      //   alert('일치하는 사용자 정보가 없습니다.');
      // }

      // 임시 처리
      setStep(2);
      await sendVerificationCode();
    } catch (error) {
      alert('사용자 확인 중 오류가 발생했습니다.');
    }
  };

  // 인증번호 발송
  const sendVerificationCode = async () => {
    try {
      // TODO: 실제 SMS API 호출
      // const response = await fetch('/api/send-verification-reset', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: formData.phone })
      // });
      
      alert('인증번호가 발송되었습니다!');
    } catch (error) {
      alert('인증번호 발송 중 오류가 발생했습니다.');
    }
  };

  // 인증번호 재발송
  const resendCode = async () => {
    await sendVerificationCode();
  };

  // 인증번호 확인
  const verifyCode = async () => {
    if (formData.verificationCode.length !== 6) {
      alert('6자리 인증번호를 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 API 호출
      // const response = await fetch('/api/verify-code-reset', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     phone: formData.phone,
      //     code: formData.verificationCode
      //   })
      // });
      // const data = await response.json();
      
      // if (data.verified) {
      //   setFormData({ ...formData, codeVerified: true });
      //   await sendTemporaryPassword();
      // } else {
      //   alert('인증번호가 올바르지 않습니다.');
      // }

      // 임시 처리
      setFormData({ ...formData, codeVerified: true });
      await sendTemporaryPassword();
    } catch (error) {
      alert('인증번호 확인 중 오류가 발생했습니다.');
    }
  };

  // 임시 비밀번호 발송
  const sendTemporaryPassword = async () => {
    try {
      // TODO: 실제 API 호출
      // const response = await fetch('/api/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     studentId: formData.studentId,
      //     phone: formData.phone
      //   })
      // });
      // const data = await response.json();
      
      setStep(3);
      
      setTimeout(() => {
        handleClose();
        if (onComplete) {
          onComplete();
        }
      }, 3000);
    } catch (error) {
      alert('임시 비밀번호 발송 중 오류가 발생했습니다.');
    }
  };

  // 모달 닫기 및 초기화
  const handleClose = () => {
    setStep(1);
    setFormData({
      studentId: '',
      phone: '',
      verificationCode: '',
      codeVerified: false
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>×</button>

        {/* Progress Indicator */}
        <div className="forgot-password-steps">
          <div className={`forgot-password-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <div className="forgot-password-line"></div>
          <div className={`forgot-password-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <div className="forgot-password-line"></div>
          <div className={`forgot-password-step ${step >= 3 ? 'active' : ''}`}>
            {step >= 3 ? '✓' : '3'}
          </div>
        </div>

        {/* Step 1: 학번 및 전화번호 입력 */}
        {step === 1 && (
          <div className="forgot-password-section">
            <div className="forgot-password-header">
              <div className="forgot-password-icon">🔑</div>
              <h2 className="forgot-password-title">비밀번호 찾기</h2>
              <p className="forgot-password-subtitle">
                학번과 전화번호를 입력해주세요
              </p>
            </div>

            <div className="forgot-password-form">
              <div className="login-input-group">
                <label className="login-label">학번</label>
                <div style={{ position: 'relative' }}>
                  
                  <input
                    type="text"
                    className="login-input"
                    placeholder="학번 8자리"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    maxLength="8"
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label className="login-label">전화번호</label>
                <div style={{ position: 'relative' }}>
                  
                  <input
                    type="tel"
                    className="login-input"
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <button
                className="forgot-password-button"
                onClick={verifyUser}
                disabled={!formData.studentId || !formData.phone}
              >
                다음 단계로 →
              </button>
            </div>

            <div className="forgot-password-info">
              <p>💡 가입 시 등록한 전화번호를 입력해주세요</p>
            </div>
          </div>
        )}

        {/* Step 2: 인증번호 입력 */}
        {step === 2 && (
          <div className="forgot-password-section">
            <div className="forgot-password-header">
              <div className="forgot-password-icon">📱</div>
              <h2 className="forgot-password-title">본인 인증</h2>
              <p className="forgot-password-subtitle">
                {formData.phone}로 발송된<br/>
                인증번호를 입력해주세요
              </p>
            </div>

            <div className="forgot-password-form">
              <div className="login-input-group">
                <label className="login-label">인증번호</label>
                <div style={{ position: 'relative' }}>
                  
                  <input
                    type="text"
                    className="login-input"
                    placeholder="6자리 인증번호"
                    value={formData.verificationCode}
                    onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                    maxLength="6"
                  />
                </div>
              </div>

              <button
                className="forgot-password-button"
                onClick={verifyCode}
                disabled={formData.verificationCode.length !== 6}
              >
                인증하고 임시 비밀번호 받기
              </button>

              <button
                className="forgot-password-button-secondary"
                onClick={resendCode}
              >
                🔄 인증번호 재발송
              </button>
            </div>

            <div className="forgot-password-info">
              <p>⏰ 인증번호는 3분간 유효합니다</p>
              <p>📱 인증번호가 오지 않으면 재발송 버튼을 눌러주세요</p>
            </div>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === 3 && (
          <div className="forgot-password-section">
            <div className="forgot-password-success">
              <div className="success-checkmark">✓</div>
              <h2 className="forgot-password-title">임시 비밀번호 발송 완료!</h2>
              <p className="forgot-password-subtitle">
                {formData.phone}로<br/>
                임시 비밀번호가 발송되었습니다
              </p>

              <div className="forgot-password-notice">
                <h4>📌 다음 단계</h4>
                <ol>
                  <li>문자로 받은 임시 비밀번호로 로그인</li>
                  <li>로그인 후 반드시 비밀번호 변경</li>
                  <li>보안을 위해 임시 비밀번호는 24시간만 유효</li>
                </ol>
              </div>

              <button
                className="forgot-password-button"
                onClick={handleClose}
              >
                로그인 페이지로 이동
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        {step > 1 && step < 3 && (
          <button
            className="forgot-password-back"
            onClick={() => setStep(step - 1)}
          >
            ← 이전으로
          </button>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;