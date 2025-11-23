from datetime import datetime, timedelta, timezone
from typing import Any, Union
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

# 1. 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. 비밀번호 검증 및 해싱 함수
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 해시된 비밀번호를 비교합니다."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """비밀번호를 해싱합니다."""
    return pwd_context.hash(password)

# 3. JWT 토큰 생성 함수
def create_access_token(
    data: dict, 
    expires_delta: Union[timedelta, None] = None
) -> str:
    """JWT Access Token을 생성합니다."""
    to_encode = data.copy()
    
    # 토큰 만료 시간 설정
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    
    # 토큰 인코딩
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM # HS256 사용 (config.py에 정의)
    )
    return encoded_jwt

# 4. JWT 토큰 검증 함수 (다음 단계에서 사용)
def decode_access_token(token: str) -> Union[dict, None]:
    """JWT 토큰을 디코딩하여 페이로드(Payload)를 반환합니다."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        # 토큰 만료, 잘못된 서명 등 JWT 관련 오류 발생 시 None 반환
        return None