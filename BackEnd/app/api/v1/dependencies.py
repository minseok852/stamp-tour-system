# BackEnd/app/api/v1/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

# OAuth2PasswordBearer: API 요청의 Header에서 "Authorization: Bearer <token>"을 추출하는 헬퍼
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme) # Header에서 토큰 추출
):
    """현재 로그인한 사용자 정보 가져오기"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. 토큰 디코딩 (security.py 함수 사용)
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # 2. Payload에서 사용자 학번(sub) 추출
    student_id: str = payload.get("sub")
    if student_id is None:
        raise credentials_exception

    # 3. DB에서 사용자 객체 조회
    user = db.query(User).filter(User.student_id == student_id).first()
    if user is None:
        raise credentials_exception
        
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
):
    """관리자 권한 확인"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return current_user