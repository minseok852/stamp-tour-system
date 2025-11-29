//이건 회원가입 페이지로 사용자 아이디, 비번, 이름 등 입력 받는 회원가입 홈페이지
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkStudentId, registerUser } from '../../services/authApi';
import '../../styles/Signupmodal.css'; 

const Signup = ({ isOpen, onClose, onSignupComplete }) => {
  const navigate = useNavigate();
  const [signupStep, setSignupStep] = useState(1);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // 학번 중복 확인
  const checkStudentIdHandler = async () => {
    if (signupForm.studentId.length < 8) {
      alert('학번은 8자리 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await checkStudentId(signupForm.studentId);
      
      if (result.available) {
        setSignupForm({ ...signupForm, studentIdChecked: true });
        alert('사용 가능한 학번입니다!');
      } else {
        alert(result.message || '이미 사용 중인 학번입니다.');
      }
    } catch (error) {
      //console.error('중복 확인 실패:', error);
      alert('학번 중복 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인증번호 발송 (더미 - 자동 통과)
  const sendVerificationCode = async () => {
    if (signupForm.phone.length < 10) {
      alert('올바른 전화번호를 입력해주세요.');
      return;
    }

    alert('인증번호가 발송되었습니다! (테스트: 123456 입력)');
  };

  // 전화번호 인증 (더미 - 123456으로 고정)
  const verifyPhone = async () => {
    if (signupForm.verificationCode.length !== 6) {
      alert('6자리 인증번호를 입력해주세요.');
      return;
    }

    // 테스트용: 123456이면 통과
    if (signupForm.verificationCode === '123456') {
      setSignupForm({ ...signupForm, phoneVerified: true });
      alert('전화번호 인증이 완료되었습니다!');
    } else {
      alert('인증번호가 올바르지 않습니다. (테스트: 123456)');
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
    // 1단계 검증
    if (signupStep === 1) {
      if (!signupForm.studentIdChecked) {
        alert('학번 중복확인을 해주세요!');
        return;
      }
      if (!signupForm.name) {
        alert('이름을 입력해주세요!');
        return;
      }
    }

    // 2단계 검증
    if (signupStep === 2) {
      if (signupForm.password.length < 8) {
        alert('비밀번호는 8자 이상이어야 합니다!');
        return;
      }
      if (signupForm.password !== signupForm.passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다!');
        return;
      }
    }

    // 3단계 검증
    if (signupStep === 3) {
      if (!signupForm.phoneVerified) {
        alert('전화번호 인증을 완료해주세요!');
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
    setLoading(true);
    setError('');

    try {
      // API 호출
      const response = await registerUser({
        studentId: signupForm.studentId,
        password: signupForm.password,
        name: signupForm.name,
        phone: signupForm.phone,
        department: signupForm.department,
        grade: signupForm.grade,
        gender: signupForm.gender
      });

      //console.log('회원가입 성공:', response);
      setSignupStep(5);
      
      setTimeout(() => {
        // 초기화
        setSignupStep(1);
        setSignupForm({
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
        
        if (onSignupComplete) {
          onSignupComplete(signupForm);
        }
        
        // 로그인 페이지로 이동
        onClose();
        navigate('/login');
      }, 2000);
    } catch (error) {
      //console.error('회원가입 실패:', error);
      const errorMessage = error.response?.data?.detail || '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(signupForm.password);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content signup-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Error Banner */}
        {error && (
          <div className="error-banner" style={{
            background: '#fee',
            color: '#c00',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            ⚠️ {error}
          </div>
        )}

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
                    disabled={loading}
                  />
                </div>
                <button 
                  type="button"
                  className={`check-button ${signupForm.studentIdChecked ? 'verified' : ''}`}
                  onClick={checkStudentIdHandler}
                  disabled={signupForm.studentIdChecked || loading}
                >
                  {loading ? '확인중...' : signupForm.studentIdChecked ? '✓ 확인완료' : '중복확인'}
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
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 비밀번호 설정 */}
        {signupStep === 2 && (
          <div className="signup-form-section">
            <h3 className="signup-title">비밀번호 설정</h3>
            <p className="signup-subtitle">안전한 비밀번호를 설정해주세요 (8자 이상)</p>
            
            <div className="login-input-group">
              <label className="login-label">비밀번호</label>
              <div style={{ position: 'relative' }}>
                <span className="login-input-icon">🔒</span>
                <input 
                  type="password"
                  className="login-input"
                  placeholder="비밀번호 (8자 이상)"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                />
              </div>
              {passwordStrength && (
                <div className={`password-strength ${passwordStrength}`}>
                  {passwordStrength === 'weak' && '⚠️ 약한 비밀번호입니다'}
                  {passwordStrength === 'medium' && '✓ 보통 수준의 비밀번호입니다'}
                  {passwordStrength === 'strong' && '✓✓ 강력한 비밀번호입니다!'}
                </div>
              )}
            </div>

            <div className="login-input-group">
              <label className="login-label">비밀번호 확인</label>
              <div style={{ position: 'relative' }}>
                <span className="login-input-icon">🔒</span>
                <input 
                  type="password"
                  className="login-input"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={signupForm.passwordConfirm}
                  onChange={(e) => setSignupForm({ ...signupForm, passwordConfirm: e.target.value })}
                />
              </div>
              {signupForm.passwordConfirm && (
                <div className={`password-strength ${signupForm.password === signupForm.passwordConfirm ? 'strong' : 'weak'}`}>
                  {signupForm.password === signupForm.passwordConfirm ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: 전화번호 인증 */}
        {signupStep === 3 && (
          <div className="signup-form-section">
            <h3 className="signup-title">본인 인증</h3>
            <p className="signup-subtitle">전화번호로 본인인증을 진행해주세요</p>
            
            <div className="login-input-group">
              <label className="login-label">전화번호</label>
              <div className="input-with-button">
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className="login-input-icon">📱</span>
                  <input 
                    type="tel"
                    className="login-input"
                    placeholder="010-0000-0000"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>
                <button 
                  type="button"
                  className="check-button"
                  onClick={sendVerificationCode}
                >
                  인증번호 발송
                </button>
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">인증번호 (테스트: 123456)</label>
              <div className="input-with-button">
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className="login-input-icon">🔢</span>
                  <input 
                    type="text"
                    className="login-input"
                    placeholder="6자리 인증번호"
                    value={signupForm.verificationCode}
                    onChange={(e) => setSignupForm({ ...signupForm, verificationCode: e.target.value })}
                    maxLength="6"
                  />
                </div>
                <button 
                  type="button"
                  className={`check-button ${signupForm.phoneVerified ? 'verified' : ''}`}
                  onClick={verifyPhone}
                  disabled={signupForm.phoneVerified}
                >
                  {signupForm.phoneVerified ? '✓ 인증완료' : '인증하기'}
                </button>
              </div>
            </div>

            {signupForm.phoneVerified && (
              <div className="verification-info">
                ✓ 전화번호 인증이 완료되었습니다!
              </div>
            )}
          </div>
        )}

        {/* Step 4: 추가정보 */}
        {signupStep === 4 && (
          <div className="signup-form-section">
            <h3 className="signup-title">추가 정보</h3>
            <p className="signup-subtitle">학생 정보를 입력해주세요</p>
            
            <div className="login-input-group">
              <label className="login-label">학과</label>
              <div style={{ position: 'relative' }}>
                <span className="login-input-icon">🏫</span>
                <select 
                  className="login-input"
                  value={signupForm.department}
                  onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                  disabled={loading}
                >
                  <option value="">학과를 선택하세요</option>
                  <option value="컴퓨터공학과">컴퓨터공학과</option>
                  <option value="스마트모빌리티전공">스마트모빌리티전공</option>
                  <option value="AI빅데이터전공">AI빅데이터전공</option>
                  <option value="스마트융합보안학과">스마트융합보안학과</option>
                  <option value="전기공학과">전기공학과</option>
                  <option value="화학공학과">화학공학과</option>
                  <option value="건축공학과">건축공학과</option>
                  <option value="스마트건설환경공학과">스마트건설환경공학과</option>
                  <option value="데이터경영산업공학과">데이터경영산업공학과</option>
                  <option value="반도체융합공학과">반도체융합공학과</option>
                  <option value="IT기계공학과">IT기계공학과</option>
                  <option value="공학자율학부">공학자율학부</option>
                  <option value="자율전공학부">자율전공학부</option>
                  <option value="대순종학과">대순종학과</option>
                  <option value="영어영문학과">영어영문학과</option>
                  <option value="역사문화콘텐츠학과">역사문화콘텐츠학과</option>
                  <option value="문예콘텐츠창작학과">문예콘텐츠창작학과</option>
                  <option value="미술만화게임학부">미술만화게임학부</option>
                  <option value="시각디자인학과">시각디자인학과</option>
                  <option value="산업디자인학과">산업디자인학과</option>
                  <option value="영화영상학과">영화영상학과</option>
                  <option value="연기예술학과">연기예술학과</option>
                  <option value="실용음학학과">실용음악학과</option>
                  <option value="글로벌경제학과">글로벌경제학과</option>
                  <option value="경영학과">경영학과</option>
                  <option value="국제통상학과">국제통상학과</option>
                  <option value="국제지역학전공">국제지역학전공</option>
                  <option value="중국학전공">중국학전공</option>
                  <option value="공공인재법학과">공공인재법학과</option>
                  <option value="행정정보학과">행정정보학과</option>
                  <option value="사회복지학과">사회복지학과</option>
                  <option value="아동학과">아동학과</option>
                  <option value="미디어커뮤니케이션학과">미디어커뮤니케이션학과</option>
                  <option value="문헌정보학과">문헌정보학과</option>
                  <option value="의생명과학과">의생명과학과</option>
                  <option value="간호학과">간호학과</option>
                  <option value="스포츠건강과학과">스포츠건강과학과</option>
                  <option value="식품영양학과">식품영양학과</option>
                  <option value="보건경영학과">보건경영학과</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="login-input-group">
                <label className="login-label">학년</label>
                <div style={{ position: 'relative' }}>
                  <span className="login-input-icon">📚</span>
                  <select 
                    className="login-input"
                    value={signupForm.grade}
                    onChange={(e) => setSignupForm({ ...signupForm, grade: e.target.value })}
                    disabled={loading}
                  >
                    <option value="">학년 선택</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">성별</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="male" 
                    name="gender" 
                    value="male"
                    checked={signupForm.gender === 'male'}
                    onChange={(e) => setSignupForm({ ...signupForm, gender: e.target.value })}
                    disabled={loading}
                  />
                  <label htmlFor="male" className="radio-label">남성</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="female" 
                    name="gender" 
                    value="female"
                    checked={signupForm.gender === 'female'}
                    onChange={(e) => setSignupForm({ ...signupForm, gender: e.target.value })}
                    disabled={loading}
                  />
                  <label htmlFor="female" className="radio-label">여성</label>
                </div>
              </div>
            </div>
          </div>
        )}

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
                disabled={loading}
              >
                ← 이전
              </button>
            )}
            <button 
              type="button"
              className="signup-nav-button next"
              onClick={handleNext}
              disabled={
                loading ||
                (signupStep === 1 && (!signupForm.studentIdChecked || !signupForm.name)) ||
                (signupStep === 2 && (!signupForm.password || !signupForm.passwordConfirm)) ||
                (signupStep === 3 && !signupForm.phoneVerified) ||
                (signupStep === 4 && (!signupForm.department || !signupForm.grade || !signupForm.gender))
              }
            >
              {loading ? '처리중...' : signupStep === 4 ? '가입완료 →' : '다음 →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;