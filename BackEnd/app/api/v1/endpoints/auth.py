#로그인/인증 (관리자, 사용자)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta # 추가
from app.db.session import get_db
from app.schemas.register import UserRegister
from app.schemas.user import UserResponse
from app.schemas.token import Token, TokenRequest # token.py를 생성하고 import
from app.models.user import User
# security.py에서 필요한 함수들을 import
from app.core.security import get_password_hash, verify_password, create_access_token 
from app.core.config import settings # ACCESS_TOKEN_EXPIRE_MINUTES 사용을 위해 import

router = APIRouter()

# --- 로그인 API: JWT 토큰 발급 ---
@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: TokenRequest,
    db: Session = Depends(get_db)
):
    # 1. DB에서 사용자 정보 조회
    user = db.query(User).filter(User.student_id == form_data.student_id).first()
    
    # 2. 사용자 존재 여부 및 비밀번호 검증 (security.py의 verify_password 사용)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="학번 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. JWT 토큰 생성 (security.py의 create_access_token 사용)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.student_id}, # 토큰 페이로드: 사용자를 식별할 학번
        expires_delta=access_token_expires
    )
    
    # 4. 토큰 반환
    return {"access_token": access_token, "token_type": "bearer"}

# DB 연결을 확인하고 데이터를 삽입하는 첫 번째 API
@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db) # DB 세션 주입
):
    # 1. 학번 중복 확인
    db_user = db.query(User).filter(User.student_id == user_data.student_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 학번입니다.")

    # 2. 비밀번호 해싱
    hashed_password = get_password_hash(user_data.password)

    # 3. User 모델 객체 생성
    new_user = User(
        student_id=user_data.student_id,
        password_hash=hashed_password,
        name=user_data.name,
        phone_number=user_data.phone_number,
        dept_name=user_data.dept_name,
        grade=user_data.grade,
        gender=user_data.gender
    )

    # 4. DB에 저장 및 커밋
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # DB에서 생성된 created_at 시간 등을 가져옴

    return new_user